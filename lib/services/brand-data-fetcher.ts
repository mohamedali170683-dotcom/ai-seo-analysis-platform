/**
 * Brand Data Fetcher Service
 *
 * Fetches brand information from:
 * - Wikipedia API
 * - Brand website (meta tags, structured data)
 * - Analyzes brand positioning
 */

export interface FetchedBrandData {
  // Basic company info
  companyName: string;
  description?: string;
  foundedYear?: number;
  headquarters?: string;
  ceo?: string;
  employeeCount?: number;
  industry?: string;
  websiteUrl?: string;

  // Brand positioning
  positioning?: BrandPositioning;

  // Additional data
  stockTicker?: string;
  revenue?: string;
  parentCompany?: string;
  products?: string[];
  competitors?: string[];

  // Data sources
  sources: DataSource[];

  // Confidence scores
  confidence: {
    overall: number;
    wikipedia: number;
    website: number;
  };
}

export interface BrandPositioning {
  primary: PositioningType;
  secondary?: PositioningType[];
  pricePoint?: 'budget' | 'mid-range' | 'premium' | 'luxury';
  targetMarket?: string;
  keyAttributes?: string[];
  brandVoice?: string;
  suggestedDescription?: string;
}

export type PositioningType =
  | 'premium'
  | 'innovative'
  | 'affordable'
  | 'sustainable'
  | 'luxury'
  | 'disruptive'
  | 'traditional'
  | 'tech-forward'
  | 'customer-centric'
  | 'quality-focused'
  | 'value-oriented'
  | 'lifestyle'
  | 'professional'
  | 'enterprise';

export interface DataSource {
  type: 'wikipedia' | 'website' | 'inferred';
  url?: string;
  field: string;
  confidence: number;
}

interface WikipediaSearchResult {
  pageid: number;
  title: string;
  snippet: string;
}

interface WikipediaPageData {
  title: string;
  extract: string;
  fullurl: string;
}

interface WikipediaInfobox {
  [key: string]: string;
}

export class BrandDataFetcher {
  private wikipediaBaseUrl = 'https://en.wikipedia.org/w/api.php';

  /**
   * Main method to fetch all brand data
   */
  async fetchBrandData(
    brandNameOrUrl: string
  ): Promise<FetchedBrandData> {
    const sources: DataSource[] = [];
    let brandName = brandNameOrUrl;
    let websiteUrl: string | undefined;

    // Check if input is a URL
    if (this.isUrl(brandNameOrUrl)) {
      websiteUrl = this.normalizeUrl(brandNameOrUrl);
      brandName = this.extractBrandNameFromUrl(brandNameOrUrl);
    }

    console.log(`[BrandDataFetcher] Fetching data for: "${brandName}"`);

    // Fetch data from multiple sources in parallel
    const [wikipediaData, websiteData] = await Promise.all([
      this.fetchFromWikipedia(brandName).catch(err => {
        console.warn('[BrandDataFetcher] Wikipedia fetch failed:', err.message);
        return null;
      }),
      websiteUrl ? this.fetchFromWebsite(websiteUrl).catch(err => {
        console.warn('[BrandDataFetcher] Website fetch failed:', err.message);
        return null;
      }) : Promise.resolve(null)
    ]);

    if (wikipediaData) {
      console.log('[BrandDataFetcher] Wikipedia data found:', {
        title: wikipediaData.pageData?.title,
        infoboxKeys: Object.keys(wikipediaData.infobox),
        infobox: wikipediaData.infobox
      });
    }

    // Merge data with priority: website > wikipedia > inferred
    const mergedData = this.mergeData(brandName, wikipediaData, websiteData, sources);

    // Analyze brand positioning
    const positioning = this.analyzePositioning(mergedData, wikipediaData, websiteData);

    // Calculate confidence scores
    const confidence = this.calculateConfidence(wikipediaData, websiteData, sources);

    return {
      ...mergedData,
      positioning,
      sources,
      confidence,
      websiteUrl: websiteUrl || mergedData.websiteUrl
    };
  }

