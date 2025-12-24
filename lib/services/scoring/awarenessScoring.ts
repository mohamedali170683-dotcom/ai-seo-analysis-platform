/**
 * Awareness Stage Scoring Service
 *
 * KEY CHANGE: For awareness stage, primary signal is content/domain CITATION,
 * not brand mention. Educational queries should cite authoritative sources.
 */

import type { LLMResponse, AwarenessScore } from "@/lib/types/features";
import {
  extractCitations,
  isBrandDomain,
  calculateCitationScore
} from "../citations/citationExtractor";

/**
 * Awareness stage scoring weights
 *
 * Citation rate is the primary metric for awareness stage
 */
export const awarenessScoreWeights = {
  contentCitationRate: 0.50,  // PRIMARY - is domain cited?
  mentionRate: 0.20,          // SECONDARY - brand mentioned?
  sentiment: 0.15,            // How is category discussed?
  topicalAlignment: 0.15      // Aligns with brand content themes?
};

/**
 * Calculate awareness score for a set of responses
 */
export async function calculateAwarenessScore(
  responses: LLMResponse[],
  brand: string,
  domain: string
): Promise<AwarenessScore> {
  if (responses.length === 0) {
    return {
      finalScore: 0,
      breakdown: {
        contentCitationRate: 0,
        mentionRate: 0,
        sentiment: 0,
        topicalAlignment: 0
      }
    };
  }

  const scores = {
    contentCitationRate: 0,
    mentionRate: 0,
    sentiment: 0,
    topicalAlignment: 0
  };

  // Calculate scores for each response
  for (const response of responses) {
    // 1. Content Citation Rate (50% weight)
    const citations = extractCitations(response);
    scores.contentCitationRate += calculateCitationRate(citations, domain);

    // 2. Mention Rate (20% weight)
    scores.mentionRate += calculateMentionScore(response, brand);

    // 3. Sentiment (15% weight)
    scores.sentiment += await analyzeSentiment(response);

    // 4. Topical Alignment (15% weight)
    scores.topicalAlignment += calculateTopicalAlignment(response, brand, domain);
  }

  // Normalize scores (0-100 scale)
  const normalizedScores = {
    contentCitationRate: (scores.contentCitationRate / responses.length),
    mentionRate: (scores.mentionRate / responses.length),
    sentiment: (scores.sentiment / responses.length),
    topicalAlignment: (scores.topicalAlignment / responses.length)
  };

  // Apply weights to get final score
  const finalScore = Object.entries(awarenessScoreWeights)
    .reduce((total, [key, weight]) => {
      const scoreKey = key as keyof typeof normalizedScores;
      return total + (normalizedScores[scoreKey] * weight);
    }, 0);

  return {
    finalScore: Math.round(finalScore),
    breakdown: normalizedScores
  };
}

/**
 * Calculate citation rate for awareness stage
 * Returns percentage (0-100) of whether brand domain is cited
 */
export function calculateCitationRate(citations: any[], domain: string): number {
  if (citations.length === 0) return 0;

  const brandCitations = citations.filter(citation =>
    citation.domain && isBrandDomain(citation.domain, domain)
  );

  // If brand is cited, return 100, otherwise 0
  // (Binary for single response, averaged across all responses)
  return brandCitations.length > 0 ? 100 : 0;
}

/**
 * Calculate mention score
 * Returns 100 if brand is mentioned, 0 otherwise
 */
export function calculateMentionScore(response: LLMResponse, brand: string): number {
  const content = (response.content || "").toLowerCase();
  const brandLower = brand.toLowerCase();

  return content.includes(brandLower) ? 100 : 0;
}

/**
 * Analyze sentiment of the response
 * For awareness stage, we analyze how the category/topic is discussed
 */
