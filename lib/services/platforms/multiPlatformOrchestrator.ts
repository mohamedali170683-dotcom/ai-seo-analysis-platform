/**
 * Multi-Platform Orchestrator
 *
 * Coordinates queries across multiple AI platforms and compares results
 */

import type {
  PlatformType,
  PlatformConfig,
  PlatformQuery,
  PlatformQueryResult,
  MultiPlatformScan,
  MultiPlatformSummary,
  PlatformComparison,
  PlatformComparisonData
} from "@/lib/types/platforms";
import { queryClaude } from "./claudeAdapter";
import { queryGoogleAIOverviews } from "./googleAIOverviewsAdapter";

/**
 * Execute multi-platform scan
 */
export async function executeMultiPlatformScan(
  query: string,
  platforms: PlatformConfig[],
  brand?: string
): Promise<MultiPlatformScan> {
  const scanId = generateScanId();
  const startTime = new Date();

  const results: PlatformQueryResult[] = [];

  // Query each platform
  for (const platformConfig of platforms) {
    if (!platformConfig.enabled) continue;

    try {
      const result = await queryPlatform(query, platformConfig, brand);
      results.push(result);
    } catch (error) {
      console.error(`Failed to query ${platformConfig.type}:`, error);
      // Add error result
      results.push({
        platform: platformConfig.type,
        query,
        response: createEmptyResponse(query, platformConfig.type),
        executedAt: new Date().toISOString(),
        duration: 0,
        error: error instanceof Error ? error.message : String(error)
      });
    }

    // Small delay between platform queries
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  const completedTime = new Date();
  const summary = calculateMultiPlatformSummary(results, brand);

  return {
    id: scanId,
    query,
    platforms: platforms.map(p => p.type),
    results,
    startedAt: startTime.toISOString(),
    completedAt: completedTime.toISOString(),
    status: determineStatus(results),
    summary
  };
}

/**
 * Query a single platform
 */
async function queryPlatform(
  query: string,
  config: PlatformConfig,
  brand?: string
): Promise<PlatformQueryResult> {
  switch (config.type) {
    case "claude":
      return await queryClaude(query, config as any, brand);

    case "google_ai_overviews":
      return await queryGoogleAIOverviews(query, config as any, brand);

    case "chatgpt":
      // Would implement ChatGPT adapter
      return createPlaceholderResult(query, "chatgpt");

    case "gemini":
      // Would implement Gemini adapter
      return createPlaceholderResult(query, "gemini");

    case "copilot":
      // Would implement Copilot adapter
      return createPlaceholderResult(query, "copilot");

    case "perplexity":
      // Would implement Perplexity adapter
      return createPlaceholderResult(query, "perplexity");

    default:
      throw new Error(`Unsupported platform: ${config.type}`);
  }
}

/**
 * Create empty response for platform
 */
function createEmptyResponse(query: string, platform: PlatformType): any {
  return {
    llm: platform,
    query,
    content: "",
    fullResponse: "",
    brandMentioned: false,
    citations: [],
    sentiment: "neutral",
    timestamp: new Date().toISOString()
  };
}

/**
 * Create placeholder result (for platforms not yet implemented)
 */
function createPlaceholderResult(query: string, platform: PlatformType): PlatformQueryResult {
  return {
    platform,
    query,
    response: createEmptyResponse(query, platform),
    executedAt: new Date().toISOString(),
    duration: 0,
    error: "Platform adapter not yet implemented"
  };
}

/**
 * Calculate multi-platform summary
 */
function calculateMultiPlatformSummary(
  results: PlatformQueryResult[],
  brand?: string
): MultiPlatformSummary {
  const totalPlatforms = results.length;
  const successfulQueries = results.filter(r => !r.error).length;
  const failedQueries = results.filter(r => r.error).length;

  const averageResponseTime = results.reduce((sum, r) => sum + r.duration, 0) / totalPlatforms;
  const totalCost = results.reduce((sum, r) => sum + (r.cost || 0), 0);

  // Brand mention analysis
  let brandMentions = 0;
  let citations = 0;
  let totalSentiment = 0;
  let sentimentCount = 0;

  for (const result of results) {
    if (result.response.brandMentioned) {
      brandMentions++;
    }

    if (result.response.citations && result.response.citations.length > 0) {
      citations++;
    }

    if (result.response.sentiment) {
      const sentimentValue = {
        positive: 100,
        neutral: 0,
        negative: -100
      }[result.response.sentiment];

      totalSentiment += sentimentValue;
      sentimentCount++;
    }
  }

  const brandMentionRate = totalPlatforms > 0 ? (brandMentions / totalPlatforms) * 100 : 0;
  const citationRate = totalPlatforms > 0 ? (citations / totalPlatforms) * 100 : 0;
  const averageSentiment = sentimentCount > 0 ? totalSentiment / sentimentCount : 0;

  return {
    totalPlatforms,
    successfulQueries,
    failedQueries,
    averageResponseTime,
    totalCost,
    brandMentionRate,
    citationRate,
    averageSentiment
  };
}

/**
 * Determine scan status
 */
function determineStatus(results: PlatformQueryResult[]): "running" | "completed" | "partial" | "failed" {
  const total = results.length;
  const errors = results.filter(r => r.error).length;

  if (errors === 0) return "completed";
  if (errors === total) return "failed";
  return "partial";
}

/**
 * Compare platform results
 */
export function comparePlatformResults(
  scan: MultiPlatformScan,
  brand: string
): PlatformComparison {
  const platformData: PlatformComparisonData[] = [];

  for (const result of scan.results) {
    const response = result.response;

    platformData.push({
      platform: result.platform,
      brandMentioned: response.brandMentioned || false,
      cited: (response.citations?.length || 0) > 0,
      position: extractPosition(response),
      sentiment: response.sentiment || "neutral",
      responseQuality: calculateResponseQuality(response),
      citationCount: response.citations?.length || 0,
      competitorMentions: extractCompetitorMentions(response)
    });
  }

  // Determine winner (platform with best performance)
  const winner = determineWinner(platformData);

  // Generate insights
  const insights = generateInsights(platformData, brand);

  return {
    query: scan.query,
    platforms: platformData,
    winner,
    insights
  };
}

/**
 * Extract position from response
 */
function extractPosition(response: any): number | undefined {
  // For Google AI Overviews, check source position
  if (response.overview?.sources) {
    for (let i = 0; i < response.overview.sources.length; i++) {
      return i + 1; // Return first matching position
    }
  }

  return undefined;
}

/**
 * Calculate response quality
 */
function calculateResponseQuality(response: any): number {
  let score = 50; // Base score

  // Quality factors
  if (response.content && response.content.length > 200) score += 20;
  if (response.citations && response.citations.length > 0) score += 15;
  if (response.citations && response.citations.length >= 3) score += 10;
  if (response.sentiment === "positive") score += 15;
  if (response.brandMentioned) score += 20;

  return Math.min(100, score);
}

/**
 * Extract competitor mentions
 */
function extractCompetitorMentions(response: any): string[] {
  // Would implement competitor detection logic
  // For now, return empty array
  return [];
}

/**
 * Determine winner platform
 */
function determineWinner(platformData: PlatformComparisonData[]): PlatformType {
  let bestScore = -1;
  let winner: PlatformType = "chatgpt";

  for (const data of platformData) {
    let score = 0;

    if (data.brandMentioned) score += 50;
    if (data.cited) score += 30;
    if (data.position && data.position <= 3) score += 20;
    if (data.sentiment === "positive") score += 20;
    score += data.citationCount * 5;

    if (score > bestScore) {
      bestScore = score;
      winner = data.platform;
    }
  }

  return winner;
}

/**
 * Generate insights from comparison
 */
function generateInsights(platformData: PlatformComparisonData[], brand: string): string[] {
  const insights: string[] = [];

  // Count platforms with brand mentions
  const mentionCount = platformData.filter(p => p.brandMentioned).length;
  const total = platformData.length;

  insights.push(`Brand mentioned on ${mentionCount}/${total} platforms (${((mentionCount / total) * 100).toFixed(1)}%)`);

  // Citation analysis
  const citedCount = platformData.filter(p => p.cited).length;
  if (citedCount > 0) {
    insights.push(`Cited as source on ${citedCount}/${total} platforms`);
  } else {
    insights.push(`⚠️ Not cited as source on any platform - opportunity for improvement`);
  }

  // Sentiment analysis
  const positiveCount = platformData.filter(p => p.sentiment === "positive").length;
  const negativeCount = platformData.filter(p => p.sentiment === "negative").length;

  if (positiveCount > negativeCount) {
    insights.push(`✓ Positive sentiment on ${positiveCount} platforms`);
  } else if (negativeCount > 0) {
    insights.push(`⚠️ Negative sentiment detected on ${negativeCount} platforms - requires attention`);
  }

  // Best performing platform
  const bestPlatform = platformData.reduce((best, current) => {
    const bestScore = (best.cited ? 1 : 0) + (best.brandMentioned ? 1 : 0);
    const currentScore = (current.cited ? 1 : 0) + (current.brandMentioned ? 1 : 0);
    return currentScore > bestScore ? current : best;
  });

  insights.push(`Best performance on ${bestPlatform.platform}`);

  return insights;
}

/**
 * Get platform coverage report
 */
export function getPlatformCoverageReport(
  scans: MultiPlatformScan[],
  brand: string
): {
  byPlatform: Record<PlatformType, {
    totalQueries: number;
    mentions: number;
    citations: number;
    averageSentiment: number;
    mentionRate: number;
    citationRate: number;
  }>;
  overall: {
    totalQueries: number;
    platformsCovered: number;
    averageMentionRate: number;
    averageCitationRate: number;
    bestPlatform: PlatformType;
    worstPlatform: PlatformType;
  };
} {
  const byPlatform: Record<string, any> = {};

  // Aggregate by platform
  for (const scan of scans) {
    for (const result of scan.results) {
      if (!byPlatform[result.platform]) {
        byPlatform[result.platform] = {
          totalQueries: 0,
          mentions: 0,
          citations: 0,
          totalSentiment: 0,
          sentimentCount: 0
        };
      }

      const platformStats = byPlatform[result.platform];
      platformStats.totalQueries++;

      if (result.response.brandMentioned) platformStats.mentions++;
      if (result.response.citations?.length > 0) platformStats.citations++;

      if (result.response.sentiment) {
        const sentimentValue = {
          positive: 100,
          neutral: 0,
          negative: -100
        }[result.response.sentiment];

        platformStats.totalSentiment += sentimentValue;
        platformStats.sentimentCount++;
      }
    }
  }

  // Calculate rates
  for (const platform in byPlatform) {
    const stats = byPlatform[platform];
    stats.mentionRate = (stats.mentions / stats.totalQueries) * 100;
    stats.citationRate = (stats.citations / stats.totalQueries) * 100;
    stats.averageSentiment = stats.sentimentCount > 0
      ? stats.totalSentiment / stats.sentimentCount
      : 0;
  }

  // Calculate overall stats
  const platforms = Object.keys(byPlatform);
  const totalQueries = scans.length;
  const platformsCovered = platforms.length;

  const averageMentionRate = platforms.reduce(
    (sum, p) => sum + byPlatform[p].mentionRate,
    0
  ) / platforms.length;

  const averageCitationRate = platforms.reduce(
    (sum, p) => sum + byPlatform[p].citationRate,
    0
  ) / platforms.length;

  // Find best and worst platforms
  let bestPlatform = platforms[0] as PlatformType;
  let worstPlatform = platforms[0] as PlatformType;
  let bestScore = 0;
  let worstScore = 100;

  for (const platform of platforms) {
    const score = (byPlatform[platform].mentionRate + byPlatform[platform].citationRate) / 2;
    if (score > bestScore) {
      bestScore = score;
      bestPlatform = platform as PlatformType;
    }
    if (score < worstScore) {
      worstScore = score;
      worstPlatform = platform as PlatformType;
    }
  }

  return {
    byPlatform: byPlatform as any,
    overall: {
      totalQueries,
      platformsCovered,
      averageMentionRate,
      averageCitationRate,
      bestPlatform,
      worstPlatform
    }
  };
}

/**
 * Generate scan ID
 */
function generateScanId(): string {
  return `mpscan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
