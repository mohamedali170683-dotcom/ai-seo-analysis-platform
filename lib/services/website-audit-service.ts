/**
 * Website Audit Service
 * Scrapes and analyzes websites for technical SEO factors that impact AI visibility
 * 
 * REAL CRAWLER: This service makes actual HTTP requests to:
 * 1. Homepage
 * 2. robots.txt
 * 3. sitemap.xml (if available)
 * 4. Key pages discovered from sitemap or links (FAQ, Products, About, etc.)
 */

export interface SchemaMarkup {
  type: string;
  found: boolean;
  foundOnPages?: string[];
  details?: any;
}

export interface CrawledPage {
  url: string;
  status: number | 'error';
  title: string;
  schemas: string[];
  wordCount: number;
  hasFAQ: boolean;
  crawlTimeMs: number;
}

export interface WebsiteAuditResult {
  url: string;
  crawledAt: Date;
  
  // Crawl Info - NEW: Shows exactly what was crawled
  pagesCrawled: CrawledPage[];
  totalPagesCrawled: number;
  sitemapFound: boolean;
  sitemapUrl: string | null;
  
  // Basic Info
  title: string;
  description: string;
  canonical: string | null;
  
  // Schema Markup
  schemas: SchemaMarkup[];
  hasOrganizationSchema: boolean;
  hasProductSchema: boolean;
  hasFAQSchema: boolean;
  hasReviewSchema: boolean;
  hasBreadcrumbSchema: boolean;
  
  // Content Structure
  h1Count: number;
  h2Count: number;
  h3Count: number;
  h1Text: string[];
  wordCount: number;
  
  // FAQ Detection
  hasFAQSection: boolean;
  faqQuestions: string[];
  
  // Technical
  robotsTxtAccessible: boolean;
  robotsTxtContent: string | null;
  allowsAIBots: boolean;
  
  // Transparency - explain WHY we made each determination
  robotsAnalysisReason: string;
  sitemapAnalysisReason: string;
  productSchemaReason: string;
  
  // Performance Indicators
  hasSSL: boolean;
  loadTimeMs: number;
  
  // Issues & Recommendations
  issues: AuditIssue[];
  recommendations: TechnicalRecommendation[];
  
  // Score
  technicalScore: number;
}

export interface AuditIssue {
  severity: "critical" | "warning" | "info";
  category: string;
  issue: string;
  impact: string;
}

export interface TechnicalRecommendation {
  priority: "high" | "medium" | "low";
  category: string;
  recommendation: string;
  rationale: string;
  implementationGuide: string;
  expectedImpact: string;
}

export class WebsiteAuditService {
  private timeout: number;
  private maxPagesToCrawl: number;

  constructor(timeout: number = 10000, maxPagesToCrawl: number = 15) {
    this.timeout = timeout;
    this.maxPagesToCrawl = maxPagesToCrawl; // Increased from 10 to 15 for better schema coverage
  }

