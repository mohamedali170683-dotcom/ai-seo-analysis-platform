/**
 * Citation URL Crawler
 *
 * Crawls URLs cited by AI platforms to verify brand mentions
 * and extract context for optimization insights.
 */

import type { Citation, LLMResponse } from "@/lib/types/features";
import { extractCitations } from "./citationExtractor";

export interface CitationVerification {
  citation: Citation;
  verification: {
    urlAccessible: boolean;
    brandMentioned: boolean;
    competitorsMentioned: string[];
    mentionContext: string[];
    mentionSentiment: "positive" | "neutral" | "negative" | "unknown";
    citationAccuracy: "accurate" | "partial" | "inaccurate";
  };
  content: {
    title: string;
    excerpt: string;
    wordCount: number;
    hasStructuredData: boolean;
    publishDate?: string;
  };
  discrepancies: string[];
  recommendations: string[];
}

export interface CrawlResult {
  totalCitations: number;
  crawled: number;
  verified: CitationVerification[];
  errors: Array<{
    citation: Citation;
    error: string;
  }>;
  summary: {
    accurate: number;
    partial: number;
    inaccurate: number;
    inaccessible: number;
    brandMentionRate: number;
    competitorMentionRate: number;
  };
}

/**
 * Crawl and verify citations from LLM responses
 */
