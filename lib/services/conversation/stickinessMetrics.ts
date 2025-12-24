/**
 * Stickiness Metrics Calculator
 *
 * Calculates metrics that measure how "sticky" a brand is in AI conversations.
 * Key question: Does the brand stay mentioned throughout the conversation?
 */

import type {
  ConversationSession,
  StickinessScore,
  DropOffAnalysis,
  Takeover,
  FinalMetrics
} from "@/lib/types/features";

/**
 * Weights for stickiness score calculation
 */
const stickinessWeights = {
  persistenceRate: 0.30,              // How often brand is mentioned
  dropOffPenalty: 0.20,               // When did brand disappear
  recoveryBonus: 0.10,                // Did brand reappear after drop-off
  sentimentTrajectory: 0.15,          // Is sentiment improving or declining
  recommendationMaintenance: 0.15,    // Is brand still recommended at end
  competitorTakeoverPenalty: 0.10     // Did competitors replace the brand
};

/**
 * Calculate final metrics for a conversation session
 */
export function calculateFinalMetrics(session: ConversationSession): FinalMetrics {
  const stickiness = calculateStickinessScore(session);
  const averageSentiment = calculateAverageSentiment(session);
  const recommendationRate = calculateRecommendationRate(session);

  return {
    stickiness,
    averageSentiment,
    recommendationRate
  };
}

/**
 * Calculate overall stickiness score
 */
export function calculateStickinessScore(session: ConversationSession): StickinessScore {
  const persistence = calculatePersistenceRate(session);
  const dropOff = analyzeDropOff(session);
  const recovery = calculateRecoveryRate(session);
  const sentimentTrajectory = analyzeSentimentTrajectory(session);
  const recommendationMaintenance = analyzeRecommendationMaintenance(session);
  const takeovers = analyzeCompetitorTakeovers(session);

  // Calculate composite score
  let compositeScore = 0;

  // Add positive factors
  compositeScore += persistence * stickinessWeights.persistenceRate;
  compositeScore += dropOff.score * stickinessWeights.dropOffPenalty;
  compositeScore += recovery * stickinessWeights.recoveryBonus;
  compositeScore += sentimentTrajectory * stickinessWeights.sentimentTrajectory;
  compositeScore += recommendationMaintenance * stickinessWeights.recommendationMaintenance;

  // Subtract competitor takeover penalty
  const takeoverPenalty = takeovers.length * 20; // 20 points per takeover
  compositeScore -= takeoverPenalty * stickinessWeights.competitorTakeoverPenalty;

  // Ensure score is between 0-100
  const finalScore = Math.max(0, Math.min(100, compositeScore));

  return {
    overall: Math.round(finalScore),
    persistence,
    dropOff,
    recovery,
    takeovers
  };
}

/**
 * Calculate persistence rate (% of turns where brand is mentioned)
 */
export function calculatePersistenceRate(session: ConversationSession): number {
  if (session.turns.length === 0) return 0;

  const turnsWithBrand = session.turns.filter(turn => turn.brandPresent).length;
  return (turnsWithBrand / session.turns.length) * 100;
}

/**
 * Analyze drop-off (when did brand disappear?)
 */
export function analyzeDropOff(session: ConversationSession): DropOffAnalysis {
  if (session.turns.length === 0) {
    return { dropped: false, score: 0 };
  }

  let lastMentionTurn = 0;

  // Find last turn where brand was mentioned
  for (let i = 0; i < session.turns.length; i++) {
    if (session.turns[i].brandPresent) {
      lastMentionTurn = i + 1; // Turn numbers start at 1
    }
  }

  // If brand was mentioned in last turn, no drop-off
  if (lastMentionTurn === session.turns.length) {
    return {
      dropped: false,
      persistedToEnd: true,
      score: 100
    };
  }

  // If brand was never mentioned
  if (lastMentionTurn === 0) {
    return {
      dropped: true,
      lastMentionTurn: 0,
      score: 0
    };
  }

  // Brand dropped off at some point
  const dropOffScore = (lastMentionTurn / session.turns.length) * 100;

  return {
    dropped: true,
    lastMentionTurn,
    score: dropOffScore
  };
}