  /**
   * Fetch data from Wikipedia
   */
  private async fetchFromWikipedia(brandName: string): Promise<{
    pageData: WikipediaPageData | null;
    infobox: WikipediaInfobox;
    categories: string[];
  } | null> {
    try {
      // Search for the company/brand page
      const searchUrl = `${this.wikipediaBaseUrl}?` + new URLSearchParams({
        action: 'query',
        list: 'search',
        srsearch: `${brandName} company`,
        format: 'json',
        origin: '*',
        srlimit: '5'
      });

      console.log(`[BrandDataFetcher] Searching Wikipedia for: "${brandName} company"`);
      const searchResponse = await fetch(searchUrl);
      if (!searchResponse.ok) {
        throw new Error(`Wikipedia search failed: ${searchResponse.status}`);
      }

      const searchData = await searchResponse.json();
      let searchResults: WikipediaSearchResult[] = searchData?.query?.search || [];

      if (searchResults.length === 0) {
        // Try without "company" suffix
        const altSearchUrl = `${this.wikipediaBaseUrl}?` + new URLSearchParams({
          action: 'query',
          list: 'search',
          srsearch: brandName,
          format: 'json',
          origin: '*',
          srlimit: '5'
        });

        const altSearchResponse = await fetch(altSearchUrl);
        const altSearchData = await altSearchResponse.json();
        searchResults = altSearchData?.query?.search || [];

        if (searchResults.length === 0) {
          console.log('[BrandDataFetcher] No Wikipedia results found');
          return null;
        }
      }

      // Find the best match (prioritize company pages)
      const bestMatch = this.findBestWikipediaMatch(searchResults, brandName);
      if (!bestMatch) {
        console.log('[BrandDataFetcher] No suitable Wikipedia match found');
        return null;
      }

      console.log(`[BrandDataFetcher] Best match: "${bestMatch.title}" (pageid: ${bestMatch.pageid})`);

      // Fetch the page content with extracts
      const pageUrl = `${this.wikipediaBaseUrl}?` + new URLSearchParams({
        action: 'query',
        pageids: bestMatch.pageid.toString(),
        prop: 'extracts|info|categories|revisions',
        exintro: '1',
        explaintext: '1',
        inprop: 'url',
        cllimit: '50',
        rvprop: 'content',
        rvslots: 'main',
        format: 'json',
        origin: '*'
      });

      const pageResponse = await fetch(pageUrl);
      const pageData = await pageResponse.json();
      const page = pageData?.query?.pages?.[bestMatch.pageid];

      if (!page) return null;

      // Extract infobox data from the raw wikitext
      const wikitext = page?.revisions?.[0]?.slots?.main?.['*'] || '';
      const infobox = this.parseWikipediaInfobox(wikitext);

      // Get categories
      const categories = (page.categories || []).map((c: { title: string }) =>
        c.title.replace('Category:', '')
      );

      return {
        pageData: {
          title: page.title,
          extract: page.extract || '',
          fullurl: page.fullurl || ''
        },
        infobox,
        categories
      };
    } catch (error) {
      console.error('[BrandDataFetcher] Wikipedia fetch error:', error);
      return null;
    }
  }

