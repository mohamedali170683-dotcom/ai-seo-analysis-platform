/**
 * Content Gap Analyzer
 *
 * Identifies content gaps by analyzing where competitors are cited
 * instead of your brand, and mapping opportunities to existing content.
 */

import type {
  ContentGap,
  PageInventory,
  Opportunity,
  Citation,
  LLMResponse
} from "@/lib/types/features";
import { extractCitations, isCompetitorDomain } from "../citations/citationExtractor";
import { findPagesByTopic } from "./contentInventory";

/**
 * Analyze content gaps from LLM responses
 */
export async function analyzeContentGaps(
  responses: LLMResponse[],
  brandDomain: string,
  competitors: string[],
  inventory: PageInventory[]
): Promise<ContentGap[]> {
  // Group responses by topic/query theme
  const topicGroups = groupResponsesByTopic(responses);

  const gaps: ContentGap[] = [];

  for (const [topic, topicResponses] of Object.entries(topicGroups)) {
    // Extract all citations from these responses
    const allCitations: Citation[] = [];
    for (const response of topicResponses) {
      const citations = extractCitations(response);
      allCitations.push(...citations);
    }

    // Check if brand has content on this topic
    const brandContentExists = checkBrandContentExists(topic, inventory);

    // Find which competitors are cited
    const competitorsCited = findCompetitorsCited(allCitations, competitors);

    // Only create gap if competitors are cited OR brand content doesn't exist
    if (competitorsCited.length > 0 || !brandContentExists) {
      const opportunity = calculateOpportunity(
        topicResponses.length,
        competitorsCited.length,
        brandContentExists,
        inventory,
        topic
      );

      gaps.push({
        topic,
        queryCount: topicResponses.length,
        queryExamples: topicResponses.slice(0, 3).map(r => r.query),
        brandContentExists,
        competitorsCited,
        opportunity
      });
    }
  }

  // Sort by opportunity score (descending)
  return gaps.sort((a, b) => b.opportunity.score - a.opportunity.score);
}

/**
 * Group responses by topic
 */
function groupResponsesByTopic(responses: LLMResponse[]): Record<string, LLMResponse[]> {
  const groups: Record<string, LLMResponse[]> = {};

  for (const response of responses) {
    const topic = extractTopicFromQuery(response.query);

    if (!groups[topic]) {
      groups[topic] = [];
    }
    groups[topic].push(response);
  }

  return groups;
}

/**
 * Extract topic from query
 */
function extractTopicFromQuery(query: string): string {
  // Remove common question words and modifiers
  let topic = query.toLowerCase()
    .replace(/^(what|how|why|when|where|who|which|best|top|good)\s+/g, "")
    .replace(/\s+(is|are|for|to|in|on|with|at)\s+/g, " ")
    .replace(/\?/g, "")
    .trim();

  // Extract key noun phrases (simplified)
  const words = topic.split(/\s+/);

  // Take the last 2-3 meaningful words (likely the core topic)
  const meaningfulWords = words.filter(w => w.length > 3);
  topic = meaningfulWords.slice(-3).join(" ");

  return topic;
}

/**
 * Check if brand has content on this topic
 */
function checkBrandContentExists(topic: string, inventory: PageInventory[]): boolean {
  const matchingPages = findPagesByTopic(inventory, topic);

  // Consider content exists if there's at least one page with decent citability
  return matchingPages.some(page => page.citabilityScore >= 40);
}

/**
 * Find which competitors are cited
 */
function findCompetitorsCited(citations: Citation[], competitors: string[]): string[] {
  const cited = new Set<string>();

  for (const citation of citations) {
    if (citation.domain) {
      for (const competitor of competitors) {
        if (isCompetitorDomain(citation.domain, [competitor])) {
          cited.add(competitor);
        }
      }
    }
  }

  return Array.from(cited);
}

/**
 * Calculate opportunity score and priority
 */