/**
 * Calculate recovery rate (did brand reappear after disappearing?)
 */
export function calculateRecoveryRate(session: ConversationSession): number {
  if (session.turns.length < 3) return 0;

  let recoveries = 0;
  let opportunities = 0;

  // Look for patterns where brand disappears then reappears
  for (let i = 1; i < session.turns.length - 1; i++) {
    const prev = session.turns[i - 1];
    const curr = session.turns[i];
    const next = session.turns[i + 1];

    // Opportunity for recovery: brand was present, then not present
    if (prev.brandPresent && !curr.brandPresent) {
      opportunities++;

      // Check if brand recovered in next turn
      if (next.brandPresent) {
        recoveries++;
      }
    }
  }

  if (opportunities === 0) return 0;

  return (recoveries / opportunities) * 100;
}

/**
 * Analyze sentiment trajectory (is sentiment improving or declining?)
 */
function analyzeSentimentTrajectory(session: ConversationSession): number {
  const turnsWithBrand = session.turns.filter(turn => turn.brandPresent);

  if (turnsWithBrand.length < 2) return 50; // Neutral if not enough data

  // Calculate average sentiment in first half vs second half
  const midpoint = Math.floor(turnsWithBrand.length / 2);
  const firstHalf = turnsWithBrand.slice(0, midpoint);
  const secondHalf = turnsWithBrand.slice(midpoint);

  const firstHalfSentiment = calculateAverageSentimentForTurns(firstHalf);
  const secondHalfSentiment = calculateAverageSentimentForTurns(secondHalf);

  // If sentiment improved, score higher
  if (secondHalfSentiment > firstHalfSentiment) {
    return 100; // Improving
  } else if (secondHalfSentiment < firstHalfSentiment) {
    return 25; // Declining
  } else {
    return 50; // Stable
  }
}

/**
 * Analyze recommendation maintenance (is brand still recommended at end?)
 */
function analyzeRecommendationMaintenance(session: ConversationSession): number {
  if (session.turns.length === 0) return 0;

  // Check last 2 turns for recommendation signals
  const lastTurns = session.turns.slice(-2);
  const recommendationSignals = [
    "recommend", "suggest", "choose", "pick", "go with", "best choice"
  ];

  for (const turn of lastTurns.reverse()) {
    if (turn.brandPresent) {
      const content = (turn.response.content || turn.response.fullResponse || "").toLowerCase();
      const hasRecommendation = recommendationSignals.some(signal =>
        content.includes(signal)
      );

      return hasRecommendation ? 100 : 50;
    }
  }

  return 0; // Brand not mentioned in final turns
}

/**
 * Analyze competitor takeovers (who replaced the brand?)
 */
export function analyzeCompetitorTakeovers(session: ConversationSession): Takeover[] {
  const takeovers: Takeover[] = [];

  for (let i = 1; i < session.turns.length; i++) {
    const prev = session.turns[i - 1];
    const curr = session.turns[i];

    // Takeover: brand was present, now absent, competitors present
    if (
      prev.brandPresent &&
      !curr.brandPresent &&
      curr.competitorsPresent.length > 0
    ) {
      takeovers.push({
        atTurn: curr.turnNumber,
        query: curr.query,
        replacedBy: curr.competitorsPresent
      });
    }
  }

  return takeovers;
}

/**
 * Calculate average sentiment for turns
 */
function calculateAverageSentimentForTurns(turns: any[]): number {
  if (turns.length === 0) return 0;

  const sentimentScores = turns.map(turn => {
    switch (turn.analysis.sentiment) {
      case "positive": return 100;
      case "neutral": return 50;
      case "negative": return 0;
      default: return 50;
    }
  });

  return sentimentScores.reduce((sum, score) => sum + score, 0) / sentimentScores.length;
}

/**
 * Calculate average sentiment across session
 */
function calculateAverageSentiment(session: ConversationSession): string {
  const turnsWithBrand = session.turns.filter(turn => turn.brandPresent);

  if (turnsWithBrand.length === 0) return "neutral";

  const avgScore = calculateAverageSentimentForTurns(turnsWithBrand);

  if (avgScore >= 70) return "positive";
  if (avgScore >= 30) return "neutral";
  return "negative";
}