  /**
   * Parse Wikipedia infobox for structured data
   * Improved version that handles nested templates and complex formatting
   */
  private parseWikipediaInfobox(wikitext: string): WikipediaInfobox {
    const infobox: WikipediaInfobox = {};

    // Find the infobox - handle nested braces properly
    const infoboxStart = wikitext.search(/\{\{Infobox/i);
    if (infoboxStart === -1) {
      console.log('[BrandDataFetcher] No infobox found in wikitext');
      return infobox;
    }

    // Extract infobox by counting braces
    let braceCount = 0;
    let infoboxEnd = infoboxStart;
    for (let i = infoboxStart; i < wikitext.length; i++) {
      if (wikitext[i] === '{') braceCount++;
      if (wikitext[i] === '}') braceCount--;
      if (braceCount === 0) {
        infoboxEnd = i + 1;
        break;
      }
    }

    const infoboxText = wikitext.substring(infoboxStart, infoboxEnd);
    console.log(`[BrandDataFetcher] Infobox length: ${infoboxText.length} chars`);

    // Split into lines and parse key-value pairs
    const lines = infoboxText.split('\n');

    for (const line of lines) {
      // Match lines like "| key = value" or "| key = {{template|value}}"
      const match = line.match(/^\s*\|\s*([a-z_]+)\s*=\s*(.*)$/i);
      if (match) {
        const key = match[1].toLowerCase().trim();
        let value = match[2].trim();

        // Clean up the value
        value = this.cleanWikipediaValue(value);

        if (value && value.length > 0) {
          infobox[key] = value;
        }
      }
    }

    // Map common variations to standard keys
    const keyMappings: Record<string, string[]> = {
      'founded': ['founded', 'foundation', 'established', 'inception', 'formed'],
      'headquarters': ['headquarters', 'hq_location', 'hq_location_city', 'location', 'location_city', 'location_country', 'hq'],
      'ceo': ['ceo', 'chief_executive', 'key_people', 'leader_name', 'president'],
      'employees': ['num_employees', 'employees', 'number_of_employees', 'staff'],
      'industry': ['industry', 'industries', 'genre', 'sector'],
      'revenue': ['revenue', 'net_income', 'gross_income'],
      'website': ['website', 'url', 'homepage', 'web'],
      'parent': ['parent', 'parent_company', 'owner', 'owners'],
      'traded_as': ['traded_as', 'traded', 'stock_symbol', 'symbol'],
      'type': ['type', 'company_type', 'structure']
    };

    // Normalize keys
    const normalized: WikipediaInfobox = {};
    for (const [standardKey, variations] of Object.entries(keyMappings)) {
      for (const variant of variations) {
        if (infobox[variant] && !normalized[standardKey]) {
          normalized[standardKey] = infobox[variant];
          break;
        }
      }
    }

    // Extract specific data with enhanced parsing

    // Founded year - look for 4-digit year
    if (normalized.founded) {
      const yearMatch = normalized.founded.match(/\b(1[89]\d{2}|20[0-2]\d)\b/);
      if (yearMatch) {
        normalized.founded = yearMatch[1];
      }
    }

    // CEO/Key people - extract the first person's name
    if (normalized.ceo) {
      // Handle formats like "[[Tim Cook]] ([[CEO]])" or "John Smith, CEO"
      let ceoValue = normalized.ceo;
      // Remove role titles in parentheses or after comma
      ceoValue = ceoValue.replace(/\s*\([^)]*CEO[^)]*\)/gi, '');
      ceoValue = ceoValue.replace(/,\s*CEO.*/i, '');
      // Take first person if multiple listed
      if (ceoValue.includes('*')) {
        const firstPerson = ceoValue.split('*')[1];
        if (firstPerson) ceoValue = firstPerson;
      }
      // Clean wiki links
      ceoValue = ceoValue.replace(/\[\[([^|\]]+)(?:\|[^\]]+)?\]\]/g, '$1');
      ceoValue = ceoValue.replace(/\{\{[^}]+\}\}/g, '').trim();
      // Remove "as" prefixes like "[[CEO]] as of 2020"
      ceoValue = ceoValue.replace(/as of \d{4}/gi, '').trim();
      normalized.ceo = ceoValue.split('\n')[0].trim(); // Take first line
    }

    // Headquarters - clean up location
    if (normalized.headquarters) {
      let hq = normalized.headquarters;
      // Handle {{unbulleted list|...}} and similar templates
      if (hq.includes('unbulleted')) {
        const parts = hq.match(/\|([^|{}]+)/g);
        if (parts && parts.length > 0) {
          hq = parts.map(p => p.replace(/^\|/, '').trim()).join(', ');
        }
      }
      // Handle plainlist
      if (hq.includes('plainlist') || hq.includes('Plainlist')) {
        const listItems = hq.match(/\*\s*([^\n*]+)/g);
        if (listItems && listItems.length > 0) {
          hq = listItems[0].replace(/^\*\s*/, '').trim();
        }
      }
      // Clean wiki links and templates
      hq = hq.replace(/\[\[([^|\]]+)(?:\|[^\]]+)?\]\]/g, '$1');
      hq = hq.replace(/\{\{[^}]+\}\}/g, '');
      hq = hq.replace(/\s*\n.*/s, ''); // Take first line only
      normalized.headquarters = hq.trim();
    }

    // Employee count - extract number
    if (normalized.employees) {
      const empValue = normalized.employees;
      // Handle formats like "164,000 (2023)", "~150,000", "approx. 100k"
      const numMatch = empValue.match(/([0-9,]+(?:\.[0-9]+)?)\s*(?:k|K|thousand|million|M)?/);
      if (numMatch) {
        let count = numMatch[1].replace(/,/g, '');
        const suffix = numMatch[0].toLowerCase();
        if (suffix.includes('k') || suffix.includes('thousand')) {
          count = String(parseFloat(count) * 1000);
        } else if (suffix.includes('m') || suffix.includes('million')) {
          count = String(parseFloat(count) * 1000000);
        }
        normalized.employees = String(Math.round(parseFloat(count)));
      }
    }

    // Website - extract URL
    if (normalized.website) {
      let web = normalized.website;
      // Handle {{URL|example.com}} or {{url|https://example.com}}
      const urlMatch = web.match(/\{\{(?:URL|url)\|([^}|]+)/i);
      if (urlMatch) {
        web = urlMatch[1];
      }
      // Clean any remaining template markup
      web = web.replace(/\{\{[^}]+\}\}/g, '').trim();
      normalized.website = web;
    }

    console.log('[BrandDataFetcher] Parsed infobox:', normalized);
    return normalized;
  }

  /**
   * Clean Wikipedia markup from values
   */
  private cleanWikipediaValue(value: string): string {
    let cleaned = value;

    // Handle {{Start date|YYYY|MM|DD}} templates
    const startDateMatch = cleaned.match(/\{\{(?:Start date|start date)[^|]*\|(\d{4})/i);
    if (startDateMatch) {
      return startDateMatch[1];
    }

    // Handle {{URL|...}} templates
    const urlMatch = cleaned.match(/\{\{(?:URL|url)\|([^}|]+)/i);
    if (urlMatch) {
      return urlMatch[1].trim();
    }

    // Handle {{Increase}}, {{Decrease}} and similar
    cleaned = cleaned.replace(/\{\{(?:Increase|Decrease|Steady)\}\}/gi, '');

    // Handle {{nowrap|...}}
    cleaned = cleaned.replace(/\{\{nowrap\|([^}]+)\}\}/gi, '$1');

    // Handle {{ubl|...}} (unbulleted list)
    cleaned = cleaned.replace(/\{\{ubl\|([^}]+)\}\}/gi, '$1');

    // Handle wiki links [[Link|Display]] -> Display, [[Link]] -> Link
    cleaned = cleaned.replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, '$2');
    cleaned = cleaned.replace(/\[\[([^\]]+)\]\]/g, '$1');

    // Remove remaining templates but keep their content if simple
    cleaned = cleaned.replace(/\{\{[^{}|]+\|([^{}]+)\}\}/g, '$1');
    cleaned = cleaned.replace(/\{\{[^{}]+\}\}/g, '');

    // Remove HTML tags
    cleaned = cleaned.replace(/<[^>]+>/g, '');

    // Remove reference tags
    cleaned = cleaned.replace(/<ref[^>]*>.*?<\/ref>/gi, '');
    cleaned = cleaned.replace(/<ref[^/>]*\/>/gi, '');

    // Clean up whitespace and special chars
    cleaned = cleaned.replace(/&nbsp;/g, ' ');
    cleaned = cleaned.replace(/'''?/g, '');
    cleaned = cleaned.replace(/\s+/g, ' ');

    return cleaned.trim();
  }

  /**
   * Find the best Wikipedia match for a brand
   */
  private findBestWikipediaMatch(
    results: WikipediaSearchResult[],
    brandName: string
  ): WikipediaSearchResult | null {
    const brandLower = brandName.toLowerCase();

    // Priority scoring
    const scored = results.map(result => {
      let score = 0;
      const titleLower = result.title.toLowerCase();
      const snippetLower = result.snippet.toLowerCase();

      // Exact title match
      if (titleLower === brandLower) score += 100;
      // Title starts with brand name
      else if (titleLower.startsWith(brandLower)) score += 50;
      // Title contains brand name
      else if (titleLower.includes(brandLower)) score += 25;

      // Company-related keywords in snippet
      const companyKeywords = ['company', 'corporation', 'inc.', 'ltd', 'founded', 'headquartered', 'ceo', 'multinational', 'business'];
      for (const keyword of companyKeywords) {
        if (snippetLower.includes(keyword)) score += 10;
      }

      // Penalize disambiguation pages
      if (titleLower.includes('disambiguation')) score -= 50;

      return { result, score };
    });

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    return scored[0]?.score > 0 ? scored[0].result : null;
  }

  /**
   * Fetch data from brand website
   */
  private async fetchFromWebsite(url: string): Promise<{
    title?: string;
    description?: string;
    keywords?: string[];
    structuredData?: Record<string, unknown>;
    ogData?: Record<string, string>;
  } | null> {
    try {
      console.log(`[BrandDataFetcher] Fetching website: ${url}`);

      // Fetch the website HTML
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; BrandDataBot/1.0)',
          'Accept': 'text/html'
        }
      });

      if (!response.ok) {
        throw new Error(`Website fetch failed: ${response.status}`);
      }

      const html = await response.text();

      // Parse meta tags
      const title = this.extractMetaTag(html, 'title') || this.extractTag(html, 'title');
      const description = this.extractMetaTag(html, 'description');
      const keywords = this.extractMetaTag(html, 'keywords')?.split(',').map(k => k.trim());

      // Parse Open Graph data
      const ogData: Record<string, string> = {};
      const ogPatterns = ['og:title', 'og:description', 'og:site_name', 'og:type'];
      for (const prop of ogPatterns) {
        const value = this.extractOgTag(html, prop);
        if (value) ogData[prop] = value;
      }

      // Parse JSON-LD structured data
      const structuredData = this.extractJsonLd(html);

      console.log('[BrandDataFetcher] Website data:', { title, hasDescription: !!description, hasStructuredData: !!structuredData });

      return { title, description, keywords, structuredData, ogData };
    } catch (error) {
      console.error('[BrandDataFetcher] Website fetch error:', error);
      return null;
    }
  }

  /**
   * Extract meta tag content
   */
  private extractMetaTag(html: string, name: string): string | undefined {
    const pattern = new RegExp(
      `<meta[^>]*(?:name|property)=["']${name}["'][^>]*content=["']([^"']+)["']|` +
      `<meta[^>]*content=["']([^"']+)["'][^>]*(?:name|property)=["']${name}["']`,
      'i'
    );
    const match = html.match(pattern);
    return match?.[1] || match?.[2];
  }

  /**
   * Extract OG tag content
   */
  private extractOgTag(html: string, property: string): string | undefined {
    const pattern = new RegExp(
      `<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']+)["']|` +
      `<meta[^>]*content=["']([^"']+)["'][^>]*property=["']${property}["']`,
      'i'
    );
    const match = html.match(pattern);
    return match?.[1] || match?.[2];
  }

  /**
   * Extract HTML tag content
   */
  private extractTag(html: string, tag: string): string | undefined {
    const pattern = new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`, 'i');
    const match = html.match(pattern);
    return match?.[1]?.trim();
  }

  /**
   * Extract JSON-LD structured data
   */
  private extractJsonLd(html: string): Record<string, unknown> | undefined {
    const pattern = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    const matches = html.matchAll(pattern);

    for (const match of matches) {
      try {
        const data = JSON.parse(match[1]);
        // Look for Organization schema
        if (data['@type'] === 'Organization' || data['@type'] === 'Corporation') {
          return data;
        }
        // Check for nested data
        if (Array.isArray(data)) {
          const org = data.find(d => d['@type'] === 'Organization' || d['@type'] === 'Corporation');
          if (org) return org;
        }
        // Check @graph array
        if (data['@graph'] && Array.isArray(data['@graph'])) {
          const org = data['@graph'].find((d: Record<string, unknown>) =>
            d['@type'] === 'Organization' || d['@type'] === 'Corporation'
          );
          if (org) return org;
        }
      } catch {
        // Ignore JSON parse errors
      }
    }

    return undefined;
  }

  /**
   * Merge data from multiple sources
   */
  private mergeData(
    brandName: string,
    wikipediaData: Awaited<ReturnType<typeof this.fetchFromWikipedia>>,
    websiteData: Awaited<ReturnType<typeof this.fetchFromWebsite>>,
    sources: DataSource[]
  ): Omit<FetchedBrandData, 'positioning' | 'sources' | 'confidence'> {
    const data: Omit<FetchedBrandData, 'positioning' | 'sources' | 'confidence'> = {
      companyName: brandName
    };

    // Merge from Wikipedia
    if (wikipediaData) {
      const { pageData, infobox } = wikipediaData;

      // Use page title as company name if more specific
      if (pageData?.title && !pageData.title.includes('disambiguation')) {
        data.companyName = pageData.title;
      }

      if (pageData?.extract) {
        data.description = pageData.extract.substring(0, 500);
        sources.push({ type: 'wikipedia', url: pageData.fullurl, field: 'description', confidence: 0.9 });
      }

      if (infobox.founded) {
        const year = parseInt(infobox.founded);
        if (!isNaN(year) && year > 1800 && year <= new Date().getFullYear()) {
          data.foundedYear = year;
          sources.push({ type: 'wikipedia', field: 'foundedYear', confidence: 0.95 });
        }
      }

      if (infobox.headquarters) {
        data.headquarters = infobox.headquarters;
        sources.push({ type: 'wikipedia', field: 'headquarters', confidence: 0.9 });
      }

      if (infobox.ceo) {
        data.ceo = infobox.ceo;
        sources.push({ type: 'wikipedia', field: 'ceo', confidence: 0.8 });
      }

      if (infobox.employees) {
        const count = parseInt(infobox.employees.replace(/,/g, ''));
        if (!isNaN(count) && count > 0) {
          data.employeeCount = count;
          sources.push({ type: 'wikipedia', field: 'employeeCount', confidence: 0.7 });
        }
      }

      if (infobox.industry) {
        data.industry = infobox.industry;
        sources.push({ type: 'wikipedia', field: 'industry', confidence: 0.9 });
      }

      if (infobox.website) {
        data.websiteUrl = this.normalizeUrl(infobox.website);
        sources.push({ type: 'wikipedia', field: 'websiteUrl', confidence: 0.95 });
      }

      if (infobox.revenue) {
        data.revenue = infobox.revenue;
        sources.push({ type: 'wikipedia', field: 'revenue', confidence: 0.7 });
      }

      if (infobox.traded_as) {
        const ticker = this.extractStockTicker(infobox.traded_as);
        if (ticker) {
          data.stockTicker = ticker;
          sources.push({ type: 'wikipedia', field: 'stockTicker', confidence: 0.9 });
        }
      }

      if (infobox.parent) {
        data.parentCompany = infobox.parent;
        sources.push({ type: 'wikipedia', field: 'parentCompany', confidence: 0.85 });
      }
    }

    // Override/supplement with website data
    if (websiteData) {
      if (websiteData.structuredData) {
        const sd = websiteData.structuredData;

        if (sd.name && typeof sd.name === 'string') {
          data.companyName = sd.name;
          sources.push({ type: 'website', field: 'companyName', confidence: 1.0 });
        }

        if (sd.description && typeof sd.description === 'string' && !data.description) {
          data.description = sd.description;
          sources.push({ type: 'website', field: 'description', confidence: 0.95 });
        }

        if (sd.foundingDate) {
          const year = new Date(sd.foundingDate as string).getFullYear();
          if (!isNaN(year)) {
            data.foundedYear = year;
            const existingIdx = sources.findIndex(s => s.field === 'foundedYear');
            if (existingIdx >= 0) sources.splice(existingIdx, 1);
            sources.push({ type: 'website', field: 'foundedYear', confidence: 1.0 });
          }
        }

        // Extract address from structured data
        if (sd.address && typeof sd.address === 'object') {
          const addr = sd.address as Record<string, string>;
          const parts = [addr.addressLocality, addr.addressRegion, addr.addressCountry].filter(Boolean);
          if (parts.length > 0 && !data.headquarters) {
            data.headquarters = parts.join(', ');
            sources.push({ type: 'website', field: 'headquarters', confidence: 0.95 });
          }
        }

        // Number of employees from structured data
        if (sd.numberOfEmployees && typeof sd.numberOfEmployees === 'object') {
          const emp = sd.numberOfEmployees as Record<string, unknown>;
          if (emp.value && typeof emp.value === 'number') {
            data.employeeCount = emp.value;
            const existingIdx = sources.findIndex(s => s.field === 'employeeCount');
            if (existingIdx >= 0) sources.splice(existingIdx, 1);
            sources.push({ type: 'website', field: 'employeeCount', confidence: 1.0 });
          }
        }
      }

      // Use OG description if no other description
      if (!data.description && websiteData.ogData?.['og:description']) {
        data.description = websiteData.ogData['og:description'];
        sources.push({ type: 'website', field: 'description', confidence: 0.85 });
      }
    }

    return data;
  }

  /**
   * Analyze brand positioning based on collected data
   */
  private analyzePositioning(
    mergedData: Omit<FetchedBrandData, 'positioning' | 'sources' | 'confidence'>,
    wikipediaData: Awaited<ReturnType<typeof this.fetchFromWikipedia>>,
    websiteData: Awaited<ReturnType<typeof this.fetchFromWebsite>>
  ): BrandPositioning {
    const positioning: BrandPositioning = {
      primary: 'quality-focused',
      keyAttributes: []
    };

    const allText = [
      mergedData.description || '',
      mergedData.industry || '',
      wikipediaData?.pageData?.extract || '',
      websiteData?.description || '',
      ...(websiteData?.keywords || []),
      ...(wikipediaData?.categories || [])
    ].join(' ').toLowerCase();

    // Positioning detection patterns
    const positioningPatterns: Record<PositioningType, string[]> = {
      'premium': ['premium', 'luxury', 'high-end', 'exclusive', 'prestige', 'finest', 'upscale'],
      'innovative': ['innovative', 'innovation', 'cutting-edge', 'pioneer', 'breakthrough', 'revolutionary', 'disruptive technology'],
      'affordable': ['affordable', 'budget', 'value', 'low-cost', 'economical', 'savings', 'cheap'],
      'sustainable': ['sustainable', 'eco-friendly', 'green', 'environmental', 'carbon', 'renewable', 'climate'],
      'luxury': ['luxury', 'luxurious', 'opulent', 'elite', 'haute', 'exclusive'],
      'disruptive': ['disrupt', 'transform', 'revolutionize', 'change the way', 'reimagine', 'redefine'],
      'traditional': ['tradition', 'heritage', 'established', 'legacy', 'since 18', 'since 19', 'founded in'],
      'tech-forward': ['technology', 'digital', 'ai', 'artificial intelligence', 'tech', 'software', 'platform'],
      'customer-centric': ['customer', 'user experience', 'customer service', 'satisfaction', 'support', 'customer first'],
      'quality-focused': ['quality', 'craftsmanship', 'excellence', 'precision', 'reliable', 'trusted'],
      'value-oriented': ['value', 'best price', 'affordable quality', 'smart choice', 'great value'],
      'lifestyle': ['lifestyle', 'living', 'wellness', 'health', 'life', 'experience'],
      'professional': ['professional', 'expert', 'specialist', 'b2b'],
      'enterprise': ['enterprise', 'business solution', 'corporate', 'organization', 'fortune 500']
    };

    const scores: Record<PositioningType, number> = {} as Record<PositioningType, number>;

    for (const [type, patterns] of Object.entries(positioningPatterns)) {
      scores[type as PositioningType] = patterns.reduce((score, pattern) => {
        const regex = new RegExp(pattern, 'gi');
        const matches = allText.match(regex);
        return score + (matches?.length || 0);
      }, 0);
    }

    // Sort by score
    const sorted = Object.entries(scores)
      .filter(([, score]) => score > 0)
      .sort((a, b) => b[1] - a[1]);

    if (sorted.length > 0) {
      positioning.primary = sorted[0][0] as PositioningType;
      positioning.secondary = sorted.slice(1, 3).map(([type]) => type as PositioningType);
    }

    // Detect price point
    if (allText.includes('luxury') || allText.includes('premium') || allText.includes('high-end')) {
      positioning.pricePoint = 'premium';
    } else if (allText.includes('affordable') || allText.includes('budget') || allText.includes('low-cost')) {
      positioning.pricePoint = 'budget';
    } else if (allText.includes('value') || allText.includes('mid-range')) {
      positioning.pricePoint = 'mid-range';
    }

    // Extract key attributes
    const attributePatterns = [
      'innovative', 'reliable', 'trusted', 'leading', 'global',
      'sustainable', 'fast', 'secure', 'simple', 'powerful',
      'modern', 'efficient', 'smart', 'creative', 'dynamic'
    ];
    positioning.keyAttributes = attributePatterns.filter(attr =>
      allText.includes(attr)
    );

    // Generate suggested positioning description
    positioning.suggestedDescription = this.generatePositioningDescription(positioning, mergedData);

    return positioning;
  }

  /**
   * Generate a positioning description
   */
  private generatePositioningDescription(
    positioning: BrandPositioning,
    data: Omit<FetchedBrandData, 'positioning' | 'sources' | 'confidence'>
  ): string {
    const parts: string[] = [];

    if (positioning.pricePoint) {
      parts.push(`A ${positioning.pricePoint} brand`);
    } else {
      parts.push('A brand');
    }

    parts.push(`known for ${positioning.primary.replace(/-/g, ' ')}`);

    if (positioning.secondary && positioning.secondary.length > 0) {
      parts.push(`and ${positioning.secondary[0].replace(/-/g, ' ')}`);
    }

    if (data.industry) {
      parts.push(`in the ${data.industry} sector`);
    }

    return parts.join(' ') + '.';
  }

  /**
   * Calculate confidence scores
   */
  private calculateConfidence(
    wikipediaData: Awaited<ReturnType<typeof this.fetchFromWikipedia>>,
    websiteData: Awaited<ReturnType<typeof this.fetchFromWebsite>>,
    sources: DataSource[]
  ): FetchedBrandData['confidence'] {
    const wikipediaConfidence = wikipediaData ? 0.85 : 0;
    const websiteConfidence = websiteData ? 0.9 : 0;

    // Overall is weighted average
    let overall = 0;
    if (wikipediaData && websiteData) {
      overall = (wikipediaConfidence + websiteConfidence) / 2;
    } else if (wikipediaData) {
      overall = wikipediaConfidence;
    } else if (websiteData) {
      overall = websiteConfidence;
    }

    // Boost if we have many sources
    if (sources.length >= 5) {
      overall = Math.min(overall + 0.1, 1);
    }

    return {
      overall: Math.round(overall * 100) / 100,
      wikipedia: wikipediaConfidence,
      website: websiteConfidence
    };
  }

  /**
   * Utility: Check if string is a URL
   */
  private isUrl(str: string): boolean {
    return str.startsWith('http://') || str.startsWith('https://') ||
           (str.includes('.') && !str.includes(' ') && str.length > 4);
  }

  /**
   * Utility: Normalize URL
   */
  private normalizeUrl(url: string): string {
    let normalized = url.trim();

    if (!normalized.startsWith('http')) {
      normalized = 'https://' + normalized;
    }

    try {
      const parsed = new URL(normalized);
      return parsed.origin;
    } catch {
      return normalized;
    }
  }

  /**
   * Utility: Extract brand name from URL
   */
  private extractBrandNameFromUrl(url: string): string {
    try {
      const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
      const hostname = parsed.hostname;

      // Remove www. and common TLDs
      let name = hostname
        .replace(/^www\./, '')
        .replace(/\.(com|org|net|io|co|inc|corp|biz|info)$/i, '')
        .replace(/\./g, ' ');

      // Capitalize first letter of each word
      name = name.split(' ').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');

      return name;
    } catch {
      return url;
    }
  }

  /**
   * Utility: Extract stock ticker from traded_as field
   */
  private extractStockTicker(value: string): string | undefined {
    // Match patterns like "NASDAQ: AAPL", "NYSE: IBM", "Nasdaq: TSLA"
    const match = value.match(/(?:NASDAQ|NYSE|LSE|TSE|FTSE|DAX):\s*([A-Z0-9]+)/i);
    return match?.[1]?.toUpperCase();
  }
}

// Export singleton instance
export const brandDataFetcher = new BrandDataFetcher();
