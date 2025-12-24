/**
 * Citation Extraction Service
 *
 * Extracts citations from LLM responses with platform-specific logic.
 * Each platform has different citation formats and reliability levels.
 */

import type { Citation, CitationExtractor, LLMResponse } from "@/lib/types/features";

/**
 * Citation extractors for each LLM platform
 */
export const citationExtractors: Record<string, CitationExtractor> = {
  perplexity: {
    hasNativeCitations: true,
    confidence: "HIGH",
    extract: (response: any): Citation[] => {
      // Perplexity provides native citations in response
      if (response.citations && Array.isArray(response.citations)) {
        return response.citations.map((url: string) => ({
          url,
          domain: extractDomain(url),
          platform: "perplexity",
          type: "url"
        }));
      }

      // Fallback: extract from sources array
      if (response.sources && Array.isArray(response.sources)) {
        return response.sources.map((source: any) => ({
          url: source.url || source,
          domain: source.domain || extractDomain(source.url || source),
          title: source.title,
          snippet: source.snippet,
          platform: "perplexity",
          type: "url"
        }));
      }

      return [];
    }
  },

  gemini: {
    hasNativeCitations: "PARTIAL",
    confidence: "MEDIUM",
    extract: (response: any): Citation[] => {
      const citations: Citation[] = [];

      // Extract from grounding metadata (when Google Search grounding is enabled)
      if (response.groundingMetadata?.groundingChunks) {
        const chunks = response.groundingMetadata.groundingChunks;

        for (const chunk of chunks) {
          if (chunk.web) {
            citations.push({
              url: chunk.web.uri,
              domain: extractDomain(chunk.web.uri),
              title: chunk.web.title,
              platform: "gemini",
              type: "url"
            });
          }
        }
      }

      // Extract from sources array (alternative format)
      if (response.sources && Array.isArray(response.sources)) {
        for (const source of response.sources) {
          const url = source.url || source;
          if (url && typeof url === "string") {
            citations.push({
              url,
              domain: source.domain || extractDomain(url),
              title: source.title,
              platform: "gemini",
              type: "url"
            });
          }
        }
      }

      // Extract from citations array (if present)
      if (response.citations && Array.isArray(response.citations)) {
        for (const url of response.citations) {
          if (url && !citations.find(c => c.url === url)) {
            citations.push({
              url,
              domain: extractDomain(url),
              platform: "gemini",
              type: "url"
            });
          }
        }
      }

      return citations;
    }
  },

  copilot: {
    hasNativeCitations: "PARTIAL",
    confidence: "MEDIUM",
    extract: (response: any): Citation[] => {
      // Copilot sometimes provides webResults
      if (response.webResults && Array.isArray(response.webResults)) {
        return response.webResults.map((result: any) => ({
          url: result.url,
          domain: result.domain || extractDomain(result.url),
          title: result.title,
          snippet: result.snippet,
          platform: "copilot",
          type: "url"
        }));
      }

      // Fallback: extract from sources
      if (response.sources && Array.isArray(response.sources)) {
        return response.sources.map((source: any) => ({
          url: source.url || source,
          domain: source.domain || extractDomain(source.url || source),
          title: source.title,
          platform: "copilot",
          type: "url"
        }));
      }

      return [];
    }
  },

  chatgpt: {
    hasNativeCitations: false,
    confidence: "LOW",
    extract: (response: any): Citation[] => {
      // ChatGPT typically doesn't provide citations
      // Use heuristic extraction from content
      const content = response.content || response.fullResponse || "";
      return extractImplicitCitations(content);
    }
  }
};

/**
 * Extract implicit citations from ChatGPT content
 * Uses patterns like "according to X" and domain mentions
 */
export function extractImplicitCitations(content: string): Citation[] {
  const citations: Citation[] = [];

  // Pattern 1: "according to [source]"
  const accordingToPattern = /according to ([A-Za-z0-9\s\.]+(?:\.com|\.org|\.net|\.edu)?)/gi;
  let match;

  while ((match = accordingToPattern.exec(content)) !== null) {
    const source = match[1].trim();
    const isDomain = /\.(com|org|net|edu)$/i.test(source);

    citations.push({
      source,
      domain: isDomain ? source : undefined,
      platform: "chatgpt",
      type: "explicit_attribution"
    });
  }

  // Pattern 2: Domain mentions with research/study/data context
  const domainPattern = /([\w-]+\.(?:com|org|net|edu))(?:'s)? (?:research|study|data|report)/gi;

  while ((match = domainPattern.exec(content)) !== null) {
    const domain = match[1];

    if (!citations.find(c => c.domain === domain)) {
      citations.push({
        source: domain,
        domain,
        platform: "chatgpt",
        type: "domain_attribution"
      });
    }
  }

  // Pattern 3: URLs in content (rare but possible)
  const urlPattern = /(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/gi;

  while ((match = urlPattern.exec(content)) !== null) {
    const url = match[1];

    if (!citations.find(c => c.url === url)) {
      citations.push({
        url,
        domain: extractDomain(url),
        platform: "chatgpt",
        type: "url"
      });
    }
  }

  return citations;
}

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string {
  try {
    // Remove protocol
    let domain = url.replace(/^https?:\/\//, "");

    // Remove www
    domain = domain.replace(/^www\./, "");

    // Get first part (domain + TLD)
    domain = domain.split("/")[0];

    return domain;
  } catch {
    return url;
  }
}

/**
 * Check if domain belongs to the brand
 */
export function isBrandDomain(domain: string, brandDomain: string): boolean {
  if (!domain || !brandDomain) return false;

  const normalizedDomain = domain.toLowerCase().replace(/^www\./, "");
  const normalizedBrand = brandDomain.toLowerCase().replace(/^www\./, "");

  return normalizedDomain.includes(normalizedBrand) || normalizedBrand.includes(normalizedDomain);
}

/**
 * Check if domain belongs to a competitor
 */
export function isCompetitorDomain(domain: string, competitors: string[]): boolean {
  if (!domain || !competitors || competitors.length === 0) return false;

  const normalizedDomain = domain.toLowerCase();

  return competitors.some(competitor => {
    const normalizedCompetitor = competitor.toLowerCase().replace(/\s+/g, "");
    return normalizedDomain.includes(normalizedCompetitor);
  });
}

/**
 * Calculate citation score for a domain
 */
export function calculateCitationScore(
  citations: Citation[],
  brandDomain: string
): number {
  if (citations.length === 0) return 0;

  const brandCitations = citations.filter(c =>
    c.domain && isBrandDomain(c.domain, brandDomain)
  );

  // Return percentage of brand citations
  return (brandCitations.length / citations.length) * 100;
}

/**
 * Main extraction function that works across all platforms
 */
export function extractCitations(response: LLMResponse): Citation[] {
  const extractor = citationExtractors[response.llm];

  if (!extractor) {
    console.warn(`No citation extractor for LLM: ${response.llm}`);
    return [];
  }

  try {
    return extractor.extract(response);
  } catch (error) {
    console.error(`Error extracting citations from ${response.llm}:`, error);
    return [];
  }
}