export async function crawlCitations(
  responses: LLMResponse[],
  brand: string,
  competitors: string[],
  options?: {
    maxCrawls?: number;
    timeout?: number;
    includeCompetitorCitations?: boolean;
  }
): Promise<CrawlResult> {
  const maxCrawls = options?.maxCrawls || 50;
  const timeout = options?.timeout || 10000;

  // Extract all citations
  const allCitations: Citation[] = [];
  for (const response of responses) {
    const citations = extractCitations(response);
    allCitations.push(...citations);
  }

  // Deduplicate by URL
  const uniqueCitations = deduplicateCitations(allCitations);

  // Filter if needed
  const citationsToCrawl = options?.includeCompetitorCitations
    ? uniqueCitations
    : uniqueCitations.filter(c => !isCompetitorCitation(c, competitors));

  // Limit to maxCrawls
  const limitedCitations = citationsToCrawl.slice(0, maxCrawls);

  const verified: CitationVerification[] = [];
  const errors: Array<{ citation: Citation; error: string }> = [];

  // Crawl each citation
  for (const citation of limitedCitations) {
    if (!citation.url) {
      errors.push({ citation, error: "No URL available" });
      continue;
    }

    try {
      const verification = await verifyCitation(citation, brand, competitors, timeout);
      verified.push(verification);

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      errors.push({
        citation,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // Calculate summary
  const summary = calculateCrawlSummary(verified, errors);

  return {
    totalCitations: allCitations.length,
    crawled: verified.length + errors.length,
    verified,
    errors,
    summary
  };
}

/**
 * Verify a single citation
 */
export async function verifyCitation(
  citation: Citation,
  brand: string,
  competitors: string[],
  timeout: number = 10000
): Promise<CitationVerification> {
  if (!citation.url) {
    throw new Error("Citation has no URL");
  }

  const discrepancies: string[] = [];
  const recommendations: string[] = [];

  try {
    // Fetch URL with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(citation.url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AIVisibilityBot/1.0)"
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();

    // Extract content metadata
    const content = extractContentMetadata(html);

    // Verify brand mention
    const brandMentioned = checkBrandMention(html, brand);

    // Check competitor mentions
    const competitorsMentioned = checkCompetitorMentions(html, competitors);

    // Extract mention context
    const mentionContext = extractMentionContext(html, brand);

    // Analyze sentiment
    const mentionSentiment = analyzeMentionSentiment(mentionContext);

    // Determine citation accuracy
    let citationAccuracy: "accurate" | "partial" | "inaccurate";
    if (brandMentioned && mentionContext.length > 0) {
      citationAccuracy = "accurate";
    } else if (brandMentioned && mentionContext.length === 0) {
      citationAccuracy = "partial";
      discrepancies.push("Brand mentioned but no clear context found");
      recommendations.push("Improve brand prominence and context in content");
    } else {
      citationAccuracy = "inaccurate";
      discrepancies.push("Brand NOT found in cited content");
      recommendations.push("Investigate why AI cited this URL without brand mention");
    }

    // Check for competitor dominance
    if (competitorsMentioned.length > 0 && !brandMentioned) {
      discrepancies.push(`Competitors ${competitorsMentioned.join(", ")} mentioned instead of brand`);
      recommendations.push("Create competing content or improve existing content to replace this citation");
    }

    // Check content quality
    if (content.wordCount < 500) {
      recommendations.push("Cited content is thin - create more comprehensive content");
    }

    if (!content.hasStructuredData) {
      recommendations.push("Add structured data to improve citability");
    }

    return {
      citation,
      verification: {
        urlAccessible: true,
        brandMentioned,
        competitorsMentioned,
        mentionContext,
        mentionSentiment,
        citationAccuracy
      },
      content,
      discrepancies,
      recommendations
    };
  } catch (error) {
    // URL not accessible
    return {
      citation,
      verification: {
        urlAccessible: false,
        brandMentioned: false,
        competitorsMentioned: [],
        mentionContext: [],
        mentionSentiment: "unknown",
        citationAccuracy: "inaccurate"
      },
      content: {
        title: "Inaccessible",
        excerpt: "",
        wordCount: 0,
        hasStructuredData: false
      },
      discrepancies: [`URL not accessible: ${error instanceof Error ? error.message : String(error)}`],
      recommendations: ["Investigate broken or inaccessible citation"]
    };
  }
}

/**
 * Extract content metadata from HTML
 */
function extractContentMetadata(html: string): {
  title: string;
  excerpt: string;
  wordCount: number;
  hasStructuredData: boolean;
  publishDate?: string;
} {
  // Extract title
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : "Untitled";

  // Extract meta description as excerpt
  const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
  const excerpt = descMatch ? descMatch[1].trim() : "";

  // Calculate word count
  const text = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ");
  const words = text.trim().split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;

  // Check for structured data
  const hasStructuredData = html.includes('application/ld+json') ||
                           html.includes('itemtype="http://schema.org/');

  // Extract publish date
  let publishDate: string | undefined;
  const dateMatch = html.match(/<meta\s+property=["']article:published_time["']\s+content=["']([^"']+)["']/i);
  if (dateMatch) {
    publishDate = dateMatch[1];
  }

  return {
    title,
    excerpt,
    wordCount,
    hasStructuredData,
    publishDate
  };
}

/**
 * Check if brand is mentioned
 */
function checkBrandMention(html: string, brand: string): boolean {
  const text = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .toLowerCase();

  return text.includes(brand.toLowerCase());
}

/**
 * Check which competitors are mentioned
 */
function checkCompetitorMentions(html: string, competitors: string[]): string[] {
  const text = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .toLowerCase();

  const mentioned: string[] = [];

  for (const competitor of competitors) {
    if (text.includes(competitor.toLowerCase())) {
      mentioned.push(competitor);
    }
  }

  return mentioned;
}

/**
 * Extract context around brand mentions
 */
function extractMentionContext(html: string, brand: string): string[] {
  // Remove scripts and styles
  const cleanHtml = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");

  // Extract paragraphs
  const paragraphMatches = cleanHtml.matchAll(/<p[^>]*>(.*?)<\/p>/gi);
  const contexts: string[] = [];

  for (const match of paragraphMatches) {
    const paragraph = match[1].replace(/<[^>]+>/g, " ").trim();

    if (paragraph.toLowerCase().includes(brand.toLowerCase())) {
      // Extract sentence containing brand mention
      const sentences = paragraph.split(/[.!?]+/);

      for (const sentence of sentences) {
        if (sentence.toLowerCase().includes(brand.toLowerCase())) {
          contexts.push(sentence.trim());
        }
      }
    }
  }

  return contexts.slice(0, 5); // Return up to 5 contexts
}

/**
 * Analyze sentiment of brand mentions
 */
function analyzeMentionSentiment(contexts: string[]): "positive" | "neutral" | "negative" | "unknown" {
  if (contexts.length === 0) {
    return "unknown";
  }

  const positiveWords = [
    "best", "excellent", "great", "top", "leading", "recommended",
    "quality", "reliable", "trusted", "innovative", "superior", "premium"
  ];

  const negativeWords = [
    "worst", "poor", "bad", "avoid", "disappointing", "unreliable",
    "expensive", "overpriced", "limited", "lacking", "inferior"
  ];

  let positiveCount = 0;
  let negativeCount = 0;

  for (const context of contexts) {
    const contextLower = context.toLowerCase();

    for (const word of positiveWords) {
      if (contextLower.includes(word)) positiveCount++;
    }

    for (const word of negativeWords) {
      if (contextLower.includes(word)) negativeCount++;
    }
  }

  if (positiveCount > negativeCount * 1.5) return "positive";
  if (negativeCount > positiveCount * 1.5) return "negative";
  return "neutral";
}

/**
 * Deduplicate citations by URL
 */
function deduplicateCitations(citations: Citation[]): Citation[] {
  const seen = new Set<string>();
  const unique: Citation[] = [];

  for (const citation of citations) {
    if (citation.url && !seen.has(citation.url)) {
      seen.add(citation.url);
      unique.push(citation);
    }
  }

  return unique;
}

/**
 * Check if citation is from competitor domain
 */
function isCompetitorCitation(citation: Citation, competitors: string[]): boolean {
  if (!citation.domain) return false;

  const domainLower = citation.domain.toLowerCase();

  return competitors.some(competitor => {
    const competitorLower = competitor.toLowerCase().replace(/\s+/g, "");
    return domainLower.includes(competitorLower);
  });
}

/**
 * Calculate crawl summary
 */
function calculateCrawlSummary(
  verified: CitationVerification[],
  errors: Array<{ citation: Citation; error: string }>
): {
  accurate: number;
  partial: number;
  inaccurate: number;
  inaccessible: number;
  brandMentionRate: number;
  competitorMentionRate: number;
} {
  const accurate = verified.filter(v => v.verification.citationAccuracy === "accurate").length;
  const partial = verified.filter(v => v.verification.citationAccuracy === "partial").length;
  const inaccurate = verified.filter(v => v.verification.citationAccuracy === "inaccurate").length;
  const inaccessible = errors.length;

  const brandMentioned = verified.filter(v => v.verification.brandMentioned).length;
  const total = verified.length;
  const brandMentionRate = total > 0 ? (brandMentioned / total) * 100 : 0;

  const withCompetitors = verified.filter(v => v.verification.competitorsMentioned.length > 0).length;
  const competitorMentionRate = total > 0 ? (withCompetitors / total) * 100 : 0;

  return {
    accurate,
    partial,
    inaccurate,
    inaccessible,
    brandMentionRate,
    competitorMentionRate
  };
}

/**
 * Generate citation verification report
 */
export function generateCitationReport(result: CrawlResult, brand: string): string {
  const lines: string[] = [];

  lines.push("# Citation Verification Report");
  lines.push("");

  lines.push("## Summary");
  lines.push(`- Total Citations: ${result.totalCitations}`);
  lines.push(`- Citations Crawled: ${result.crawled}`);
  lines.push(`- Verification Rate: ${((result.crawled / result.totalCitations) * 100).toFixed(1)}%`);
  lines.push("");

  lines.push("## Accuracy");
  lines.push(`- Accurate: ${result.summary.accurate} (${((result.summary.accurate / result.verified.length) * 100).toFixed(1)}%)`);
  lines.push(`- Partial: ${result.summary.partial} (${((result.summary.partial / result.verified.length) * 100).toFixed(1)}%)`);
  lines.push(`- Inaccurate: ${result.summary.inaccurate} (${((result.summary.inaccurate / result.verified.length) * 100).toFixed(1)}%)`);
  lines.push(`- Inaccessible: ${result.summary.inaccessible}`);
  lines.push("");

  lines.push("## Brand Presence");
  lines.push(`- Brand Mention Rate: ${result.summary.brandMentionRate.toFixed(1)}%`);
  lines.push(`- Competitor Mention Rate: ${result.summary.competitorMentionRate.toFixed(1)}%`);
  lines.push("");

  // Discrepancies
  const verifiedWithDiscrepancies = result.verified.filter(v => v.discrepancies.length > 0);
  if (verifiedWithDiscrepancies.length > 0) {
    lines.push("## Discrepancies Found");
    for (const v of verifiedWithDiscrepancies.slice(0, 10)) {
      lines.push(`\n### ${v.citation.url}`);
      for (const disc of v.discrepancies) {
        lines.push(`- ⚠️ ${disc}`);
      }
    }
    lines.push("");
  }

  // Top recommendations
  const allRecommendations = result.verified
    .flatMap(v => v.recommendations)
    .filter((r, i, arr) => arr.indexOf(r) === i); // Unique

  if (allRecommendations.length > 0) {
    lines.push("## Top Recommendations");
    for (const rec of allRecommendations.slice(0, 10)) {
      lines.push(`- ${rec}`);
    }
  }

  return lines.join("\n");
}

/**
 * Find optimization opportunities from verified citations
 */
export function findOptimizationOpportunities(
  result: CrawlResult
): Array<{
  priority: "HIGH" | "MEDIUM" | "LOW";
  opportunity: string;
  citations: CitationVerification[];
  estimatedImpact: string;
}> {
  const opportunities = [];

  // Opportunity 1: Inaccurate citations (HIGH priority)
  const inaccurate = result.verified.filter(v => v.verification.citationAccuracy === "inaccurate");
  if (inaccurate.length > 0) {
    opportunities.push({
      priority: "HIGH" as const,
      opportunity: `${inaccurate.length} citations are inaccurate - brand not found in cited content`,
      citations: inaccurate,
      estimatedImpact: "Create content to replace these citations and capture visibility"
    });
  }

  // Opportunity 2: Competitor mentions in citations (HIGH priority)
  const withCompetitors = result.verified.filter(v =>
    v.verification.competitorsMentioned.length > 0 && !v.verification.brandMentioned
  );
  if (withCompetitors.length > 0) {
    opportunities.push({
      priority: "HIGH" as const,
      opportunity: `${withCompetitors.length} citations mention competitors but not your brand`,
      citations: withCompetitors,
      estimatedImpact: "Optimize content to appear in these citations instead of competitors"
    });
  }

  // Opportunity 3: Partial citations (MEDIUM priority)
  const partial = result.verified.filter(v => v.verification.citationAccuracy === "partial");
  if (partial.length > 0) {
    opportunities.push({
      priority: "MEDIUM" as const,
      opportunity: `${partial.length} citations are partial - brand mentioned but weak context`,
      citations: partial,
      estimatedImpact: "Improve brand prominence and context in cited content"
    });
  }

  // Opportunity 4: Negative sentiment citations (MEDIUM priority)
  const negative = result.verified.filter(v => v.verification.mentionSentiment === "negative");
  if (negative.length > 0) {
    opportunities.push({
      priority: "MEDIUM" as const,
      opportunity: `${negative.length} citations have negative sentiment toward brand`,
      citations: negative,
      estimatedImpact: "Address negative perception through content or PR strategy"
    });
  }

  // Opportunity 5: Low quality citations (LOW priority)
  const lowQuality = result.verified.filter(v =>
    v.content.wordCount < 500 || !v.content.hasStructuredData
  );
  if (lowQuality.length > 0) {
    opportunities.push({
      priority: "LOW" as const,
      opportunity: `${lowQuality.length} citations are low quality (thin content or no structured data)`,
      citations: lowQuality,
      estimatedImpact: "Create higher quality content to replace these citations"
    });
  }

  return opportunities;
}