function calculateOpportunity(
  queryCount: number,
  competitorCitationCount: number,
  brandContentExists: boolean,
  inventory: PageInventory[],
  topic: string
): Opportunity {
  let score = 0;

  // Factor 1: Query volume (0-40 points)
  if (queryCount >= 10) {
    score += 40;
  } else if (queryCount >= 5) {
    score += 30;
  } else if (queryCount >= 3) {
    score += 20;
  } else {
    score += 10;
  }

  // Factor 2: Competitor citations (0-30 points)
  if (competitorCitationCount >= 5) {
    score += 30;
  } else if (competitorCitationCount >= 3) {
    score += 20;
  } else if (competitorCitationCount >= 1) {
    score += 10;
  }

  // Factor 3: Brand content status (0-30 points)
  if (!brandContentExists) {
    score += 30; // High opportunity - create new content
  } else {
    // Check quality of existing content
    const matchingPages = findPagesByTopic(inventory, topic);
    const avgCitability = matchingPages.reduce((sum, p) => sum + p.citabilityScore, 0) / matchingPages.length;

    if (avgCitability < 40) {
      score += 20; // Medium opportunity - optimize existing
    } else if (avgCitability < 60) {
      score += 10; // Low opportunity - minor improvements
    }
    // If avgCitability >= 60, add 0 points (content is already good)
  }

  // Determine priority
  let priority: "HIGH" | "MEDIUM" | "LOW";
  if (score >= 70) {
    priority = "HIGH";
  } else if (score >= 50) {
    priority = "MEDIUM";
  } else {
    priority = "LOW";
  }

  // Determine type
  const type = brandContentExists ? "optimization" : "creation";

  return { score, priority, type };
}

/**
 * Map content gaps to existing inventory
 */
export function mapGapsToInventory(
  gaps: ContentGap[],
  inventory: PageInventory[]
): Array<{
  gap: ContentGap;
  existingPages: PageInventory[];
  recommendation: string;
}> {
  return gaps.map(gap => {
    const existingPages = findPagesByTopic(inventory, gap.topic);

    let recommendation: string;

    if (gap.opportunity.type === "creation") {
      recommendation = `Create comprehensive guide on "${gap.topic}" - competitors ${gap.competitorsCited.join(", ")} are currently being cited`;
    } else {
      // Optimization
      if (existingPages.length === 0) {
        recommendation = `No exact match found - create new content or expand related pages to cover "${gap.topic}"`;
      } else {
        const lowestScore = Math.min(...existingPages.map(p => p.citabilityScore));
        if (lowestScore < 40) {
          recommendation = `Significantly improve citability of ${existingPages[0].url} (current score: ${lowestScore})`;
        } else if (lowestScore < 60) {
          recommendation = `Enhance ${existingPages[0].url} with more data, research, and structured markup`;
        } else {
          recommendation = `Optimize ${existingPages[0].url} - already good (${lowestScore}) but competitors still cited`;
        }
      }
    }

    return {
      gap,
      existingPages,
      recommendation
    };
  });
}

/**
 * Generate actionable content recommendations
 */
export function generateContentRecommendations(
  gaps: ContentGap[],
  inventory: PageInventory[]
): Array<{
  priority: "HIGH" | "MEDIUM" | "LOW";
  action: string;
  topic: string;
  reasoning: string;
  estimatedImpact: string;
}> {
  const recommendations = [];

  for (const gap of gaps) {
    const existingPages = findPagesByTopic(inventory, gap.topic);

    let action: string;
    let reasoning: string;
    let estimatedImpact: string;

    if (gap.opportunity.type === "creation") {
      action = `Create new comprehensive guide: "${gap.topic}"`;
      reasoning = `${gap.queryCount} queries on this topic, ${gap.competitorsCited.length} competitors cited, no brand content exists`;
      estimatedImpact = `Capture ${gap.queryCount} queries currently going to competitors`;
    } else {
      const avgCitability = existingPages.reduce((sum, p) => sum + p.citabilityScore, 0) / existingPages.length;

      action = `Optimize existing content: ${existingPages[0]?.title || gap.topic}`;
      reasoning = `Current citability: ${Math.round(avgCitability)}/100. ${gap.competitorsCited.length} competitors cited instead of brand`;
      estimatedImpact = `Improve citation rate for ${gap.queryCount} related queries`;
    }

    recommendations.push({
      priority: gap.opportunity.priority,
      action,
      topic: gap.topic,
      reasoning,
      estimatedImpact
    });
  }

  // Sort by priority (HIGH > MEDIUM > LOW)
  const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
  return recommendations.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
}

/**
 * Analyze citation patterns across competitors
 */