export async function analyzeSentiment(response: LLMResponse): Promise<number> {
  const content = response.content || "";

  // Positive indicators
  const positivePatterns = [
    /\b(effective|beneficial|important|helpful|essential|recommended|proven)\b/gi,
    /\b(advantages|benefits|improve|enhance|support)\b/gi,
    /\b(popular|trusted|reliable|quality)\b/gi
  ];

  // Negative indicators
  const negativePatterns = [
    /\b(concerns|risks|problems|issues|drawbacks|limitations)\b/gi,
    /\b(avoid|careful|warning|caution)\b/gi,
    /\b(ineffective|unreliable|questionable)\b/gi
  ];

  let positiveCount = 0;
  let negativeCount = 0;

  positivePatterns.forEach(pattern => {
    const matches = content.match(pattern);
    positiveCount += matches ? matches.length : 0;
  });

  negativePatterns.forEach(pattern => {
    const matches = content.match(pattern);
    negativeCount += matches ? matches.length : 0;
  });

  const totalSignals = positiveCount + negativeCount;

  if (totalSignals === 0) {
    return 50; // Neutral
  }

  // Return percentage of positive sentiment (0-100)
  return (positiveCount / totalSignals) * 100;
}

/**
 * Calculate topical alignment
 * Checks if response discusses topics related to the brand's expertise
 */
export function calculateTopicalAlignment(
  response: LLMResponse,
  brand: string,
  domain: string
): number {
  const content = (response.content || "").toLowerCase();

  // Check if response includes domain or brand context
  const domainMentioned = content.includes(domain.toLowerCase());
  const brandMentioned = content.includes(brand.toLowerCase());

  // Check for content depth indicators
  const depthIndicators = [
    /\b\d+ (steps|ways|methods|tips|benefits)\b/gi,
    /\b(how to|guide to|introduction to)\b/gi,
    /\b(research|studies|according to)\b/gi
  ];

  let hasDepth = false;
  for (const pattern of depthIndicators) {
    if (pattern.test(content)) {
      hasDepth = true;
      break;
    }
  }

  let score = 0;

  // Award points for topical signals
  if (domainMentioned) score += 40;
  if (brandMentioned) score += 30;
  if (hasDepth) score += 30;

  return Math.min(100, score);
}

/**
 * Get interpretation of awareness score
 */
export function interpretAwarenessScore(score: number): string {
  if (score >= 70) {
    return "Strong awareness presence - your content is being cited as an authoritative source";
  } else if (score >= 40) {
    return "Moderate awareness - some visibility but opportunity to improve content authority";
  } else {
    return "Low awareness - create more authoritative, citable content for this topic";
  }
}

/**
 * Generate awareness stage recommendations
 */
export function generateAwarenessRecommendations(
  awarenessScore: AwarenessScore,
  domain: string
): string[] {
  const recommendations: string[] = [];
  const { breakdown } = awarenessScore;

  // Citation recommendations
  if (breakdown.contentCitationRate < 30) {
    recommendations.push(
      "Create comprehensive, authoritative guides on this topic that AI platforms can cite",
      "Add FAQ schema markup to help AI platforms extract factual information",
      "Publish research, studies, or data that establishes your brand as an authority"
    );
  }

  // Mention recommendations
  if (breakdown.mentionRate < 30 && breakdown.contentCitationRate > 50) {
    recommendations.push(
      "While your content is cited, strengthen brand presence within the cited content",
      "Add clear author attribution and brand context to authoritative content"
    );
  }

  // Sentiment recommendations
  if (breakdown.sentiment < 50) {
    recommendations.push(
      "Review awareness-stage content tone - ensure positive, helpful framing",
      "Add more benefits, advantages, and value propositions to educational content"
    );
  }

  // Topical alignment recommendations
  if (breakdown.topicalAlignment < 50) {
    recommendations.push(
      "Ensure content covers core topics comprehensively with depth",
      "Add step-by-step guides, tutorials, and how-to content",
      "Include data, statistics, and research to increase topical authority"
    );
  }

  return recommendations;
}
