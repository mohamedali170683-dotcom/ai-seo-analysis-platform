/**
 * Content Inventory Service
 *
 * Builds an inventory of brand's content pages and evaluates their
 * "citability" - how likely they are to be cited by AI platforms.
 */

import type { PageInventory } from "@/lib/types/features";

/**
 * Citability factors and weights
 */
export const citabilityWeights = {
  hasStructuredData: 0.25,      // Schema.org markup
  wordCount: 0.20,               // Content depth (>800 words)
  hasDataVisualization: 0.15,    // Charts, graphs, tables
  hasOriginalResearch: 0.15,     // Primary data/studies
  hasExpertAttribution: 0.10,    // Author credentials
  hasReferences: 0.10,           // External citations
  contentFreshness: 0.05         // Recently updated
};

/**
 * Build content inventory from sitemap or crawl
 */
export async function buildContentInventory(
  domain: string,
  options?: {
    sitemapUrl?: string;
    maxPages?: number;
    focusTopics?: string[];
  }
): Promise<PageInventory[]> {
  const inventory: PageInventory[] = [];

  // Option 1: Fetch from sitemap
  if (options?.sitemapUrl) {
    const urls = await fetchSitemapUrls(options.sitemapUrl, options.maxPages);

    for (const url of urls) {
      const page = await analyzePage(url, options?.focusTopics);
      if (page) {
        inventory.push(page);
      }
    }
  }

  // Option 2: Crawl domain (limited depth)
  else {
    const urls = await crawlDomain(domain, options?.maxPages || 50);

    for (const url of urls) {
      const page = await analyzePage(url, options?.focusTopics);
      if (page) {
        inventory.push(page);
      }
    }
  }

  // Sort by citability score (descending)
  return inventory.sort((a, b) => b.citabilityScore - a.citabilityScore);
}

/**
 * Fetch URLs from XML sitemap
 */
async function fetchSitemapUrls(sitemapUrl: string, maxPages?: number): Promise<string[]> {
  try {
    const response = await fetch(sitemapUrl);
    const xml = await response.text();

    // Parse XML sitemap
    const urlMatches = xml.matchAll(/<loc>(.*?)<\/loc>/g);
    const urls: string[] = [];

    for (const match of urlMatches) {
      urls.push(match[1]);
      if (maxPages && urls.length >= maxPages) break;
    }

    return urls;
  } catch (error) {
    console.error(`Error fetching sitemap ${sitemapUrl}:`, error);
    return [];
  }
}

/**
 * Crawl domain to discover pages
 */