/**
 * Calculate recommendation rate
 */
function calculateRecommendationRate(session: ConversationSession): number {
  const turnsWithBrand = session.turns.filter(turn => turn.brandPresent);

  if (turnsWithBrand.length === 0) return 0;

  const recommendationSignals = [
    "recommend", "highly recommend", "suggest", "best choice",
    "excellent option", "top pick", "go with", "choose"
  ];

  const turnsWithRecommendation = turnsWithBrand.filter(turn => {
    const content = (turn.response.content || turn.response.fullResponse || "").toLowerCase();
    return recommendationSignals.some(signal => content.includes(signal));
  });

  return (turnsWithRecommendation.length / turnsWithBrand.length) * 100;
}

/**
 * Get interpretation of stickiness score
 */
export function interpretStickinessScore(score: StickinessScore): {
  level: "excellent" | "good" | "fair" | "poor";
  message: string;
  insights: string[];
} {
  const insights: string[] = [];

  // Analyze persistence
  if (score.persistence >= 80) {
    insights.push("Strong brand persistence throughout conversation");
  } else if (score.persistence < 40) {
    insights.push("⚠️ Brand frequently absent from conversation");
  }

  // Analyze drop-off
  if (score.dropOff.dropped && score.dropOff.lastMentionTurn) {
    insights.push(`⚠️ Brand dropped off at turn ${score.dropOff.lastMentionTurn}`);
  } else if (score.dropOff.persistedToEnd) {
    insights.push("✅ Brand maintained through entire conversation");
  }

  // Analyze takeovers
  if (score.takeovers.length > 0) {
    const competitors = [...new Set(score.takeovers.flatMap(t => t.replacedBy))];
    insights.push(`⚠️ ${score.takeovers.length} competitor takeover(s) by: ${competitors.join(", ")}`);
  }

  // Analyze recovery
  if (score.recovery > 50) {
    insights.push("✅ Brand recovered well after drop-offs");
  }

  // Overall level
  let level: "excellent" | "good" | "fair" | "poor";
  let message: string;

  if (score.overall >= 80) {
    level = "excellent";
    message = "Excellent brand stickiness - your brand dominates the conversation";
  } else if (score.overall >= 60) {
    level = "good";
    message = "Good brand stickiness - maintains presence with some gaps";
  } else if (score.overall >= 40) {
    level = "fair";
    message = "Fair brand stickiness - frequently replaced by competitors";
  } else {
    level = "poor";
    message = "Poor brand stickiness - brand struggles to stay relevant in conversation";
  }

  return { level, message, insights };
}

/**
 * Generate recommendations based on stickiness analysis
 */
export function generateStickinessRecommendations(score: StickinessScore): string[] {
  const recommendations: string[] = [];

  // Persistence recommendations
  if (score.persistence < 50) {
    recommendations.push(
      "Improve content breadth to ensure brand appears in more AI responses",
      "Create content that addresses follow-up questions users might ask",
      "Strengthen brand authority across multiple topics in your category"
    );
  }

  // Drop-off recommendations
  if (score.dropOff.dropped && score.dropOff.lastMentionTurn && score.dropOff.lastMentionTurn < 5) {
    recommendations.push(
      "Brand drops off early in conversations - create deeper, more comprehensive content",
      "Ensure content answers common follow-up questions, not just initial queries",
      "Add FAQ sections and detailed comparisons to maintain relevance"
    );
  }

  // Takeover recommendations
  if (score.takeovers.length > 0) {
    const competitors = [...new Set(score.takeovers.flatMap(t => t.replacedBy))];
    recommendations.push(
      `Competitors ${competitors.join(", ")} are replacing your brand in conversations`,
      "Analyze competitor content strategies and differentiate your messaging",
      "Create comparison content that addresses why users might switch to competitors"
    );
  }

  // Recovery recommendations
  if (score.recovery < 30 && score.persistence > 40) {
    recommendations.push(
      "Once brand drops from conversation, it rarely recovers",
      "Create \"stickier\" content that keeps brand top-of-mind throughout user journey",
      "Ensure brand value proposition is memorable and reinforced"
    );
  }

  return recommendations;
}
