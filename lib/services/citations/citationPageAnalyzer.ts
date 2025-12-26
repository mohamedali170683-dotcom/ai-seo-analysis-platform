/**
 * Citation Page Analyzer
 *
 * Scrapes cited pages to detect:
 * 1. Brand mentions in page content (even if domain wasn't directly cited)
 * 2. Backlinks to the brand's domain within the page
 *
 * This provides "hidden brand presence" insights - showing where your brand
 * is referenced in authoritative sources that AI platforms cite.
 */

interface CitationAnalysisResult {
  url: string;
  domain: string;
  brandMentioned: boolean;
  brandMentionCount: number;
  hasBacklink: boolean;
  backlinkUrls: string[];
  scrapedAt: Date;
  error?: string;
}

interface CitationToAnalyze {
  url: string;
  domain: string;
  platform: string;
  title?: string;
}

/**
 * Analyzes a cited page to detect brand mentions and backlinks
 */
export async function analyzeCitedPage(
  citation: CitationToAnalyze,
  brandName: string,
  brandDomain: string
): Promise<CitationAnalysisResult> {
  const result: CitationAnalysisResult = {
    url: citation.url,
    domain: citation.domain,
    brandMentioned: false,
    brandMentionCount: 0,
    hasBacklink: false,
    backlinkUrls: [],
    scrapedAt: new Date(),
  };

  try {
    // Fetch page content
    const response = await fetch(citation.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; VelarisBrandAnalyzer/1.0)',
      },
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    if (!response.ok) {
      result.error = `HTTP ${response.status}`;
      return result;
    }

    const html = await response.text();

    // Extract text content (remove HTML tags for mention counting)
    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove scripts
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove styles
      .replace(/<[^>]+>/g, ' ') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    // Check for brand mentions (case-insensitive)
    const brandRegex = new RegExp(brandName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const mentions = textContent.match(brandRegex);

    if (mentions && mentions.length > 0) {
      result.brandMentioned = true;
      result.brandMentionCount = mentions.length;
    }

    // Extract all links and check for backlinks to brand domain
    const linkRegex = /<a[^>]+href=["']([^"']+)["']/gi;
    let match;
    const cleanBrandDomain = brandDomain.replace(/^https?:\/\//, '').replace(/^www\./, '').toLowerCase();

    while ((match = linkRegex.exec(html)) !== null) {
      const href = match[1];

      // Check if this link points to the brand's domain
      try {
        let linkUrl: URL;
        if (href.startsWith('http')) {
          linkUrl = new URL(href);
        } else if (href.startsWith('/')) {
          // Relative URL - skip as it's internal to the cited page
          continue;
        } else {
          // Try to parse as relative to current page
          linkUrl = new URL(href, citation.url);
        }

        const linkDomain = linkUrl.hostname.replace(/^www\./, '').toLowerCase();

        if (linkDomain.includes(cleanBrandDomain) || cleanBrandDomain.includes(linkDomain)) {
          result.hasBacklink = true;
          if (!result.backlinkUrls.includes(href)) {
            result.backlinkUrls.push(href);
          }
        }
      } catch (e) {
        // Invalid URL, skip
        continue;
      }
    }

  } catch (error: any) {
    result.error = error.message || 'Failed to scrape page';
  }

  return result;
}

/**
 * Analyzes multiple citations in parallel
 */
export async function analyzeCitations(
  citations: CitationToAnalyze[],
  brandName: string,
  brandDomain: string,
  options: {
    maxConcurrent?: number;
    skipBrandDomain?: boolean; // Skip citations that are already from brand's domain
  } = {}
): Promise<CitationAnalysisResult[]> {
  const {
    maxConcurrent = 5,
    skipBrandDomain = true,
  } = options;

  // Filter out brand's own domain if requested
  let citationsToAnalyze = citations;
  if (skipBrandDomain) {
    const cleanBrandDomain = brandDomain.replace(/^https?:\/\//, '').replace(/^www\./, '').toLowerCase();
    citationsToAnalyze = citations.filter(c =>
      !c.domain.toLowerCase().includes(cleanBrandDomain)
    );
  }

  // Process in batches to avoid overwhelming servers
  const results: CitationAnalysisResult[] = [];

  for (let i = 0; i < citationsToAnalyze.length; i += maxConcurrent) {
    const batch = citationsToAnalyze.slice(i, i + maxConcurrent);
    const batchResults = await Promise.all(
      batch.map(citation => analyzeCitedPage(citation, brandName, brandDomain))
    );
    results.push(...batchResults);

    // Small delay between batches to be respectful
    if (i + maxConcurrent < citationsToAnalyze.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}

/**
 * Filters citation analysis results to only those with brand presence
 */
export function getCitationsWithBrandPresence(
  results: CitationAnalysisResult[]
): CitationAnalysisResult[] {
  return results.filter(r => r.brandMentioned || r.hasBacklink);
}

/**
 * Generates insights from citation analysis
 */
export function generateCitationInsights(
  results: CitationAnalysisResult[]
): {
  totalAnalyzed: number;
  totalWithBrandPresence: number;
  totalBrandMentions: number;
  totalBacklinks: number;
  averageMentionsPerPage: number;
  percentageWithPresence: number;
} {
  const withPresence = getCitationsWithBrandPresence(results);
  const totalMentions = results.reduce((sum, r) => sum + r.brandMentionCount, 0);
  const totalBacklinks = results.reduce((sum, r) => sum + r.backlinkUrls.length, 0);

  return {
    totalAnalyzed: results.length,
    totalWithBrandPresence: withPresence.length,
    totalBrandMentions: totalMentions,
    totalBacklinks,
    averageMentionsPerPage: results.length > 0 ? totalMentions / results.length : 0,
    percentageWithPresence: results.length > 0 ? (withPresence.length / results.length) * 100 : 0,
  };
}
