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

    // Fetch data from multiple sources in parallel
    const [wikipediaData, websiteData] = await Promise.all([
      this.fetchFromWikipedia(brandName).catch(err => {
        console.warn('Wikipedia fetch failed:', err.message);
        return null;
      }),
      websiteUrl ? this.fetchFromWebsite(websiteUrl).catch(err => {
        console.warn('Website fetch failed:', err.message);
        return null;
      }) : Promise.resolve(null)
    ]);

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

      const searchResponse = await fetch(searchUrl);
      if (!searchResponse.ok) {
        throw new Error(`Wikipedia search failed: ${searchResponse.status}`);
      }

      const searchData = await searchResponse.json();
      const searchResults: WikipediaSearchResult[] = searchData?.query?.search || [];

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
        const altResults = altSearchData?.query?.search || [];

        if (altResults.length === 0) {
          return null;
        }
        searchResults.push(...altResults);
      }

      // Find the best match (prioritize company pages)
      const bestMatch = this.findBestWikipediaMatch(searchResults, brandName);
      if (!bestMatch) return null;

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
      console.error('Wikipedia fetch error:', error);
      return null;
    }
  }

  /**
   * Parse Wikipedia infobox for structured data
   */
  private parseWikipediaInfobox(wikitext: string): WikipediaInfobox {
    const infobox: WikipediaInfobox = {};

    // Match infobox template
    const infoboxMatch = wikitext.match(/\{\{Infobox[^}]*\}\}/is);
    if (!infoboxMatch) return infobox;

    const infoboxText = infoboxMatch[0];

    // Extract key-value pairs
    const patterns: Record<string, RegExp> = {
      founded: /\|\s*(?:founded|foundation|established)\s*=\s*\{\{[^}]*\|(\d{4})\}\}|\|\s*(?:founded|foundation|established)\s*=\s*(\d{4})/i,
      headquarters: /\|\s*(?:headquarters|hq_location|location|location_city)\s*=\s*([^\n|]+)/i,
      ceo: /\|\s*(?:key_people|CEO|chief_executive)\s*=\s*([^\n|]+)/i,
      employees: /\|\s*(?:num_employees|employees)\s*=\s*([^\n|]+)/i,
      industry: /\|\s*(?:industry|industries)\s*=\s*([^\n|]+)/i,
      revenue: /\|\s*(?:revenue)\s*=\s*([^\n|]+)/i,
      parent: /\|\s*(?:parent|owner)\s*=\s*([^\n|]+)/i,
      website: /\|\s*(?:website|url|homepage)\s*=\s*\{\{(?:URL|url)\|([^}|]+)/i,
      type: /\|\s*(?:type|company_type)\s*=\s*([^\n|]+)/i,
      traded_as: /\|\s*(?:traded_as)\s*=\s*([^\n|]+)/i
    };

    for (const [key, pattern] of Object.entries(patterns)) {
      const match = infoboxText.match(pattern);
      if (match) {
        // Get the first non-null capture group
        const value = (match[1] || match[2] || '').trim();
        if (value) {
          infobox[key] = this.cleanWikipediaValue(value);
        }
      }
    }

    return infobox;
  }

  /**
   * Clean Wikipedia markup from values
   */
  private cleanWikipediaValue(value: string): string {
    return value
      .replace(/\[\[([^|\]]+)\|?[^\]]*\]\]/g, '$1') // [[Link|Text]] -> Link or Text
      .replace(/\{\{[^}]+\}\}/g, '') // Remove templates
      .replace(/<[^>]+>/g, '') // Remove HTML
      .replace(/'''?/g, '') // Remove bold/italic
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
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
      const companyKeywords = ['company', 'corporation', 'inc.', 'ltd', 'founded', 'headquartered', 'ceo'];
      for (const keyword of companyKeywords) {
        if (snippetLower.includes(keyword)) score += 10;
      }

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

      return { title, description, keywords, structuredData, ogData };
    } catch (error) {
      console.error('Website fetch error:', error);
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
        const count = this.parseEmployeeCount(infobox.employees);
        if (count) {
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
    }

    // Override/supplement with website data
    if (websiteData) {
      if (websiteData.structuredData) {
        const sd = websiteData.structuredData;

        if (sd.name && !data.companyName) {
          data.companyName = sd.name as string;
          sources.push({ type: 'website', field: 'companyName', confidence: 1.0 });
        }

        if (sd.description && !data.description) {
          data.description = sd.description as string;
          sources.push({ type: 'website', field: 'description', confidence: 0.95 });
        }

        if (sd.foundingDate) {
          const year = new Date(sd.foundingDate as string).getFullYear();
          if (!isNaN(year)) {
            data.foundedYear = year;
            // Update source to website (higher priority)
            const existingIdx = sources.findIndex(s => s.field === 'foundedYear');
            if (existingIdx >= 0) sources.splice(existingIdx, 1);
            sources.push({ type: 'website', field: 'foundedYear', confidence: 1.0 });
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
      ...(websiteData?.keywords || [])
    ].join(' ').toLowerCase();

    // Positioning detection patterns
    const positioningPatterns: Record<PositioningType, string[]> = {
      'premium': ['premium', 'luxury', 'high-end', 'exclusive', 'prestige', 'finest'],
      'innovative': ['innovative', 'innovation', 'cutting-edge', 'pioneer', 'breakthrough', 'revolutionary'],
      'affordable': ['affordable', 'budget', 'value', 'low-cost', 'economical', 'savings'],
      'sustainable': ['sustainable', 'eco-friendly', 'green', 'environmental', 'carbon', 'renewable'],
      'luxury': ['luxury', 'luxurious', 'opulent', 'elite', 'premium'],
      'disruptive': ['disrupt', 'transform', 'revolutionize', 'change the way', 'reimagine'],
      'traditional': ['tradition', 'heritage', 'established', 'legacy', 'since 18', 'since 19'],
      'tech-forward': ['technology', 'digital', 'ai', 'artificial intelligence', 'tech', 'software'],
      'customer-centric': ['customer', 'user', 'experience', 'service', 'satisfaction', 'support'],
      'quality-focused': ['quality', 'craftsmanship', 'excellence', 'precision', 'reliable'],
      'value-oriented': ['value', 'best price', 'affordable quality', 'smart choice'],
      'lifestyle': ['lifestyle', 'living', 'wellness', 'health', 'life'],
      'professional': ['professional', 'enterprise', 'business', 'b2b', 'corporate'],
      'enterprise': ['enterprise', 'business solution', 'corporate', 'organization']
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
    if (allText.includes('luxury') || allText.includes('premium')) {
      positioning.pricePoint = 'premium';
    } else if (allText.includes('affordable') || allText.includes('budget')) {
      positioning.pricePoint = 'budget';
    } else if (allText.includes('value')) {
      positioning.pricePoint = 'mid-range';
    }

    // Extract key attributes
    const attributePatterns = [
      'innovative', 'reliable', 'trusted', 'leading', 'global',
      'sustainable', 'fast', 'secure', 'simple', 'powerful'
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
      parts.push(`${positioning.pricePoint} brand`);
    }

    parts.push(`focusing on ${positioning.primary.replace(/-/g, ' ')}`);

    if (positioning.secondary && positioning.secondary.length > 0) {
      parts.push(`with emphasis on ${positioning.secondary[0].replace(/-/g, ' ')}`);
    }

    if (data.industry) {
      parts.push(`in the ${data.industry} industry`);
    }

    return parts.join(' ');
  }

  /**
   * Calculate confidence scores
   */
  private calculateConfidence(
    wikipediaData: Awaited<ReturnType<typeof this.fetchFromWikipedia>>,
    websiteData: Awaited<ReturnType<typeof this.fetchFromWebsite>>,
    sources: DataSource[]
  ): FetchedBrandData['confidence'] {
    const wikipediaConfidence = wikipediaData ? 0.8 : 0;
    const websiteConfidence = websiteData ? 0.9 : 0;

    // Overall is average of source confidences
    const avgSourceConfidence = sources.length > 0
      ? sources.reduce((sum, s) => sum + s.confidence, 0) / sources.length
      : 0;

    return {
      overall: Math.round(((wikipediaConfidence + websiteConfidence + avgSourceConfidence) / 3) * 100) / 100,
      wikipedia: wikipediaConfidence,
      website: websiteConfidence
    };
  }

  /**
   * Utility: Check if string is a URL
   */
  private isUrl(str: string): boolean {
    return str.startsWith('http://') || str.startsWith('https://') || str.includes('.');
  }

  /**
   * Utility: Normalize URL
   */
  private normalizeUrl(url: string): string {
    if (!url.startsWith('http')) {
      url = 'https://' + url;
    }
    // Ensure trailing slash is consistent
    try {
      const parsed = new URL(url);
      return parsed.origin;
    } catch {
      return url;
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
        .replace(/\.(com|org|net|io|co|inc|corp)$/i, '')
        .replace(/\./g, ' ');

      // Capitalize first letter
      return name.charAt(0).toUpperCase() + name.slice(1);
    } catch {
      return url;
    }
  }

  /**
   * Utility: Parse employee count from various formats
   */
  private parseEmployeeCount(value: string): number | undefined {
    // Handle formats like "100,000", "100000", "~100,000", "100k"
    const cleaned = value.replace(/[,\s]/g, '').replace(/~/g, '');

    // Handle "k" suffix
    if (cleaned.toLowerCase().endsWith('k')) {
      const num = parseFloat(cleaned.slice(0, -1));
      return isNaN(num) ? undefined : Math.round(num * 1000);
    }

    const num = parseInt(cleaned);
    return isNaN(num) ? undefined : num;
  }

  /**
   * Utility: Extract stock ticker from traded_as field
   */
  private extractStockTicker(value: string): string | undefined {
    // Match patterns like "NASDAQ: AAPL", "NYSE: IBM"
    const match = value.match(/(?:NASDAQ|NYSE|LSE|TSE):\s*([A-Z]+)/i);
    return match?.[1];
  }
}

// Export singleton instance
export const brandDataFetcher = new BrandDataFetcher();