export function analyzeCitationPatterns(
  responses: LLMResponse[],
  competitors: string[]
): Record<string, {
  competitor: string;
  totalCitations: number;
  citedByLLM: Record<string, number>;
  topTopics: Array<{ topic: string; count: number }>;
  averagePosition: number;
}> {
  const patterns: Record<string, any> = {};

  // Initialize
  for (const competitor of competitors) {
    patterns[competitor] = {
      competitor,
      totalCitations: 0,
      citedByLLM: {
        chatgpt: 0,
        gemini: 0,
        copilot: 0,
        perplexity: 0
      },
      topicCounts: {} as Record<string, number>,
      positions: [] as number[]
    };
  }

  // Analyze each response
  for (const response of responses) {
    const citations = extractCitations(response);
    const topic = extractTopicFromQuery(response.query);

    for (const citation of citations) {
      if (!citation.domain) continue;

      for (const competitor of competitors) {
        if (isCompetitorDomain(citation.domain, [competitor])) {
          patterns[competitor].totalCitations++;
          patterns[competitor].citedByLLM[response.llm]++;
          patterns[competitor].topicCounts[topic] = (patterns[competitor].topicCounts[topic] || 0) + 1;

          // Track position if available
          if (citation.url) {
            // Estimate position from citation order (simplified)
            const citationIndex = citations.indexOf(citation);
            patterns[competitor].positions.push(citationIndex + 1);
          }
        }
      }
    }
  }

  // Calculate final metrics
  for (const competitor of competitors) {
    const pattern = patterns[competitor];

    // Get top topics
    const topicEntries = Object.entries(pattern.topicCounts)
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 5);
    pattern.topTopics = topicEntries.map(([topic, count]) => ({ topic, count: count as number }));

    // Calculate average position
    pattern.averagePosition = pattern.positions.length > 0
      ? pattern.positions.reduce((sum: number, pos: number) => sum + pos, 0) / pattern.positions.length
      : 0;

    // Clean up temporary fields
    delete pattern.topicCounts;
    delete pattern.positions;
  }

  return patterns;
}

/**
 * Find quick win opportunities (easy to optimize)
 */
export function findQuickWins(
  gaps: ContentGap[],
  inventory: PageInventory[]
): Array<{
  gap: ContentGap;
  page: PageInventory;
  currentScore: number;
  potentialScore: number;
  improvements: string[];
}> {
  const quickWins = [];

  for (const gap of gaps) {
    if (gap.opportunity.type !== "optimization") continue;

    const existingPages = findPagesByTopic(inventory, gap.topic);

    for (const page of existingPages) {
      // Quick win: page exists with 40-70 score (room for improvement)
      if (page.citabilityScore >= 40 && page.citabilityScore < 70) {
        const improvements: string[] = [];
        let potentialScore = page.citabilityScore;

        // Check what's missing
        if (!page.hasStructuredData) {
          improvements.push("Add Schema.org structured data (+25 points)");
          potentialScore += 25;
        }

        if (page.wordCount < 1200) {
          improvements.push(`Expand content to 1200+ words (currently ${page.wordCount})`);
          potentialScore += 10;
        }

        if (improvements.length > 0) {
          quickWins.push({
            gap,
            page,
            currentScore: page.citabilityScore,
            potentialScore: Math.min(100, potentialScore),
            improvements
          });
        }
      }
    }
  }

  // Sort by potential gain
  return quickWins.sort((a, b) =>
    (b.potentialScore - b.currentScore) - (a.potentialScore - a.currentScore)
  );
}

/**
 * Calculate ROI estimate for content improvements
 */
export function estimateContentROI(
  gap: ContentGap,
  currentCitability: number = 0
): {
  estimatedQueriesCaptured: number;
  estimatedVisibilityIncrease: number;
  effortLevel: "LOW" | "MEDIUM" | "HIGH";
  recommendation: string;
} {
  // Estimate queries captured based on gap severity
  const estimatedQueriesCaptured = Math.round(gap.queryCount * 0.6); // Assume 60% capture rate

  // Estimate visibility increase
  const estimatedVisibilityIncrease = gap.opportunity.type === "creation"
    ? gap.queryCount * 5  // New content = big impact
    : (70 - currentCitability) / 10 * gap.queryCount; // Optimization = scaled impact

  // Determine effort level
  let effortLevel: "LOW" | "MEDIUM" | "HIGH";
  if (gap.opportunity.type === "creation") {
    effortLevel = gap.queryCount >= 10 ? "HIGH" : "MEDIUM";
  } else {
    effortLevel = currentCitability < 40 ? "HIGH" : currentCitability < 60 ? "MEDIUM" : "LOW";
  }

  // Generate recommendation
  let recommendation: string;
  if (estimatedVisibilityIncrease > 50 && effortLevel !== "HIGH") {
    recommendation = "High ROI opportunity - prioritize this content";
  } else if (estimatedVisibilityIncrease > 30) {
    recommendation = "Good ROI - include in content roadmap";
  } else {
    recommendation = "Lower ROI - consider if resources available";
  }

  return {
    estimatedQueriesCaptured,
    estimatedVisibilityIncrease: Math.round(estimatedVisibilityIncrease),
    effortLevel,
    recommendation
  };
}