  /**
   * Run full website audit with MULTI-PAGE CRAWLING
   * 
   * Crawl order:
   * 1. Homepage (always)
   * 2. robots.txt (always)
   * 3. sitemap.xml (if available)
   * 4. Key pages from sitemap OR discovered from homepage links
   */
  async auditWebsite(domain: string): Promise<WebsiteAuditResult> {
    const baseUrl = domain.startsWith("http") ? domain : `https://${domain}`;
    const startTime = Date.now();
    
    console.log(`\n${"=".repeat(60)}`);
    console.log(`🔍 [AUDIT] REAL WEBSITE CRAWLER - Starting audit for: ${baseUrl}`);
    console.log(`${"=".repeat(60)}`);

    const crawledPages: CrawledPage[] = [];
    const allSchemaTypes = new Map<string, string[]>(); // type -> pages where found
    let allFaqQuestions: string[] = [];
    let totalWordCount = 0;
    let totalH1Count = 0;
    let totalH2Count = 0;
    let totalH3Count = 0;
    let allH1Text: string[] = [];

    try {
      // Step 1: Fetch robots.txt
      console.log(`\n📋 [CRAWL] Step 1: Checking robots.txt...`);
      const robotsData = await this.checkRobotsTxt(baseUrl);
      console.log(`   ✓ robots.txt accessible: ${robotsData.accessible}`);
      console.log(`   ✓ AI bots allowed: ${robotsData.allowsAIBots}`);

      // Step 2: Fetch homepage
      console.log(`\n📄 [CRAWL] Step 2: Fetching homepage: ${baseUrl}`);
      const homepageStart = Date.now();
      const homepageData = await this.fetchAndParsePage(baseUrl);
      const homepageCrawlTime = Date.now() - homepageStart;
      
      const homepageSchemas = this.analyzeSchemas(homepageData.html);
      const homepageContent = this.analyzeContent(homepageData.html);
      const homepageFaq = this.detectFAQSections(homepageData.html);
      
      crawledPages.push({
        url: baseUrl,
        status: 200,
        title: homepageData.title,
        schemas: homepageSchemas.filter(s => s.found).map(s => s.type),
        wordCount: homepageContent.wordCount,
        hasFAQ: homepageFaq.hasFAQ,
        crawlTimeMs: homepageCrawlTime,
      });
      
      // Track schemas found on homepage
      homepageSchemas.filter(s => s.found).forEach(s => {
        if (!allSchemaTypes.has(s.type)) allSchemaTypes.set(s.type, []);
        allSchemaTypes.get(s.type)!.push(baseUrl);
      });
      
      totalWordCount += homepageContent.wordCount;
      totalH1Count += homepageContent.h1Count;
      totalH2Count += homepageContent.h2Count;
      totalH3Count += homepageContent.h3Count;
      allH1Text = [...allH1Text, ...homepageContent.h1Text];
      allFaqQuestions = [...allFaqQuestions, ...homepageFaq.questions];

      console.log(`   ✓ Title: "${homepageData.title}"`);
      console.log(`   ✓ Word count: ${homepageContent.wordCount}`);
      console.log(`   ✓ Schemas found: ${homepageSchemas.filter(s => s.found).map(s => s.type).join(", ") || "none"}`);
      console.log(`   ✓ FAQ detected: ${homepageFaq.hasFAQ}`);

      // Step 3: Try to fetch sitemap.xml (using URL from robots.txt if available)
      console.log(`\n🗺️  [CRAWL] Step 3: Looking for sitemap.xml...`);
      const sitemapData = await this.fetchSitemap(baseUrl, robotsData.sitemapFromRobots);
      
      // Step 4: Discover pages to crawl
      let pagesToCrawl: string[] = [];
      
      if (sitemapData.found && sitemapData.urls.length > 0) {
        console.log(`   ✓ Sitemap found at: ${sitemapData.url}`);
        console.log(`   ✓ URLs in sitemap: ${sitemapData.urls.length}`);
        pagesToCrawl = this.selectKeyPagesFromSitemap(sitemapData.urls, baseUrl);
      } else {
        console.log(`   ✗ No sitemap found, discovering pages from homepage links...`);
        pagesToCrawl = this.discoverPagesFromLinks(homepageData.html, baseUrl);
      }
      
      // Also add common important pages that might not be linked
      const commonPages = ['/faq', '/faqs', '/products', '/services', '/about', '/contact', '/pricing'];
      for (const page of commonPages) {
        const fullUrl = new URL(page, baseUrl).toString();
        if (!pagesToCrawl.includes(fullUrl) && fullUrl !== baseUrl) {
          pagesToCrawl.push(fullUrl);
        }
      }
      
      // Limit pages to crawl
      pagesToCrawl = pagesToCrawl.slice(0, this.maxPagesToCrawl - 1); // -1 because homepage already crawled
      
      console.log(`\n📑 [CRAWL] Step 4: Crawling ${pagesToCrawl.length} additional pages...`);
      
      // Step 5: Crawl additional pages in parallel (batches of 3)
      for (let i = 0; i < pagesToCrawl.length; i += 3) {
        const batch = pagesToCrawl.slice(i, i + 3);
        const batchResults = await Promise.all(
          batch.map(url => this.crawlSinglePage(url, allSchemaTypes))
        );
        
        for (const result of batchResults) {
          if (result) {
            crawledPages.push(result.crawledPage);
            totalWordCount += result.content.wordCount;
            totalH1Count += result.content.h1Count;
            totalH2Count += result.content.h2Count;
            totalH3Count += result.content.h3Count;
            allH1Text = [...allH1Text, ...result.content.h1Text];
            allFaqQuestions = [...allFaqQuestions, ...result.faq.questions];
          }
        }
      }

      const loadTimeMs = Date.now() - startTime;

      // Build final schema list with pages where each was found
      const schemas: SchemaMarkup[] = [
        "Organization", "Product", "FAQPage", "Review", "AggregateRating",
        "BreadcrumbList", "Article", "WebPage", "LocalBusiness", "Brand"
      ].map(type => ({
        type,
        found: allSchemaTypes.has(type),
        foundOnPages: allSchemaTypes.get(type) || [],
      }));

      // Generate transparency reasons for Product schema
      let productSchemaReason = '';
      const productSchemaFound = allSchemaTypes.has("Product");
      
      // Count how many likely product pages we crawled
      const likelyProductPages = crawledPages.filter(p => {
        const path = p.url.replace(baseUrl, '');
        return /-\d{5,}$/.test(path) || /\d{8,}/.test(path) || path.split('-').length >= 3;
      });
      
      if (productSchemaFound) {
        const productPages = allSchemaTypes.get("Product") || [];
        productSchemaReason = `Product schema FOUND on ${productPages.length} page(s): ${productPages.slice(0, 3).map(u => u.replace(baseUrl, '')).join(', ')}${productPages.length > 3 ? ` (+${productPages.length - 3} more)` : ''}. This helps AI recommend your products!`;
      } else {
        const crawledPagesList = crawledPages.map(p => p.url.replace(baseUrl, '') || '/').slice(0, 8).join(', ');
        productSchemaReason = `Product schema NOT FOUND. We intelligently selected ${crawledPages.length} pages from ${sitemapData.urls.length > 0 ? `your sitemap's ${sitemapData.urls.length} URLs` : 'your site'}, including ${likelyProductPages.length} likely product pages (${crawledPagesList}${crawledPages.length > 8 ? '...' : ''}). None contained Product schema markup (JSON-LD). Add Product schema to your product pages to appear in AI shopping recommendations.`;
      }

      // Generate issues and recommendations based on ALL crawled pages
      const issues = this.identifyIssues(schemas, { h1Count: totalH1Count, h2Count: totalH2Count, wordCount: totalWordCount }, { hasFAQ: allFaqQuestions.length > 0 }, robotsData);
      const recommendations = this.generateRecommendations(schemas, { h1Count: totalH1Count, h2Count: totalH2Count, h3Count: totalH3Count, wordCount: totalWordCount }, { hasFAQ: allFaqQuestions.length > 0, questions: allFaqQuestions }, robotsData, domain);
      
      // Calculate score
      const technicalScore = this.calculateScore(schemas, { h1Count: totalH1Count, h2Count: totalH2Count, wordCount: totalWordCount }, { hasFAQ: allFaqQuestions.length > 0 }, robotsData);

      console.log(`\n${"=".repeat(60)}`);
      console.log(`✅ [AUDIT] COMPLETE - Crawled ${crawledPages.length} pages in ${loadTimeMs}ms`);
      console.log(`   Technical Score: ${technicalScore}/100`);
      console.log(`   Schemas found: ${Array.from(allSchemaTypes.keys()).join(", ") || "none"}`);
      console.log(`   Total FAQ questions: ${allFaqQuestions.length}`);
      console.log(`${"=".repeat(60)}\n`);

      const result: WebsiteAuditResult = {
        url: baseUrl,
        crawledAt: new Date(),
        
        // Crawl transparency
        pagesCrawled: crawledPages,
        totalPagesCrawled: crawledPages.length,
        sitemapFound: sitemapData.found,
        sitemapUrl: sitemapData.url,
        
        title: homepageData.title,
        description: homepageData.description,
        canonical: homepageData.canonical,
        
        schemas,
        hasOrganizationSchema: allSchemaTypes.has("Organization"),
        hasProductSchema: allSchemaTypes.has("Product"),
        hasFAQSchema: allSchemaTypes.has("FAQPage"),
        hasReviewSchema: allSchemaTypes.has("Review"),
        hasBreadcrumbSchema: allSchemaTypes.has("BreadcrumbList"),
        
        h1Count: totalH1Count,
        h2Count: totalH2Count,
        h3Count: totalH3Count,
        h1Text: allH1Text.slice(0, 10), // Limit to 10
        wordCount: totalWordCount,
        
        hasFAQSection: allFaqQuestions.length > 0,
        faqQuestions: [...new Set(allFaqQuestions)].slice(0, 15), // Unique, limit to 15
        
        robotsTxtAccessible: robotsData.accessible,
        robotsTxtContent: robotsData.content,
        allowsAIBots: robotsData.allowsAIBots,
        
        // Transparency - explain WHY we made each determination
        robotsAnalysisReason: robotsData.analysisReason,
        sitemapAnalysisReason: sitemapData.reason,
        productSchemaReason,
        
        hasSSL: baseUrl.startsWith("https"),
        loadTimeMs,
        
        issues,
        recommendations,
        technicalScore,
      };

      return result;

    } catch (error: any) {
      console.error(`❌ [AUDIT] Failed: ${error.message}`);
      
      return {
        url: baseUrl,
        crawledAt: new Date(),
        pagesCrawled: crawledPages,
        totalPagesCrawled: crawledPages.length,
        sitemapFound: false,
        sitemapUrl: null,
        title: "",
        description: "",
        canonical: null,
        schemas: [],
        hasOrganizationSchema: false,
        hasProductSchema: false,
        hasFAQSchema: false,
        hasReviewSchema: false,
        hasBreadcrumbSchema: false,
        h1Count: 0,
        h2Count: 0,
        h3Count: 0,
        h1Text: [],
        wordCount: 0,
        hasFAQSection: false,
        faqQuestions: [],
        robotsTxtAccessible: false,
        robotsTxtContent: null,
        allowsAIBots: true,
        robotsAnalysisReason: `Could not analyze robots.txt due to error: ${error.message}`,
        sitemapAnalysisReason: `Could not check sitemap due to error: ${error.message}`,
        productSchemaReason: `Could not analyze Product schema due to error: ${error.message}`,
        hasSSL: baseUrl.startsWith("https"),
        loadTimeMs: Date.now() - startTime,
        issues: [{
          severity: "critical",
          category: "Accessibility",
          issue: `Could not access website: ${error.message}`,
          impact: "Cannot analyze technical SEO factors",
        }],
        recommendations: [{
          priority: "high",
          category: "Accessibility",
          recommendation: "Ensure website is accessible",
          rationale: "AI crawlers and analysis tools need to access your site",
          implementationGuide: "Check server configuration, firewall rules, and DNS settings",
          expectedImpact: "Enable technical SEO analysis and AI crawler access",
        }],
        technicalScore: 0,
      };
    }
  }

