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

  constructor(timeout: number = 10000, maxPagesToCrawl: number = 10) {
    this.timeout = timeout;
    this.maxPagesToCrawl = maxPagesToCrawl;
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

      // Step 3: Try to fetch sitemap.xml
      console.log(`\n🗺️  [CRAWL] Step 3: Looking for sitemap.xml...`);
      const sitemapData = await this.fetchSitemap(baseUrl);
      
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
   */
  private async fetchSitemap(baseUrl: string): Promise<{
    found: boolean;
    url: string | null;
    urls: string[];
  }> {
    const sitemapUrls = [
      '/sitemap.xml',
      '/sitemap_index.xml',
      '/sitemap/sitemap.xml',
    ];

    for (const path of sitemapUrls) {
      try {
        const sitemapUrl = new URL(path, baseUrl).toString();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(sitemapUrl, {
          signal: controller.signal,
          headers: { "User-Agent": "VelarisAuditBot/1.0" },
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const xml = await response.text();
          const urls = this.parseUrlsFromSitemap(xml, baseUrl);
          if (urls.length > 0) {
            return { found: true, url: sitemapUrl, urls };
          }
        }
      } catch {
        // Continue to next sitemap URL
      }
    }

    return { found: false, url: null, urls: [] };
  }

  /**
   * Parse URLs from sitemap XML
   */
  private parseUrlsFromSitemap(xml: string, baseUrl: string): string[] {
    const urls: string[] = [];
    
    // Match <loc> tags
    const locMatches = xml.matchAll(/<loc>([^<]+)<\/loc>/gi);
    for (const match of locMatches) {
      const url = match[1].trim();
      // Filter to same domain and not the homepage
      if (url.startsWith(baseUrl) && url !== baseUrl && url !== baseUrl + '/') {
        urls.push(url);
      }
    }

    return urls;
  }

  /**
   * Select key pages from sitemap based on importance
   */
  private selectKeyPagesFromSitemap(urls: string[], baseUrl: string): string[] {
    const priorityPatterns = [
      /\/faq/i, /\/faqs/i, /\/help/i,
      /\/product/i, /\/products/i, /\/shop/i,
      /\/service/i, /\/services/i,
      /\/about/i, /\/company/i,
      /\/pricing/i, /\/plans/i,
      /\/blog\/?$/i, // Blog index, not individual posts
      /\/contact/i,
    ];

    const selected: string[] = [];
    
    // First, add high-priority pages
    for (const url of urls) {
      for (const pattern of priorityPatterns) {
        if (pattern.test(url) && !selected.includes(url)) {
          selected.push(url);
          break;
        }
      }
    }

    // Then add some random pages if we have room
    const remaining = urls.filter(u => !selected.includes(u));
    const randomSample = remaining.slice(0, this.maxPagesToCrawl - selected.length);
    
    return [...selected, ...randomSample];
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
   * Check robots.txt
   */
  private async checkRobotsTxt(baseUrl: string): Promise<{
    accessible: boolean;
    content: string | null;
    allowsAIBots: boolean;
  }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    try {
      const robotsUrl = new URL("/robots.txt", baseUrl).toString();
      const response = await fetch(robotsUrl, {
        signal: controller.signal,
        headers: { "User-Agent": "VelarisAuditBot/1.0" },
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        return { accessible: false, content: null, allowsAIBots: true };
      }

      const content = await response.text();
      
      // Check for AI bot blocks
      const aiBotPatterns = [
        /disallow.*gptbot/i,
        /disallow.*chatgpt/i,
        /disallow.*anthropic/i,
        /disallow.*claude/i,
        /disallow.*bingbot/i,
        /disallow.*googlebot/i,
        /user-agent:\s*\*[\s\S]*?disallow:\s*\//i,
      ];

      const blocksAI = aiBotPatterns.some(pattern => pattern.test(content));

      return {
        accessible: true,
        content,
        allowsAIBots: !blocksAI,
      };
    } catch {
      clearTimeout(timeoutId);
      return { accessible: false, content: null, allowsAIBots: true };
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