async function crawlDomain(domain: string, maxPages: number): Promise<string[]> {
  const discovered: Set<string> = new Set();
  const toVisit: string[] = [`https://${domain}`];
  const visited: Set<string> = new Set();

  while (toVisit.length > 0 && discovered.size < maxPages) {
    const url = toVisit.shift()!;
    if (visited.has(url)) continue;
    visited.add(url);

    try {
      const response = await fetch(url);
      const html = await response.text();

      // Extract links
      const linkMatches = html.matchAll(/href=["'](https?:\/\/[^"']+)["']/g);

      for (const match of linkMatches) {
        const foundUrl = match[1];
        const foundDomain = new URL(foundUrl).hostname;

        // Only follow same-domain links
        if (foundDomain === domain || foundDomain === `www.${domain}`) {
          if (!discovered.has(foundUrl) && !visited.has(foundUrl)) {
            discovered.add(foundUrl);
            toVisit.push(foundUrl);

            if (discovered.size >= maxPages) break;
          }
        }
      }
    } catch (error) {
      console.error(`Error crawling ${url}:`, error);
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return Array.from(discovered);
}

/**
 * Analyze a single page for citability
 */
export async function analyzePage(
  url: string,
  focusTopics?: string[]
): Promise<PageInventory | null> {
  try {
    const response = await fetch(url);
    const html = await response.text();

    // Extract page metadata
    const title = extractTitle(html);
    const path = new URL(url).pathname;
    const type = inferPageType(path, html);
    const topics = extractTopics(html, title);
    const wordCount = calculateWordCount(html);
    const hasStructuredData = checkStructuredData(html);

    // Calculate citability score
    const citabilityScore = calculateCitabilityScore(html, wordCount, hasStructuredData);

    // Filter by focus topics if specified
    if (focusTopics && focusTopics.length > 0) {
      const hasRelevantTopic = topics.some(topic =>
        focusTopics.some(focus =>
          topic.toLowerCase().includes(focus.toLowerCase())
        )
      );

      if (!hasRelevantTopic) {
        return null; // Skip irrelevant pages
      }
    }

    return {
      url,
      path,
      title,
      type,
      topics,
      wordCount,
      hasStructuredData,
      citabilityScore
    };
  } catch (error) {
    console.error(`Error analyzing page ${url}:`, error);
    return null;
  }
}

/**
 * Extract page title
 */
function extractTitle(html: string): string {
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  if (titleMatch) {
    return titleMatch[1].trim();
  }

  // Fallback to h1
  const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
  if (h1Match) {
    return h1Match[1].replace(/<[^>]+>/g, "").trim();
  }

  return "Untitled";
}

/**
 * Infer page type from path and content
 */
function inferPageType(path: string, html: string): string {
  const pathLower = path.toLowerCase();

  // Common page type patterns
  if (pathLower.includes("/blog/") || pathLower.includes("/article/")) return "blog";
  if (pathLower.includes("/guide/") || pathLower.includes("/how-to/")) return "guide";
  if (pathLower.includes("/product/") || pathLower.includes("/products/")) return "product";
  if (pathLower.includes("/category/") || pathLower.includes("/collection/")) return "category";
  if (pathLower.includes("/research/") || pathLower.includes("/study/")) return "research";
  if (pathLower.includes("/faq") || pathLower.includes("/questions")) return "faq";
  if (pathLower === "/" || pathLower === "") return "homepage";

  // Detect from content
  if (html.includes('itemtype="http://schema.org/Article"')) return "article";
  if (html.includes('itemtype="http://schema.org/Product"')) return "product";
  if (html.includes('itemtype="http://schema.org/FAQPage"')) return "faq";

  return "page";
}

/**
 * Extract topics from page content
 */
function extractTopics(html: string, title: string): string[] {
  const topics: string[] = [];

  // Extract from title
  const titleWords = title.toLowerCase().split(/\s+/);
  topics.push(...titleWords.filter(w => w.length > 4));

  // Extract from headings
  const headingMatches = html.matchAll(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/gi);
  for (const match of headingMatches) {
    const heading = match[1].replace(/<[^>]+>/g, "").trim();
    if (heading.length > 10) {
      topics.push(heading);
    }
  }

  // Extract from meta keywords (if present)
  const metaKeywords = html.match(/<meta\s+name=["']keywords["']\s+content=["']([^"']+)["']/i);
  if (metaKeywords) {
    topics.push(...metaKeywords[1].split(",").map(k => k.trim()));
  }

  // Deduplicate and limit
  return [...new Set(topics)].slice(0, 10);
}

/**
 * Calculate word count (visible text only)
 */
function calculateWordCount(html: string): number {
  // Remove scripts, styles, and tags
  let text = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ");

  // Count words
  const words = text.trim().split(/\s+/).filter(w => w.length > 0);
  return words.length;
}

/**
 * Check for structured data (Schema.org)
 */
function checkStructuredData(html: string): boolean {
  // Check for JSON-LD
  if (html.includes('type="application/ld+json"')) {
    return true;
  }

  // Check for Microdata
  if (html.includes('itemtype="http://schema.org/')) {
    return true;
  }

  // Check for RDFa
  if (html.includes('vocab="http://schema.org"')) {
    return true;
  }

  return false;
}

/**
 * Calculate citability score (0-100)
 */
export function calculateCitabilityScore(
  html: string,
  wordCount: number,
  hasStructuredData: boolean
): number {
  let score = 0;

  // 1. Structured data (25 points)
  if (hasStructuredData) {
    score += 25;
  }

  // 2. Word count (20 points)
  if (wordCount >= 2000) {
    score += 20;
  } else if (wordCount >= 1200) {
    score += 15;
  } else if (wordCount >= 800) {
    score += 10;
  } else if (wordCount >= 500) {
    score += 5;
  }

  // 3. Data visualization (15 points)
  const hasDataViz = html.includes("<table") ||
                     html.includes("chart") ||
                     html.includes("graph") ||
                     html.includes("<svg");
  if (hasDataViz) {
    score += 15;
  }

  // 4. Original research indicators (15 points)
  const researchSignals = [
    /\b\d+%\b/g,                           // Percentages
    /\bstudy\b/i,
    /\bresearch\b/i,
    /\bdata\b/i,
    /\bsurvey\b/i,
    /\banalysis\b/i
  ];

  let researchScore = 0;
  for (const signal of researchSignals) {
    if (signal.test(html)) {
      researchScore += 3;
    }
  }
  score += Math.min(15, researchScore);

  // 5. Expert attribution (10 points)
  const hasExpertAttribution = html.includes("author") ||
                               html.includes("by-line") ||
                               html.includes('itemtype="http://schema.org/Person"');
  if (hasExpertAttribution) {
    score += 10;
  }

  // 6. External references (10 points)
  const externalLinks = (html.match(/href=["']https?:\/\//g) || []).length;
  if (externalLinks >= 10) {
    score += 10;
  } else if (externalLinks >= 5) {
    score += 7;
  } else if (externalLinks >= 3) {
    score += 5;
  }

  // 7. Content freshness (5 points) - check for dates
  const currentYear = new Date().getFullYear();
  const hasFreshDate = html.includes(currentYear.toString()) ||
                       html.includes((currentYear - 1).toString());
  if (hasFreshDate) {
    score += 5;
  }

  return Math.min(100, score);
}

/**
 * Get citability interpretation
 */
export function interpretCitabilityScore(score: number): {
  level: "excellent" | "good" | "fair" | "poor";
  message: string;
  recommendations: string[];
} {
  const recommendations: string[] = [];

  if (score < 25) {
    recommendations.push("Add structured data (Schema.org markup) to improve citability");
  }

  if (score < 40) {
    recommendations.push("Increase content depth (aim for 1200+ words for comprehensive guides)");
  }

  if (score < 50) {
    recommendations.push("Add data visualization (tables, charts, infographics)");
    recommendations.push("Include original research, data, or statistics");
  }

  if (score < 60) {
    recommendations.push("Add expert author attribution with credentials");
    recommendations.push("Include external references to authoritative sources");
  }

  if (score >= 80) {
    return {
      level: "excellent",
      message: "Highly citable content - well-structured, authoritative, and comprehensive",
      recommendations: ["Maintain current quality and freshness"]
    };
  } else if (score >= 60) {
    return {
      level: "good",
      message: "Good citability with room for improvement",
      recommendations
    };
  } else if (score >= 40) {
    return {
      level: "fair",
      message: "Moderate citability - needs significant enhancement",
      recommendations
    };
  } else {
    return {
      level: "poor",
      message: "Low citability - urgent improvements needed",
      recommendations
    };
  }
}

/**
 * Filter inventory by citability threshold
 */
export function filterByCitability(
  inventory: PageInventory[],
  minScore: number = 60
): PageInventory[] {
  return inventory.filter(page => page.citabilityScore >= minScore);
}

/**
 * Group inventory by page type
 */
export function groupByType(inventory: PageInventory[]): Record<string, PageInventory[]> {
  const groups: Record<string, PageInventory[]> = {};

  for (const page of inventory) {
    if (!groups[page.type]) {
      groups[page.type] = [];
    }
    groups[page.type].push(page);
  }

  return groups;
}

/**
 * Find pages matching topic
 */
export function findPagesByTopic(
  inventory: PageInventory[],
  topic: string
): PageInventory[] {
  const topicLower = topic.toLowerCase();

  return inventory.filter(page =>
    page.topics.some(t => t.toLowerCase().includes(topicLower)) ||
    page.title.toLowerCase().includes(topicLower)
  );
}
