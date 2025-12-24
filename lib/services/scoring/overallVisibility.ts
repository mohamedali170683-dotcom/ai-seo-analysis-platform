/**
 * Overall Visibility Scoring Service
 *
 * Combines scores from all funnel stages with weighted calculation.
 */

import type { StageScores, VisibilityScore } from "@/lib/types/features";

/**
 * Stage weights for overall visibility calculation
 *
 * Decision stage has highest weight (45%) as it directly impacts purchase decisions
 * Consideration stage is second (35%) as it influences brand consideration set
 * Awareness stage is lowest (20%) as brand mentions are not expected
 */
export const stageWeights = {
  awareness: 0.20,     // Reduced - brand mentions not expected
  consideration: 0.35, // Increased importance
  decision: 0.45       // Highest - purchase intent
};

/**
 * Calculate overall visibility score from stage scores
 */
export function calculateOverallVisibility(
  stageScores: StageScores
): { overall: number; byStage: StageScores; weights: typeof stageWeights } {
  const overall =
    (stageScores.awareness * stageWeights.awareness) +
    (stageScores.consideration * stageWeights.consideration) +
    (stageScores.decision * stageWeights.decision);

  return {
    overall: Math.round(overall),
    byStage: stageScores,
    weights: stageWeights
  };
}

/**
 * Calculate visibility score with LLM breakdown
 */
export function calculateVisibilityScore(
  stageScores: StageScores,
  llmBreakdown?: Record<string, number>
): VisibilityScore {
  const overallCalc = calculateOverallVisibility(stageScores);

  return {
    overall: overallCalc.overall,
    byStage: stageScores,
    byLLM: llmBreakdown || {
      chatgpt: 0,
      gemini: 0,
      copilot: 0,
      perplexity: 0
    }
  };
}

/**
 * Calculate score for consideration stage
 * Based on mention rate and position
 */
export function calculateConsiderationScore(
  responses: any[],
  brand: string
): number {
  if (responses.length === 0) return 0;

  const weights = {
    mentionRate: 0.50,      // 50% weight: how often mentioned
    averagePosition: 0.30,   // 30% weight: position when mentioned
    sentiment: 0.20          // 20% weight: how portrayed
  };

  let totalMentioned = 0;
  let totalPosition = 0;
  let positionCount = 0;
  let totalSentiment = 0;

  for (const response of responses) {
    // Check if brand is mentioned
    const mentioned = (response.content || "").toLowerCase().includes(brand.toLowerCase());
    if (mentioned) {
      totalMentioned++;

      // Calculate position (if available)
      if (response.brandPosition) {
        totalPosition += response.brandPosition;
        positionCount++;
      }
    }

    // Calculate sentiment
    totalSentiment += getSentimentScore(response.sentiment);
  }

  // Calculate metrics
  const mentionRate = (totalMentioned / responses.length) * 100;
  const avgPosition = positionCount > 0 ? totalPosition / positionCount : 10; // Default to 10 if not mentioned
  const positionScore = Math.max(0, 100 - (avgPosition - 1) * 20); // 1st=100, 2nd=80, 3rd=60, etc.
  const sentimentScore = (totalSentiment / responses.length);

  // Apply weights
  const finalScore =
    (mentionRate * weights.mentionRate) +
    (positionScore * weights.averagePosition) +
    (sentimentScore * weights.sentiment);

  return Math.round(finalScore);
}

/**
 * Calculate score for decision stage
 * Based on sentiment and recommendation strength
 */
export function calculateDecisionScore(
  responses: any[],
  brand: string
): number {
  if (responses.length === 0) return 0;

  const weights = {
    recommendationRate: 0.40,  // 40% weight: explicit recommendations
    sentiment: 0.35,           // 35% weight: positive portrayal
    mentionRate: 0.25          // 25% weight: mentioned at all
  };

  let totalRecommended = 0;
  let totalMentioned = 0;
  let totalSentiment = 0;

  for (const response of responses) {
    const content = (response.content || "").toLowerCase();
    const brandLower = brand.toLowerCase();

    // Check if mentioned
    if (content.includes(brandLower)) {
      totalMentioned++;

      // Check for recommendation signals
      const recommendationSignals = [
        "recommend",
        "highly recommend",
        "best choice",
        "excellent option",
        "great choice",
        "worth it",
        "good value",
        "top pick"
      ];

      for (const signal of recommendationSignals) {
        if (content.includes(signal)) {
          totalRecommended++;
          break;
        }
      }
    }

    // Calculate sentiment
    totalSentiment += getSentimentScore(response.sentiment);
  }

  // Calculate metrics
  const recommendationRate = (totalRecommended / responses.length) * 100;
  const mentionRate = (totalMentioned / responses.length) * 100;
  const sentimentScore = (totalSentiment / responses.length);

  // Apply weights
  const finalScore =
    (recommendationRate * weights.recommendationRate) +
    (sentimentScore * weights.sentiment) +
    (mentionRate * weights.mentionRate);

  return Math.round(finalScore);
}

/**
 * Convert sentiment string to numeric score
 */
function getSentimentScore(sentiment: string | undefined): number {
  switch (sentiment) {
    case "positive":
      return 100;
    case "neutral":
      return 50;
    case "negative":
      return 0;
    default:
      return 50; // Default to neutral
  }
}

/**
 * Get score interpretation
 */
export function interpretScore(score: number): {
  level: "excellent" | "good" | "fair" | "poor";
  message: string;
  color: string;
} {
  if (score >= 80) {
    return {
      level: "excellent",
      message: "Excellent visibility - your brand is prominently featured by AI platforms",
      color: "green"
    };
  } else if (score >= 60) {
    return {
      level: "good",
      message: "Good visibility - your brand appears regularly with room for improvement",
      color: "blue"
    };
  } else if (score >= 40) {
    return {
      level: "fair",
      message: "Fair visibility - significant opportunity to improve brand presence",
      color: "yellow"
    };
  } else {
    return {
      level: "poor",
      message: "Low visibility - urgent action needed to improve AI presence",
      color: "red"
    };
  }
}

/**
 * Calculate score trend (requires historical data)
 */
export function calculateTrend(
  currentScore: number,
  previousScore: number
): {
  direction: "up" | "down" | "stable";
  change: number;
  changePercent: number;
} {
  const change = currentScore - previousScore;
  const changePercent = previousScore > 0 ? (change / previousScore) * 100 : 0;

  let direction: "up" | "down" | "stable" = "stable";
  if (Math.abs(changePercent) >= 5) {
    direction = change > 0 ? "up" : "down";
  }

  return {
    direction,
    change: Math.round(change),
    changePercent: Math.round(changePercent * 10) / 10
  };
}
