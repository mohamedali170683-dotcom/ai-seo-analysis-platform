/**
 * Competitive Trigger Detection Service
 *
 * Runs query matrix tests to identify which modifiers trigger AI platforms
 * to recommend competitors over your brand.
 */

import type {
  TriggerTest,
  TriggerResult,
  TriggerAnalysis,
  LossTrigger,
  WinTrigger,
  LLMResponse
} from "@/lib/types/features";
import { generateTestMatrix, generateTargetedTestMatrix, getModifierCategoryLabel } from "./queryParameters";

/**
 * Run competitive trigger tests
 */
export async function runTriggerTests(
  config: {
    brand: string;
    domain: string;
    subcategory: string;
    competitors: string[];
    llms: string[];
    testMode?: "full" | "targeted";
  },
  queryLLM: (llm: string, query: string) => Promise<LLMResponse>
): Promise<TriggerTest> {
  const startTime = Date.now();

  // Generate test matrix
  const testQueries = config.testMode === "targeted"
    ? generateTargetedTestMatrix(config.subcategory)
    : generateTestMatrix("best", config.subcategory);

  console.log(`Generated ${testQueries.length} test queries in ${config.testMode} mode`);

  const results: TriggerResult[] = [];

  // Run tests for each LLM
  for (const llm of config.llms) {
    console.log(`Testing ${llm} with ${testQueries.length} queries...`);

    for (const testQuery of testQueries) {
      try {
        // Query the LLM
        const response = await queryLLM(llm, testQuery.fullQuery);

        // Analyze response
        const analysis = analyzeTriggerResponse(
          response,
          config.brand,
          config.competitors
        );

        results.push({
          testId: testQuery.id,
          llm,
          query: testQuery.fullQuery,
          modifier: testQuery.modifier,
          modifierCategory: testQuery.modifierCategory,
          modifierType: testQuery.modifierType,
          brandMentioned: analysis.brandMentioned,
          brandPosition: analysis.brandPosition,
          competitorsMentioned: analysis.competitorsMentioned,
          competitorPositions: analysis.competitorPositions,
          outcome: analysis.outcome,
          sentiment: analysis.sentiment,
          recommendationStrength: analysis.recommendationStrength,
          timestamp: new Date().toISOString()
        });

        // Rate limiting - add small delay between queries
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error testing query "${testQuery.fullQuery}" on ${llm}:`, error);

        // Record error but continue
        results.push({
          testId: testQuery.id,
          llm,
          query: testQuery.fullQuery,
          modifier: testQuery.modifier,
          modifierCategory: testQuery.modifierCategory,
          modifierType: testQuery.modifierType,
          brandMentioned: false,
          brandPosition: null,
          competitorsMentioned: [],
          competitorPositions: {},
          outcome: "error",
          sentiment: "neutral",
          recommendationStrength: 0,
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }

  const endTime = Date.now();
  const durationSeconds = (endTime - startTime) / 1000;

  console.log(`Completed ${results.length} trigger tests in ${durationSeconds.toFixed(1)}s`);

  return {
    brand: config.brand,
    subcategory: config.subcategory,
    competitors: config.competitors,
    llmsTested: config.llms,
    totalTests: results.length,
    results,
    analysis: analyzeTriggers(results, config.brand, config.competitors),
    timestamp: new Date().toISOString(),
    durationSeconds
  };
}

/**
 * Analyze a single trigger response
 */
export function analyzeTriggerResponse(
  response: LLMResponse,
  brand: string,
  competitors: string[]
): {
  brandMentioned: boolean;
  brandPosition: number | null;
  competitorsMentioned: string[];
  competitorPositions: Record<string, number>;
  outcome: "win" | "loss" | "partial" | "absent" | "error";
  sentiment: string;
  recommendationStrength: number;
} {
  const content = (response.content || response.fullResponse || "").toLowerCase();
  const brandLower = brand.toLowerCase();

  // Check brand presence
  const brandMentioned = content.includes(brandLower);
  const brandPosition = brandMentioned ? findBrandPosition(content, brandLower) : null;

  // Check competitor presence
  const competitorsMentioned: string[] = [];
  const competitorPositions: Record<string, number> = {};

  for (const competitor of competitors) {
    const competitorLower = competitor.toLowerCase();
    if (content.includes(competitorLower)) {
      competitorsMentioned.push(competitor);
      competitorPositions[competitor] = findBrandPosition(content, competitorLower);
    }
  }

  // Determine outcome
  let outcome: "win" | "loss" | "partial" | "absent" | "error";

  if (!brandMentioned && competitorsMentioned.length === 0) {
    outcome = "absent"; // Neither brand nor competitors mentioned
  } else if (brandMentioned && competitorsMentioned.length === 0) {
    outcome = "win"; // Only brand mentioned
  } else if (!brandMentioned && competitorsMentioned.length > 0) {
    outcome = "loss"; // Competitors mentioned, brand not
  } else if (brandMentioned && competitorsMentioned.length > 0) {
    // Both mentioned - check positions
    const brandBeatsCompetitors = competitorsMentioned.every(
      comp => brandPosition! < competitorPositions[comp]
    );
    outcome = brandBeatsCompetitors ? "win" : "partial";
  } else {
    outcome = "absent";
  }

  // Analyze sentiment toward brand (if mentioned)
  const sentiment = brandMentioned ? analyzeBrandSentiment(content, brandLower) : "neutral";

  // Calculate recommendation strength
  const recommendationStrength = brandMentioned
    ? calculateRecommendationStrength(content, brandLower)
    : 0;

  return {
    brandMentioned,
    brandPosition,
    competitorsMentioned,
    competitorPositions,
    outcome,
    sentiment,
    recommendationStrength
  };
}

/**
 * Find position of brand/competitor in response (1-indexed)
 */
function findBrandPosition(content: string, brandName: string): number {
  // Split into sentences/sections
  const sentences = content.split(/[.!?\n]+/);

  for (let i = 0; i < sentences.length; i++) {
    if (sentences[i].toLowerCase().includes(brandName)) {
      // Check if this is a list position (1., 2., etc.)
      const listMatch = sentences[i].match(/^(\d+)[\.\)]\s/);
      if (listMatch) {
        return parseInt(listMatch[1]);
      }

      // Otherwise, approximate by sentence order
      return i + 1;
    }
  }

  return 999; // Not found or very late
}

/**
 * Analyze sentiment toward brand in content
 */
function analyzeBrandSentiment(content: string, brandName: string): string {
  // Find sentences mentioning the brand
  const sentences = content.split(/[.!?\n]+/);
  const brandSentences = sentences.filter(s => s.toLowerCase().includes(brandName));

  if (brandSentences.length === 0) return "neutral";

  let positiveCount = 0;
  let negativeCount = 0;

  const positiveWords = [
    "best", "excellent", "great", "highly recommend", "top", "outstanding",
    "superior", "premium", "quality", "reliable", "trusted", "popular",
    "effective", "recommended", "worth", "value", "good"
  ];

  const negativeWords = [
    "however", "but", "expensive", "overpriced", "limited", "lacking",
    "concerns", "issues", "problems", "drawbacks", "not", "avoid"
  ];

  for (const sentence of brandSentences) {
    const sentenceLower = sentence.toLowerCase();

    for (const word of positiveWords) {
      if (sentenceLower.includes(word)) positiveCount++;
    }

    for (const word of negativeWords) {
      if (sentenceLower.includes(word)) negativeCount++;
    }
  }

  if (positiveCount > negativeCount * 1.5) return "positive";
  if (negativeCount > positiveCount * 1.5) return "negative";
  return "neutral";
}

/**
 * Calculate recommendation strength (0-100)
 */
function calculateRecommendationStrength(content: string, brandName: string): number {
  const sentences = content.split(/[.!?\n]+/);
  const brandSentences = sentences.filter(s => s.toLowerCase().includes(brandName));

  if (brandSentences.length === 0) return 0;

  let score = 0;

  // Strong recommendation signals (20 points each)
  const strongSignals = [
    "highly recommend",
    "best choice",
    "top pick",
    "excellent option",
    "definitely recommend"
  ];

  // Moderate recommendation signals (10 points each)
  const moderateSignals = [
    "recommend",
    "good choice",
    "great option",
    "worth considering",
    "solid pick"
  ];

  for (const sentence of brandSentences) {
    const sentenceLower = sentence.toLowerCase();

    for (const signal of strongSignals) {
      if (sentenceLower.includes(signal)) score += 20;
    }

    for (const signal of moderateSignals) {
      if (sentenceLower.includes(signal)) score += 10;
    }
  }

  return Math.min(100, score);
}

/**
 * Analyze all trigger results to identify patterns
 */
export function analyzeTriggers(
  results: TriggerResult[],
  brand: string,
  competitors: string[]
): TriggerAnalysis {
  // Calculate overall metrics
  const totalTests = results.length;
  const wins = results.filter(r => r.outcome === "win").length;
  const losses = results.filter(r => r.outcome === "loss").length;
  const partials = results.filter(r => r.outcome === "partial").length;
  const absent = results.filter(r => r.outcome === "absent").length;

  const winRate = totalTests > 0 ? (wins / totalTests) * 100 : 0;
  const lossRate = totalTests > 0 ? (losses / totalTests) * 100 : 0;

  // Identify loss triggers (modifiers where brand loses)
  const lossTriggers = identifyLossTriggers(results, brand);

  // Identify win triggers (modifiers where brand wins)
  const winTriggers = identifyWinTriggers(results, brand);

  // Analyze by category
  const byCategory = analyzeTriggersByCategory(results);

  // Analyze by LLM
  const byLLM = analyzeTriggersByLLM(results);

  // Identify dominant competitors
  const competitorDominance = analyzeCompetitorDominance(results, competitors);

  return {
    summary: {
      totalTests,
      wins,
      losses,
      partials,
      absent,
      winRate: Math.round(winRate * 10) / 10,
      lossRate: Math.round(lossRate * 10) / 10
    },
    lossTriggers,
    winTriggers,
    byCategory,
    byLLM,
    competitorDominance,
    recommendations: generateTriggerRecommendations(lossTriggers, winTriggers, byCategory)
  };
}

/**
 * Identify loss triggers (modifiers where competitors dominate)
 */
function identifyLossTriggers(results: TriggerResult[], brand: string): LossTrigger[] {
  const modifierGroups: Record<string, TriggerResult[]> = {};

  // Group results by modifier
  for (const result of results) {
    if (!modifierGroups[result.modifier]) {
      modifierGroups[result.modifier] = [];
    }
    modifierGroups[result.modifier].push(result);
  }

  const lossTriggers: LossTrigger[] = [];

  // Analyze each modifier
  for (const [modifier, modifierResults] of Object.entries(modifierGroups)) {
    const losses = modifierResults.filter(r => r.outcome === "loss").length;
    const total = modifierResults.length;
    const lossRate = total > 0 ? (losses / total) * 100 : 0;

    // Only flag as loss trigger if loss rate > 50%
    if (lossRate > 50 && losses >= 2) {
      const category = modifierResults[0].modifierCategory;
      const type = modifierResults[0].modifierType;

      // Find which competitors are winning
      const competitorWins: Record<string, number> = {};
      for (const result of modifierResults) {
        if (result.outcome === "loss") {
          for (const competitor of result.competitorsMentioned) {
            competitorWins[competitor] = (competitorWins[competitor] || 0) + 1;
          }
        }
      }

      const dominantCompetitors = Object.entries(competitorWins)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, count]) => ({
          name,
          winCount: count,
          winRate: (count / total) * 100
        }));

      // Calculate severity (how badly are we losing?)
      const severity = calculateTriggerSeverity(lossRate, losses, total);

      lossTriggers.push({
        modifier,
        category,
        type,
        lossRate: Math.round(lossRate * 10) / 10,
        lossCount: losses,
        totalTests: total,
        severity,
        dominantCompetitors,
        affectedLLMs: [...new Set(modifierResults.filter(r => r.outcome === "loss").map(r => r.llm))],
        exampleQueries: modifierResults
          .filter(r => r.outcome === "loss")
          .slice(0, 3)
          .map(r => r.query)
      });
    }
  }

  // Sort by severity (high to low)
  return lossTriggers.sort((a, b) => {
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    return severityOrder[b.severity] - severityOrder[a.severity];
  });
}

/**
 * Identify win triggers (modifiers where brand dominates)
 */
function identifyWinTriggers(results: TriggerResult[], brand: string): WinTrigger[] {
  const modifierGroups: Record<string, TriggerResult[]> = {};

  // Group results by modifier
  for (const result of results) {
    if (!modifierGroups[result.modifier]) {
      modifierGroups[result.modifier] = [];
    }
    modifierGroups[result.modifier].push(result);
  }

  const winTriggers: WinTrigger[] = [];

  // Analyze each modifier
  for (const [modifier, modifierResults] of Object.entries(modifierGroups)) {
    const wins = modifierResults.filter(r => r.outcome === "win").length;
    const total = modifierResults.length;
    const winRate = total > 0 ? (wins / total) * 100 : 0;

    // Only flag as win trigger if win rate > 70%
    if (winRate > 70 && wins >= 2) {
      const category = modifierResults[0].modifierCategory;
      const type = modifierResults[0].modifierType;

      // Calculate average position
      const positions = modifierResults
        .filter(r => r.outcome === "win" && r.brandPosition !== null)
        .map(r => r.brandPosition!);
      const averagePosition = positions.length > 0
        ? positions.reduce((sum, pos) => sum + pos, 0) / positions.length
        : null;

      // Calculate average recommendation strength
      const strengths = modifierResults
        .filter(r => r.outcome === "win")
        .map(r => r.recommendationStrength || 0);
      const averageStrength = strengths.length > 0
        ? strengths.reduce((sum, str) => sum + str, 0) / strengths.length
        : 0;

      // Calculate strength level
      const strength = calculateWinStrength(winRate, wins, total, averageStrength);

      winTriggers.push({
        modifier,
        category,
        type,
        winRate: Math.round(winRate * 10) / 10,
        winCount: wins,
        totalTests: total,
        strength,
        averagePosition: averagePosition ? Math.round(averagePosition * 10) / 10 : null,
        averageRecommendationStrength: Math.round(averageStrength),
        affectedLLMs: [...new Set(modifierResults.filter(r => r.outcome === "win").map(r => r.llm))],
        exampleQueries: modifierResults
          .filter(r => r.outcome === "win")
          .slice(0, 3)
          .map(r => r.query)
      });
    }
  }

  // Sort by strength (high to low)
  return winTriggers.sort((a, b) => {
    const strengthOrder = { dominant: 4, strong: 3, moderate: 2, weak: 1 };
    return strengthOrder[b.strength] - strengthOrder[a.strength];
  });
}

/**
 * Calculate trigger severity
 */
function calculateTriggerSeverity(
  lossRate: number,
  lossCount: number,
  totalTests: number
): "critical" | "high" | "medium" | "low" {
  if (lossRate >= 90 && lossCount >= 5) return "critical";
  if (lossRate >= 75 && lossCount >= 3) return "high";
  if (lossRate >= 60 && lossCount >= 2) return "medium";
  return "low";
}

/**
 * Calculate win strength
 */
function calculateWinStrength(
  winRate: number,
  winCount: number,
  totalTests: number,
  avgRecommendationStrength: number
): "dominant" | "strong" | "moderate" | "weak" {
  const score = (winRate * 0.5) + (avgRecommendationStrength * 0.5);

  if (score >= 85 && winCount >= 5) return "dominant";
  if (score >= 75 && winCount >= 3) return "strong";
  if (score >= 65 && winCount >= 2) return "moderate";
  return "weak";
}

/**
 * Analyze triggers by category
 */
function analyzeTriggersByCategory(results: TriggerResult[]): Record<string, {
  category: string;
  totalTests: number;
  wins: number;
  losses: number;
  winRate: number;
  lossRate: number;
}> {
  const categories: Record<string, TriggerResult[]> = {};

  // Group by category
  for (const result of results) {
    if (!categories[result.modifierCategory]) {
      categories[result.modifierCategory] = [];
    }
    categories[result.modifierCategory].push(result);
  }

  const analysis: Record<string, any> = {};

  for (const [categoryKey, categoryResults] of Object.entries(categories)) {
    const totalTests = categoryResults.length;
    const wins = categoryResults.filter(r => r.outcome === "win").length;
    const losses = categoryResults.filter(r => r.outcome === "loss").length;

    analysis[categoryKey] = {
      category: getModifierCategoryLabel(categoryKey),
      totalTests,
      wins,
      losses,
      winRate: totalTests > 0 ? Math.round((wins / totalTests) * 100 * 10) / 10 : 0,
      lossRate: totalTests > 0 ? Math.round((losses / totalTests) * 100 * 10) / 10 : 0
    };
  }

  return analysis;
}

/**
 * Analyze triggers by LLM
 */
function analyzeTriggersByLLM(results: TriggerResult[]): Record<string, {
  llm: string;
  totalTests: number;
  wins: number;
  losses: number;
  winRate: number;
  lossRate: number;
}> {
  const llms: Record<string, TriggerResult[]> = {};

  // Group by LLM
  for (const result of results) {
    if (!llms[result.llm]) {
      llms[result.llm] = [];
    }
    llms[result.llm].push(result);
  }

  const analysis: Record<string, any> = {};

  for (const [llm, llmResults] of Object.entries(llms)) {
    const totalTests = llmResults.length;
    const wins = llmResults.filter(r => r.outcome === "win").length;
    const losses = llmResults.filter(r => r.outcome === "loss").length;

    analysis[llm] = {
      llm,
      totalTests,
      wins,
      losses,
      winRate: totalTests > 0 ? Math.round((wins / totalTests) * 100 * 10) / 10 : 0,
      lossRate: totalTests > 0 ? Math.round((losses / totalTests) * 100 * 10) / 10 : 0
    };
  }

  return analysis;
}

/**
 * Analyze competitor dominance
 */
function analyzeCompetitorDominance(
  results: TriggerResult[],
  competitors: string[]
): Array<{
  competitor: string;
  appearances: number;
  wins: number;
  winRate: number;
  averagePosition: number;
  strongestCategories: string[];
}> {
  const competitorStats: Record<string, {
    appearances: number;
    wins: number;
    positions: number[];
    categoryWins: Record<string, number>;
  }> = {};

  // Initialize
  for (const competitor of competitors) {
    competitorStats[competitor] = {
      appearances: 0,
      wins: 0,
      positions: [],
      categoryWins: {}
    };
  }

  // Collect stats
  for (const result of results) {
    for (const competitor of result.competitorsMentioned) {
      if (competitorStats[competitor]) {
        competitorStats[competitor].appearances++;

        if (result.outcome === "loss") {
          competitorStats[competitor].wins++;

          const category = result.modifierCategory;
          competitorStats[competitor].categoryWins[category] =
            (competitorStats[competitor].categoryWins[category] || 0) + 1;
        }

        if (result.competitorPositions[competitor]) {
          competitorStats[competitor].positions.push(result.competitorPositions[competitor]);
        }
      }
    }
  }

  // Calculate final metrics
  const dominance = competitors.map(competitor => {
    const stats = competitorStats[competitor];
    const winRate = stats.appearances > 0 ? (stats.wins / stats.appearances) * 100 : 0;
    const averagePosition = stats.positions.length > 0
      ? stats.positions.reduce((sum, pos) => sum + pos, 0) / stats.positions.length
      : 999;

    const strongestCategories = Object.entries(stats.categoryWins)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category]) => getModifierCategoryLabel(category));

    return {
      competitor,
      appearances: stats.appearances,
      wins: stats.wins,
      winRate: Math.round(winRate * 10) / 10,
      averagePosition: Math.round(averagePosition * 10) / 10,
      strongestCategories
    };
  });

  // Sort by wins (descending)
  return dominance.sort((a, b) => b.wins - a.wins);
}

/**
 * Generate actionable recommendations
 */
function generateTriggerRecommendations(
  lossTriggers: LossTrigger[],
  winTriggers: WinTrigger[],
  byCategory: Record<string, any>
): string[] {
  const recommendations: string[] = [];

  // Critical loss triggers
  const criticalTriggers = lossTriggers.filter(t => t.severity === "critical");
  if (criticalTriggers.length > 0) {
    recommendations.push(
      `🚨 CRITICAL: ${criticalTriggers.length} modifiers cause consistent losses (${criticalTriggers.map(t => `"${t.modifier}"`).join(", ")})`
    );

    for (const trigger of criticalTriggers.slice(0, 3)) {
      const competitor = trigger.dominantCompetitors[0]?.name;
      recommendations.push(
        `  → Optimize content for "${trigger.modifier}" queries - ${competitor} currently dominates`
      );
    }
  }

  // Category-specific recommendations
  const weakCategories = Object.entries(byCategory)
    .filter(([_, stats]: [string, any]) => stats.lossRate > 60)
    .sort((a: any, b: any) => b[1].lossRate - a[1].lossRate)
    .slice(0, 3);

  if (weakCategories.length > 0) {
    recommendations.push(
      `📊 Weak performance in: ${weakCategories.map(([_, stats]: [string, any]) => stats.category).join(", ")}`
    );

    for (const [_, stats] of weakCategories) {
      recommendations.push(
        `  → Create content targeting ${stats.category.toLowerCase()} queries (${stats.lossRate}% loss rate)`
      );
    }
  }

  // Leverage win triggers
  if (winTriggers.length > 0) {
    const dominantTriggers = winTriggers.filter(t => t.strength === "dominant");
    if (dominantTriggers.length > 0) {
      recommendations.push(
        `✅ Leverage your strengths: ${dominantTriggers.map(t => `"${t.modifier}"`).join(", ")}`
      );
      recommendations.push(
        `  → Emphasize these modifiers in your marketing and content strategy`
      );
    }
  }

  // General recommendations
  if (lossTriggers.length > winTriggers.length * 2) {
    recommendations.push(
      "⚠️ Brand visibility is weak across most query types - comprehensive content strategy needed"
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      "✅ Strong performance across all tested modifiers - maintain current content strategy"
    );
  }

  return recommendations;
}