  /**
   * Fetch and parse sitemap.xml
   * 
   * Priority:
   * 1. Use sitemap URL from robots.txt (most reliable)
   * 2. Try common sitemap locations
   * 3. Handle domain variations (www vs non-www)
   */
  private async fetchSitemap(baseUrl: string, sitemapFromRobots: string | null): Promise<{
    found: boolean;
    url: string | null;
    urls: string[];
    reason: string;
  }> {
    // Build list of sitemap URLs to try
    const sitemapUrlsToTry: string[] = [];
    
    // Priority 1: Use the sitemap from robots.txt if available
    if (sitemapFromRobots) {
      sitemapUrlsToTry.push(sitemapFromRobots);
    }
    
    // Priority 2: Try common paths with current domain
    const commonPaths = ['/sitemap.xml', '/sitemap_index.xml', '/sitemap/sitemap.xml'];
    for (const path of commonPaths) {
      const url = new URL(path, baseUrl).toString();
      if (!sitemapUrlsToTry.includes(url)) {
        sitemapUrlsToTry.push(url);
      }
    }
    
    // Priority 3: Try www/non-www variations
    try {
      const urlObj = new URL(baseUrl);
      const altHost = urlObj.host.startsWith('www.') 
        ? urlObj.host.replace('www.', '') 
        : 'www.' + urlObj.host;
      const altBase = `${urlObj.protocol}//${altHost}`;
      for (const path of commonPaths) {
        const altUrl = new URL(path, altBase).toString();
        if (!sitemapUrlsToTry.includes(altUrl)) {
          sitemapUrlsToTry.push(altUrl);
        }
      }
    } catch {
      // Ignore URL parsing errors
    }

    console.log(`   Trying ${sitemapUrlsToTry.length} sitemap URLs...`);

    for (const sitemapUrl of sitemapUrlsToTry) {
      try {
        console.log(`   → Trying: ${sitemapUrl}`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(sitemapUrl, {
          signal: controller.signal,
          headers: { "User-Agent": "VelarisAuditBot/1.0" },
          redirect: 'follow', // Follow redirects
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const contentType = response.headers.get('content-type') || '';
          const xml = await response.text();
          
          // Check if it's actually XML/sitemap content
          if (xml.includes('<urlset') || xml.includes('<sitemapindex') || contentType.includes('xml')) {
            // For sitemap index, we need to fetch child sitemaps
            if (xml.includes('<sitemapindex')) {
              console.log(`   ✓ Found sitemap index at: ${sitemapUrl}`);
              const childSitemapUrls = this.parseUrlsFromSitemap(xml, baseUrl);
              
              // Fetch first few child sitemaps to get actual page URLs
              const allUrls: string[] = [];
              for (const childUrl of childSitemapUrls.slice(0, 3)) {
                try {
                  const childResponse = await fetch(childUrl, {
                    headers: { "User-Agent": "VelarisAuditBot/1.0" },
                  });
                  if (childResponse.ok) {
                    const childXml = await childResponse.text();
                    const childUrls = this.parseUrlsFromSitemap(childXml, baseUrl, true);
                    allUrls.push(...childUrls);
                  }
                } catch {
                  // Skip failed child sitemaps
                }
              }
              
              if (allUrls.length > 0) {
                return { 
                  found: true, 
                  url: sitemapUrl, 
                  urls: allUrls,
                  reason: `Found sitemap index at ${sitemapUrl} with ${childSitemapUrls.length} child sitemaps, extracted ${allUrls.length} URLs.`
                };
              }
            } else {
              // Regular sitemap
              const urls = this.parseUrlsFromSitemap(xml, baseUrl, true);
              if (urls.length > 0) {
                console.log(`   ✓ Found sitemap at: ${sitemapUrl} with ${urls.length} URLs`);
                return { 
                  found: true, 
                  url: sitemapUrl, 
                  urls,
                  reason: `Found sitemap at ${sitemapUrl} containing ${urls.length} URLs.`
                };
              } else {
                console.log(`   ⚠ Sitemap found but contains 0 URLs matching domain`);
              }
            }
          } else {
            console.log(`   ✗ Not XML content: ${contentType.substring(0, 50)}`);
          }
        } else {
          console.log(`   ✗ HTTP ${response.status}`);
        }
      } catch (error: any) {
        console.log(`   ✗ Error: ${error.message}`);
      }
    }

    return { 
      found: false, 
      url: null, 
      urls: [],
      reason: `No sitemap found. Tried: ${sitemapUrlsToTry.slice(0, 3).join(', ')}${sitemapUrlsToTry.length > 3 ? ` (+${sitemapUrlsToTry.length - 3} more)` : ''}. Consider adding a sitemap.xml to help AI crawlers discover your pages.`
    };
  }

  /**
   * Parse URLs from sitemap XML
   * 
   * @param xml - The sitemap XML content
   * @param baseUrl - The base URL of the site
   * @param flexibleDomain - If true, accept URLs from www/non-www variations
   */
  private parseUrlsFromSitemap(xml: string, baseUrl: string, flexibleDomain: boolean = false): string[] {
    const urls: string[] = [];
    
    // Get base domain for flexible matching
    let baseDomain = '';
    try {
      const urlObj = new URL(baseUrl);
      baseDomain = urlObj.host.replace(/^www\./, '');
    } catch {
      return urls;
    }
    
    // Match <loc> tags
    const locMatches = xml.matchAll(/<loc>([^<]+)<\/loc>/gi);
    for (const match of locMatches) {
      let url = match[1].trim();
      
      // Decode HTML entities
      url = url.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
      
      try {
        const urlObj = new URL(url);
        const urlDomain = urlObj.host.replace(/^www\./, '');
        
        // Check if URL is from the same domain (or www variation)
        const isDomainMatch = flexibleDomain 
          ? urlDomain === baseDomain
          : url.startsWith(baseUrl);
        
        // Skip homepage
        const isHomepage = urlObj.pathname === '/' || urlObj.pathname === '';
        
        if (isDomainMatch && !isHomepage && !urls.includes(url)) {
          urls.push(url);
        }
      } catch {
        // Invalid URL, skip
      }
    }

    return urls;
  }

  /**
   * Select key pages from sitemap based on importance
   * 
   * SMART PAGE SELECTION:
   * 1. Identify likely PRODUCT pages (URLs with SKUs, long slugs, etc.)
   * 2. Include FAQ/About/Service pages
   * 3. Sample diverse page types to maximize schema discovery
   */
  private selectKeyPagesFromSitemap(urls: string[], baseUrl: string): string[] {
    console.log(`   Analyzing ${urls.length} URLs to select best pages to crawl...`);
    
    // Categorize URLs by likely page type
    const categories: {
      products: string[];
      faq: string[];
      informational: string[];
      category: string[];
      other: string[];
    } = {
      products: [],
      faq: [],
      informational: [],
      category: [],
      other: [],
    };

    for (const url of urls) {
      try {
        const urlObj = new URL(url);
        const path = urlObj.pathname.toLowerCase();
        const pathParts = path.split('/').filter(Boolean);
        const lastSegment = pathParts[pathParts.length - 1] || '';
        
        // FAQ pages
        if (/faq|help|support|questions/i.test(path)) {
          categories.faq.push(url);
        }
        // Informational pages (about, contact, etc.)
        else if (/about|company|contact|impressum|datenschutz|agb|terms|privacy/i.test(path)) {
          categories.informational.push(url);
        }
        // Category/Collection pages
        else if (/category|collection|kategorie|shop\/?$/i.test(path) || 
                 (pathParts.length === 1 && lastSegment.length < 20 && !/-\d+$/.test(lastSegment))) {
          categories.category.push(url);
        }
        // Likely PRODUCT pages - detect by various patterns:
        else if (
          // Has SKU/ID number at end (like "product-name-4021457657872")
          /-\d{5,}$/.test(lastSegment) ||
          /\d{8,}/.test(lastSegment) ||
          // Explicit product path
          /\/product[s]?\//i.test(path) ||
          /\/shop\//i.test(path) ||
          /\/item\//i.test(path) ||
          /\/artikel\//i.test(path) ||
          // Long hyphenated slug at root (likely product name)
          (pathParts.length === 1 && lastSegment.includes('-') && lastSegment.length > 15) ||
          // Multiple hyphens suggest product name
          (lastSegment.split('-').length >= 3 && lastSegment.length > 10)
        ) {
          categories.products.push(url);
        }
        else {
          categories.other.push(url);
        }
      } catch {
        categories.other.push(url);
      }
    }

    console.log(`   Categorized: ${categories.products.length} products, ${categories.faq.length} FAQ, ${categories.informational.length} info, ${categories.category.length} categories, ${categories.other.length} other`);

    // Select pages with priority for PRODUCTS (to find Product schema)
    const selected: string[] = [];
    const maxPerCategory = Math.ceil(this.maxPagesToCrawl / 4);

    // PRIORITY 1: Sample product pages (most important for Product schema!)
    const productSample = this.sampleArray(categories.products, Math.min(maxPerCategory * 2, 6)); // Up to 6 product pages
    selected.push(...productSample);
    console.log(`   Selected ${productSample.length} product pages to check for Product schema`);

    // PRIORITY 2: FAQ pages (for FAQ schema)
    const faqSample = this.sampleArray(categories.faq, Math.min(maxPerCategory, 2));
    selected.push(...faqSample.filter(u => !selected.includes(u)));

    // PRIORITY 3: Informational pages (for Organization schema)
    const infoSample = this.sampleArray(categories.informational, Math.min(maxPerCategory, 2));
    selected.push(...infoSample.filter(u => !selected.includes(u)));

    // PRIORITY 4: Category pages
    const catSample = this.sampleArray(categories.category, 1);
    selected.push(...catSample.filter(u => !selected.includes(u)));

    // Fill remaining slots with other pages
    const remaining = this.maxPagesToCrawl - selected.length - 1; // -1 for homepage
    if (remaining > 0) {
      const otherSample = this.sampleArray(categories.other, remaining);
      selected.push(...otherSample.filter(u => !selected.includes(u)));
    }

    console.log(`   Final selection: ${selected.length} pages (+ homepage)`);
    
    return selected.slice(0, this.maxPagesToCrawl - 1);
  }

  /**
   * Sample random items from an array
   */
  private sampleArray<T>(arr: T[], count: number): T[] {
    if (arr.length <= count) return [...arr];
    
    // Take items from different parts of the array for diversity
    const result: T[] = [];
    const step = Math.floor(arr.length / count);
    
    for (let i = 0; i < count && i * step < arr.length; i++) {
      result.push(arr[i * step]);
    }
    
    return result;
  }

  /**
   * Discover pages from homepage links
   */
  private discoverPagesFromLinks(html: string, baseUrl: string): string[] {
    const urls: string[] = [];
    const baseHost = new URL(baseUrl).host;
    
    // Find all links
    const linkMatches = html.matchAll(/<a[^>]*href=["']([^"'#]+)["'][^>]*>/gi);
    
    for (const match of linkMatches) {
      try {
        const href = match[1];
        const fullUrl = new URL(href, baseUrl).toString();
        const urlHost = new URL(fullUrl).host;
        
        // Only same domain, not already in list, not homepage
        if (urlHost === baseHost && !urls.includes(fullUrl) && fullUrl !== baseUrl && fullUrl !== baseUrl + '/') {
          // Skip common non-content pages
          if (!/\.(pdf|jpg|png|gif|css|js|xml|json)$/i.test(fullUrl) &&
              !/\/(login|logout|signin|signup|cart|checkout|admin)/i.test(fullUrl)) {
            urls.push(fullUrl);
          }
        }
      } catch {
        // Invalid URL, skip
      }
    }

    return urls;
  }

  /**
   * Crawl a single page and return analysis
   */
  private async crawlSinglePage(url: string, allSchemaTypes: Map<string, string[]>): Promise<{
    crawledPage: CrawledPage;
    content: { h1Count: number; h2Count: number; h3Count: number; h1Text: string[]; wordCount: number };
    faq: { hasFAQ: boolean; questions: string[] };
  } | null> {
    const startTime = Date.now();
    
    try {
      console.log(`   → Crawling: ${url}`);
      const pageData = await this.fetchAndParsePage(url);
      const crawlTime = Date.now() - startTime;
      
      const schemas = this.analyzeSchemas(pageData.html);
      const content = this.analyzeContent(pageData.html);
      const faq = this.detectFAQSections(pageData.html);
      
      // Track schemas found
      schemas.filter(s => s.found).forEach(s => {
        if (!allSchemaTypes.has(s.type)) allSchemaTypes.set(s.type, []);
        allSchemaTypes.get(s.type)!.push(url);
      });
      
      console.log(`     ✓ "${pageData.title}" - ${content.wordCount} words, schemas: ${schemas.filter(s => s.found).map(s => s.type).join(", ") || "none"}`);
      
      return {
        crawledPage: {
          url,
          status: 200,
          title: pageData.title,
          schemas: schemas.filter(s => s.found).map(s => s.type),
          wordCount: content.wordCount,
          hasFAQ: faq.hasFAQ,
          crawlTimeMs: crawlTime,
        },
        content,
        faq,
      };
    } catch (error: any) {
      console.log(`     ✗ Failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Fetch and parse a webpage
   */
  private async fetchAndParsePage(url: string): Promise<{
    html: string;
    title: string;
    description: string;
    canonical: string | null;
  }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; VelarisAuditBot/1.0)",
          "Accept": "text/html,application/xhtml+xml",
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();
      
      // Extract basic meta
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
                        html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
      const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);

      return {
        html,
        title: titleMatch?.[1]?.trim() || "",
        description: descMatch?.[1]?.trim() || "",
        canonical: canonicalMatch?.[1] || null,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Check robots.txt with PROPER analysis
   * 
   * AI bots are considered BLOCKED only if:
   * 1. Specific AI bot user-agents are blocked (GPTBot, ChatGPT-User, Anthropic-AI, etc.)
   * 2. OR User-agent: * has Disallow: / (blocking entire site for all bots)
   * 
   * AI bots are NOT blocked if:
   * - Only specific paths are blocked (e.g., /checkout/, /admin/)
   */
  private async checkRobotsTxt(baseUrl: string): Promise<{
    accessible: boolean;
    content: string | null;
    allowsAIBots: boolean;
    sitemapFromRobots: string | null;
    analysisReason: string;
    blockedBots: string[];
    blockedPaths: string[];
  }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
      const robotsUrl = new URL("/robots.txt", baseUrl).toString();
      console.log(`   Fetching: ${robotsUrl}`);
      
      const response = await fetch(robotsUrl, {
        signal: controller.signal,
        headers: { "User-Agent": "VelarisAuditBot/1.0" },
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        return { 
          accessible: false, 
          content: null, 
          allowsAIBots: true,
          sitemapFromRobots: null,
          analysisReason: `robots.txt returned HTTP ${response.status} - file not found or inaccessible. When no robots.txt exists, all bots (including AI) are allowed by default.`,
          blockedBots: [],
          blockedPaths: [],
        };
      }

      const content = await response.text();
      console.log(`   robots.txt content length: ${content.length} chars`);
      
      // Extract sitemap URL from robots.txt
      const sitemapMatch = content.match(/^Sitemap:\s*(.+)$/mi);
      const sitemapFromRobots = sitemapMatch ? sitemapMatch[1].trim() : null;
      if (sitemapFromRobots) {
        console.log(`   Found sitemap in robots.txt: ${sitemapFromRobots}`);
      }

      // Parse robots.txt properly - look for specific AI bot blocks
      const aiUserAgents = [
        'gptbot', 'chatgpt-user', 'chatgpt', 'openai',
        'anthropic-ai', 'claude-web', 'claudebot',
        'google-extended', 'bard',
        'perplexitybot', 'cohere-ai',
        'ccbot', 'omgilibot', 'diffbot'
      ];
      
      const blockedBots: string[] = [];
      const blockedPaths: string[] = [];
      let currentUserAgent = '';
      let wildcardBlocksRoot = false;
      
      // Parse line by line
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim().toLowerCase();
        
        // Track current user-agent
        if (trimmed.startsWith('user-agent:')) {
          currentUserAgent = trimmed.replace('user-agent:', '').trim();
        }
        
        // Check disallow rules
        if (trimmed.startsWith('disallow:')) {
          const path = trimmed.replace('disallow:', '').trim();
          
          // Check if this is a root block (blocks entire site)
          if (path === '/' || path === '/*') {
            if (currentUserAgent === '*') {
              wildcardBlocksRoot = true;
            }
            // Check if current user-agent is an AI bot
            if (aiUserAgents.some(bot => currentUserAgent.includes(bot))) {
              blockedBots.push(currentUserAgent);
            }
          }
          
          // Track blocked paths for wildcard user-agent
          if (currentUserAgent === '*' && path && path !== '/') {
            blockedPaths.push(path);
          }
        }
      }

      // Determine if AI bots are actually blocked
      let allowsAIBots = true;
      let analysisReason = '';

      if (blockedBots.length > 0) {
        allowsAIBots = false;
        analysisReason = `The following AI bots are explicitly blocked with "Disallow: /": ${blockedBots.join(', ')}. This prevents these AI platforms from crawling your content.`;
      } else if (wildcardBlocksRoot) {
        allowsAIBots = false;
        analysisReason = `robots.txt has "User-agent: *" with "Disallow: /", which blocks ALL bots including AI crawlers from accessing the entire site.`;
      } else if (blockedPaths.length > 0) {
        allowsAIBots = true;
        analysisReason = `AI bots are ALLOWED. Only specific paths are blocked for all bots: ${blockedPaths.slice(0, 5).join(', ')}${blockedPaths.length > 5 ? ` (+${blockedPaths.length - 5} more)` : ''}. This is normal and does not block AI crawlers from indexing your main content.`;
      } else {
        allowsAIBots = true;
        analysisReason = `AI bots are ALLOWED. No blocking rules found for AI crawlers. Your content is accessible to ChatGPT, Claude, Perplexity, and other AI platforms.`;
      }

      console.log(`   AI bots allowed: ${allowsAIBots}`);
      console.log(`   Reason: ${analysisReason.substring(0, 100)}...`);

      return {
        accessible: true,
        content,
        allowsAIBots,
        sitemapFromRobots,
        analysisReason,
        blockedBots,
        blockedPaths,
      };
    } catch (error: any) {
      clearTimeout(timeoutId);
      return { 
        accessible: false, 
        content: null, 
        allowsAIBots: true,
        sitemapFromRobots: null,
        analysisReason: `Could not fetch robots.txt: ${error.message}. When robots.txt is unavailable, all bots are allowed by default.`,
        blockedBots: [],
        blockedPaths: [],
      };
    }
  }

  /**
   * Analyze schema markup
   */
  private analyzeSchemas(html: string): SchemaMarkup[] {
    const schemaTypes = [
      "Organization",
      "Product", 
      "FAQPage",
      "Review",
      "AggregateRating",
      "BreadcrumbList",
      "Article",
      "WebPage",
      "LocalBusiness",
      "Brand",
    ];

    const schemas: SchemaMarkup[] = [];

    // Find JSON-LD scripts
    const jsonLdMatches = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
    
    const foundTypes = new Set<string>();
    
    for (const match of jsonLdMatches) {
      try {
        const jsonContent = match[1];
        const data = JSON.parse(jsonContent);
        
        const extractTypes = (obj: any) => {
          if (obj["@type"]) {
            const types = Array.isArray(obj["@type"]) ? obj["@type"] : [obj["@type"]];
            types.forEach((t: string) => foundTypes.add(t));
          }
          if (obj["@graph"]) {
            obj["@graph"].forEach((item: any) => extractTypes(item));
          }
        };
        
        extractTypes(data);
      } catch {
        // Invalid JSON, skip
      }
    }

    // Check for each schema type
    for (const type of schemaTypes) {
      schemas.push({
        type,
        found: foundTypes.has(type),
        details: foundTypes.has(type) ? { source: "JSON-LD" } : undefined,
      });
    }

    return schemas;
  }

  /**
   * Analyze content structure
   */
  private analyzeContent(html: string): {
    h1Count: number;
    h2Count: number;
    h3Count: number;
    h1Text: string[];
    wordCount: number;
  } {
    // Remove scripts and styles
    const cleanHtml = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ");

    const wordCount = cleanHtml.split(/\s+/).filter(w => w.length > 0).length;

    const h1Matches = html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi);
    const h1Text = Array.from(h1Matches).map(m => m[1].replace(/<[^>]+>/g, "").trim()).filter(Boolean);
    
    const h2Count = (html.match(/<h2[^>]*>/gi) || []).length;
    const h3Count = (html.match(/<h3[^>]*>/gi) || []).length;

    return {
      h1Count: h1Text.length,
      h2Count,
      h3Count,
      h1Text,
      wordCount,
    };
  }

  /**
   * Detect FAQ sections
   */
  private detectFAQSections(html: string): {
    hasFAQ: boolean;
    questions: string[];
  } {
    const questions: string[] = [];

    // Check for FAQ schema (already parsed in schemas)
    const faqSchemaMatch = html.match(/FAQPage/i);
    
    // Look for common FAQ patterns
    const faqSectionPatterns = [
      /<[^>]*(?:id|class)=["'][^"']*faq[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|section)>/gi,
      /<[^>]*(?:id|class)=["'][^"']*frequently[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|section)>/gi,
    ];

    for (const pattern of faqSectionPatterns) {
      const matches = html.matchAll(pattern);
      for (const match of matches) {
        // Extract questions from FAQ section
        const questionMatches = match[1].matchAll(/<(?:h[2-4]|dt|strong|b)[^>]*>([\s\S]*?)<\/(?:h[2-4]|dt|strong|b)>/gi);
        for (const qMatch of questionMatches) {
          const q = qMatch[1].replace(/<[^>]+>/g, "").trim();
          if (q.includes("?") || q.toLowerCase().startsWith("how") || 
              q.toLowerCase().startsWith("what") || q.toLowerCase().startsWith("why")) {
            questions.push(q);
          }
        }
      }
    }

    // Also look for question patterns anywhere
    const genericQuestions = html.matchAll(/<(?:h[2-4]|dt)[^>]*>([^<]*\?)<\/(?:h[2-4]|dt)>/gi);
    for (const match of genericQuestions) {
      const q = match[1].trim();
      if (q.length > 10 && q.length < 200 && !questions.includes(q)) {
        questions.push(q);
      }
    }

    return {
      hasFAQ: !!faqSchemaMatch || questions.length > 0,
      questions: questions.slice(0, 10), // Limit to 10
    };
  }

  /**
   * Identify issues
   */
  private identifyIssues(
    schemas: SchemaMarkup[],
    content: { h1Count: number; h2Count: number; wordCount: number },
    faq: { hasFAQ: boolean },
    robots: { allowsAIBots: boolean }
  ): AuditIssue[] {
    const issues: AuditIssue[] = [];

    // Schema issues
    if (!schemas.some(s => s.type === "Organization" && s.found)) {
      issues.push({
        severity: "warning",
        category: "Schema Markup",
        issue: "Missing Organization schema",
        impact: "AI may not properly identify your brand entity",
      });
    }

    if (!schemas.some(s => s.type === "FAQPage" && s.found) && !faq.hasFAQ) {
      issues.push({
        severity: "warning",
        category: "Content Structure",
        issue: "No FAQ content or schema detected",
        impact: "Missing opportunity for AI to cite your answers",
      });
    }

    // Content issues
    if (content.h1Count === 0) {
      issues.push({
        severity: "critical",
        category: "Content Structure",
        issue: "No H1 heading found",
        impact: "AI cannot identify main topic of page",
      });
    } else if (content.h1Count > 1) {
      issues.push({
        severity: "info",
        category: "Content Structure",
        issue: `Multiple H1 headings (${content.h1Count})`,
        impact: "May confuse AI about page hierarchy",
      });
    }

    if (content.wordCount < 300) {
      issues.push({
        severity: "warning",
        category: "Content Depth",
        issue: `Thin content (${content.wordCount} words)`,
        impact: "AI prefers comprehensive content for citations",
      });
    }

    // Robot issues
    if (!robots.allowsAIBots) {
      issues.push({
        severity: "critical",
        category: "Accessibility",
        issue: "robots.txt may be blocking AI crawlers",
        impact: "AI platforms cannot index your content",
      });
    }

    return issues;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    schemas: SchemaMarkup[],
    content: { h1Count: number; h2Count: number; h3Count: number; wordCount: number },
    faq: { hasFAQ: boolean; questions: string[] },
    robots: { allowsAIBots: boolean },
    domain: string
  ): TechnicalRecommendation[] {
    const recommendations: TechnicalRecommendation[] = [];

    // Schema recommendations
    if (!schemas.some(s => s.type === "Organization" && s.found)) {
      recommendations.push({
        priority: "high",
        category: "Schema Markup",
        recommendation: "Add Organization schema markup",
        rationale: "Organization schema helps AI platforms understand your brand entity, improving brand recognition in AI responses.",
        implementationGuide: `Add JSON-LD to your homepage:
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "${domain}",
  "url": "https://${domain}",
  "logo": "https://${domain}/logo.png",
  "description": "Your brand description",
  "sameAs": ["social media URLs"]
}
</script>`,
        expectedImpact: "15-25% improvement in AI brand entity recognition",
      });
    }

    if (!schemas.some(s => s.type === "FAQPage" && s.found)) {
      recommendations.push({
        priority: "high",
        category: "Schema Markup",
        recommendation: "Implement FAQ schema markup",
        rationale: "FAQ schema is directly used by AI assistants when answering questions. This is one of the highest-impact technical changes for AI visibility.",
        implementationGuide: `Add FAQPage schema to pages with Q&A content:
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "Your question here?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "Your answer here"
    }
  }]
}
</script>`,
        expectedImpact: "20-40% improvement in AI answer citations",
      });
    }

    // Content recommendations
    if (!faq.hasFAQ) {
      recommendations.push({
        priority: "high",
        category: "Content Strategy",
        recommendation: "Create dedicated FAQ content section",
        rationale: "AI assistants frequently cite FAQ content when answering user questions. Pages with structured Q&A are 3x more likely to be referenced.",
        implementationGuide: "Create a /faq page or add FAQ sections to key landing pages. Include questions that match how users query AI assistants (natural language, question format).",
        expectedImpact: "Significant increase in AI citations for informational queries",
      });
    }

    if (content.wordCount < 500) {
      recommendations.push({
        priority: "medium",
        category: "Content Depth",
        recommendation: "Expand content depth on key pages",
        rationale: "AI models favor comprehensive, authoritative content. Pages with 1500+ words are cited 2x more often than thin content.",
        implementationGuide: "Add detailed explanations, examples, comparisons, and expert insights to your main pages. Aim for 1500-2500 words on key landing pages.",
        expectedImpact: "30-50% increase in AI content citations",
      });
    }

    if (content.h2Count < 3) {
      recommendations.push({
        priority: "medium",
        category: "Content Structure",
        recommendation: "Improve heading structure with more H2 sections",
        rationale: "Clear heading hierarchy helps AI understand content organization and extract relevant sections for answers.",
        implementationGuide: "Break content into logical sections with descriptive H2 headings. Use question-format headings where appropriate (e.g., 'What makes [brand] different?').",
        expectedImpact: "Better AI content parsing and section citations",
      });
    }

    // AI access recommendations
    if (!robots.allowsAIBots) {
      recommendations.push({
        priority: "high",
        category: "Technical Access",
        recommendation: "CRITICAL: Update robots.txt to allow AI crawlers",
        rationale: "Blocking AI crawlers (GPTBot, ClaudeBot, etc.) prevents your content from being included in AI training and responses.",
        implementationGuide: `Ensure your robots.txt allows AI bots:
# Allow AI crawlers
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot  
Allow: /

User-agent: Bingbot
Allow: /`,
        expectedImpact: "Critical - required for any AI visibility",
      });
    }

    // Product schema for e-commerce
    if (!schemas.some(s => s.type === "Product" && s.found)) {
      recommendations.push({
        priority: "medium",
        category: "Schema Markup",
        recommendation: "Add Product schema to product pages",
        rationale: "Product schema helps AI understand your offerings, enabling better product recommendations in AI responses.",
        implementationGuide: "Add Product schema with name, description, price, availability, and reviews to all product pages.",
        expectedImpact: "Improved AI product recommendations",
      });
    }

    return recommendations;
  }

  /**
   * Calculate technical score
   */
  private calculateScore(
    schemas: SchemaMarkup[],
    content: { h1Count: number; h2Count: number; wordCount: number },
    faq: { hasFAQ: boolean },
    robots: { allowsAIBots: boolean }
  ): number {
    let score = 0;

    // Schema scores (40 points max)
    if (schemas.some(s => s.type === "Organization" && s.found)) score += 10;
    if (schemas.some(s => s.type === "FAQPage" && s.found)) score += 15;
    if (schemas.some(s => s.type === "Product" && s.found)) score += 5;
    if (schemas.some(s => s.type === "Review" && s.found)) score += 5;
    if (schemas.some(s => s.type === "BreadcrumbList" && s.found)) score += 5;

    // Content scores (35 points max)
    if (content.h1Count === 1) score += 10;
    if (content.h2Count >= 3) score += 10;
    if (content.wordCount >= 500) score += 5;
    if (content.wordCount >= 1500) score += 10;

    // FAQ scores (15 points max)
    if (faq.hasFAQ) score += 15;

    // Access scores (10 points max)
    if (robots.allowsAIBots) score += 10;

    return Math.min(100, score);
  }
}
