import OpenAI from "openai";
import { AITestResult } from "./batch-ai-testing-service";

export interface AIInsight {
  category: "pattern" | "recommendation" | "gap" | "opportunity";
  priority: number;
  title: string;
  finding: string;
  dataEvidence: string;
  aiReasoning: string;
  actions: string[];
  expectedImpact: {
    mentionRate?: string;
    position?: string;
    citationRate?: string;
    recommendationType?: string;
  };
  effort: "low" | "medium" | "high";
  timeline: string;
  confidence: "high" | "medium" | "low";
  correlationScore?: number;
}

export class AIAnalysisEngine {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Analyze all test results and generate insights
   */
  async analyzeResults(
    brandName: string,
    allResults: {
      question: string;
      searchVolume: number;
      category: string;
      results: AITestResult[];
    }[],
    competitorData?: any[]
  ): Promise<AIInsight[]> {
    try {
      // Step 1: Aggregate statistics
      const stats = this.aggregateStatistics(allResults);

      // Step 2: Find patterns
      const patterns = await this.findPatterns(brandName, allResults, stats);

      // Step 3: Identify gaps
      const gaps = this.identifyGaps(allResults, stats, competitorData);

      // Step 4: Generate recommendations
      const recommendations = await this.generateRecommendations(
        brandName,
        patterns,
        gaps,
        stats
      );

      // Combine and prioritize
      const allInsights = [...patterns, ...gaps, ...recommendations];

      // Sort by priority and correlation score
      allInsights.sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return (b.correlationScore || 0) - (a.correlationScore || 0);
      });

      return allInsights;
    } catch (error) {
      console.error("Error in AI analysis:", error);
      throw new Error("Failed to analyze results");
    }
  }

  /**
   * Aggregate statistics across all test results
   */
  private aggregateStatistics(
    allResults: {
      question: string;
      searchVolume: number;
      category: string;
      results: AITestResult[];
    }[]
  ) {
    const totalTests = allResults.reduce(
      (sum, q) => sum + q.results.length,
      0
    );
    const totalMentions = allResults.reduce(
      (sum, q) => sum + q.results.filter((r) => r.brandMentioned).length,
      0
    );

    const overallMentionRate = (totalMentions / totalTests) * 100;

    // By category
    const byCategory: Record<string, any> = {};
    allResults.forEach((q) => {
      if (!byCategory[q.category]) {
        byCategory[q.category] = {
          totalTests: 0,
          mentions: 0,
          positions: [],
          sentiments: [],
        };
      }

      byCategory[q.category].totalTests += q.results.length;
      byCategory[q.category].mentions += q.results.filter(
        (r) => r.brandMentioned
      ).length;

      q.results.forEach((r) => {
        if (r.position) byCategory[q.category].positions.push(r.position);
        if (r.sentiment) byCategory[q.category].sentiments.push(r.sentiment);
      });
    });

    // Calculate category mention rates
    Object.keys(byCategory).forEach((cat) => {
      byCategory[cat].mentionRate =
        (byCategory[cat].mentions / byCategory[cat].totalTests) * 100;

      byCategory[cat].avgPosition =
        byCategory[cat].positions.length > 0
          ? byCategory[cat].positions.reduce((a: number, b: number) => a + b, 0) /
            byCategory[cat].positions.length
          : null;
    });

    // By platform
    const byPlatform: Record<string, any> = {};
    allResults.forEach((q) => {
      q.results.forEach((r) => {
        if (!byPlatform[r.platform]) {
          byPlatform[r.platform] = { totalTests: 0, mentions: 0, positions: [] };
        }

        byPlatform[r.platform].totalTests++;
        if (r.brandMentioned) byPlatform[r.platform].mentions++;
        if (r.position) byPlatform[r.platform].positions.push(r.position);
      });
    });

    Object.keys(byPlatform).forEach((platform) => {
      byPlatform[platform].mentionRate =
        (byPlatform[platform].mentions / byPlatform[platform].totalTests) * 100;

      byPlatform[platform].avgPosition =
        byPlatform[platform].positions.length > 0
          ? byPlatform[platform].positions.reduce((a: number, b: number) => a + b, 0) /
            byPlatform[platform].positions.length
          : null;
    });

    return {
      overall: {
        totalTests,
        totalMentions,
        mentionRate: overallMentionRate,
      },
      byCategory,
      byPlatform,
    };
  }

  /**
   * Find patterns using GPT-4 analysis
   */
  private async findPatterns(
    brandName: string,
    allResults: any[],
    stats: any
  ): Promise<AIInsight[]> {
    const patterns: AIInsight[] = [];

    // Pattern 1: Find strong categories
    const strongCategories = Object.entries(stats.byCategory)
      .filter(([_, data]: [string, any]) => data.mentionRate > stats.overall.mentionRate + 10)
      .sort((a: any, b: any) => b[1].mentionRate - a[1].mentionRate);

    if (strongCategories.length > 0) {
      const [topCategory, data]: [string, any] = strongCategories[0];

      patterns.push({
        category: "pattern",
        priority: 1,
        title: `Strong Performance in "${topCategory}" Queries`,
        finding: `${brandName} has ${data.mentionRate.toFixed(
          1
        )}% mention rate in "${topCategory}" queries, which is ${(
          data.mentionRate - stats.overall.mentionRate
        ).toFixed(1)}% above average.`,
        dataEvidence: `Tested ${data.totalTests} queries. Brand mentioned ${
          data.mentions
        } times. Average position: ${
          data.avgPosition ? data.avgPosition.toFixed(1) : "N/A"
        }.`,
        aiReasoning: `AI models strongly associate ${brandName} with ${topCategory}-related queries. This indicates a clear neural pathway in the training data connecting ${brandName} to ${topCategory} contexts.`,
        actions: [
          `Amplify ${topCategory} content creation (2-3x current volume)`,
          `Create "ultimate ${topCategory} guide" featuring ${brandName}`,
          `Add structured data highlighting ${topCategory} attributes`,
          `Publish case studies demonstrating ${topCategory} excellence`,
        ],
        expectedImpact: {
          mentionRate: `Maintain ${data.mentionRate.toFixed(1)}% (prevent erosion)`,
          position: `Improve from ${
            data.avgPosition ? data.avgPosition.toFixed(1) : "N/A"
          } to top 1-2`,
          citationRate: "+15-20%",
        },
        effort: "medium",
        timeline: "4-6 weeks",
        confidence: "high",
        correlationScore: 95,
      });
    }

    // Pattern 2: Find weak categories (gaps)
    const weakCategories = Object.entries(stats.byCategory)
      .filter(([_, data]: [string, any]) => data.mentionRate < stats.overall.mentionRate - 15)
      .sort((a: any, b: any) => a[1].mentionRate - b[1].mentionRate);

    if (weakCategories.length > 0) {
      const [weakCategory, data]: [string, any] = weakCategories[0];

      patterns.push({
        category: "gap",
        priority: 2,
        title: `Visibility Gap in "${weakCategory}" Context`,
        finding: `Only ${data.mentionRate.toFixed(
          1
        )}% mention rate in "${weakCategory}" queries (vs ${stats.overall.mentionRate.toFixed(
          1
        )}% average). Gap of ${(stats.overall.mentionRate - data.mentionRate).toFixed(
          1
        )}%.`,
        dataEvidence: `Tested ${data.totalTests} ${weakCategory} queries. Brand mentioned only ${data.mentions} times.`,
        aiReasoning: `AI models lack strong associations between ${brandName} and ${weakCategory}. This suggests insufficient training data or weak signals in existing content.`,
        actions: [
          `Create "${brandName} ${weakCategory} advantage" content series`,
          `Publish data/research on ${weakCategory} performance`,
          `Add ${weakCategory} messaging to product pages`,
          `Partner with ${weakCategory}-focused influencers/publications`,
        ],
        expectedImpact: {
          mentionRate: `${data.mentionRate.toFixed(1)}% → ${(
            data.mentionRate + 25
          ).toFixed(1)}% (+25%)`,
          position: "Enter top 5 recommendations",
        },
        effort: "high",
        timeline: "8-12 weeks",
        confidence: "medium",
        correlationScore: 75,
      });
    }

    return patterns;
  }

  /**
   * Identify gaps (areas for improvement)
   */
  private identifyGaps(allResults: any[], stats: any, competitorData?: any[]): AIInsight[] {
    const gaps: AIInsight[] = [];

    // Platform gaps
    if (stats.byPlatform.chatgpt && stats.byPlatform.gemini) {
      const diff = Math.abs(
        stats.byPlatform.chatgpt.mentionRate - stats.byPlatform.gemini.mentionRate
      );

      if (diff > 15) {
        const weaker =
          stats.byPlatform.chatgpt.mentionRate < stats.byPlatform.gemini.mentionRate
            ? "ChatGPT"
            : "Gemini";
        const stronger =
          weaker === "ChatGPT" ? "Gemini" : "ChatGPT";

        gaps.push({
          category: "gap",
          priority: 3,
          title: `${weaker} Visibility Lagging Behind ${stronger}`,
          finding: `${weaker} mention rate is ${diff.toFixed(
            1
          )}% lower than ${stronger}. Platform-specific optimization needed.`,
          dataEvidence: `ChatGPT: ${stats.byPlatform.chatgpt.mentionRate.toFixed(
            1
          )}%, Gemini: ${stats.byPlatform.gemini.mentionRate.toFixed(1)}%`,
          aiReasoning: `Different AI models have different training data and architectures. The gap suggests ${weaker}'s training data has weaker signals about your brand.`,
          actions: [
            `Analyze ${stronger} responses to identify what content it references`,
            `Create content specifically optimized for ${weaker}'s knowledge base`,
            `Ensure recent news/updates are indexed where ${weaker} sources data`,
          ],
          expectedImpact: {
            mentionRate: `Close the ${diff.toFixed(1)}% gap by 50-70%`,
          },
          effort: "medium",
          timeline: "6-8 weeks",
          confidence: "medium",
          correlationScore: 70,
        });
      }
    }

    return gaps;
  }

  /**
   * Generate strategic recommendations using GPT-4
   */
  private async generateRecommendations(
    brandName: string,
    patterns: AIInsight[],
    gaps: AIInsight[],
    stats: any
  ): Promise<AIInsight[]> {
    try {
      const prompt = `You are an AI visibility optimization strategist analyzing how ChatGPT and Gemini mention brands.

Brand: ${brandName}

Current Performance:
- Overall mention rate: ${stats.overall.mentionRate.toFixed(1)}%
- Total tests: ${stats.overall.totalTests}
- Total mentions: ${stats.overall.totalMentions}

Category Performance:
${Object.entries(stats.byCategory)
  .map(([cat, data]: [string, any]) => `- ${cat}: ${data.mentionRate.toFixed(1)}% mention rate`)
  .join("\n")}

Patterns Found: ${patterns.length}
Gaps Identified: ${gaps.length}

Task: Generate 1-2 HIGH-PRIORITY strategic recommendations to increase AI visibility (mentions, citations, better positions, more recommendations).

Focus on:
1. PROVEN CORRELATIONS from the data
2. Increasing AI visibility metrics specifically
3. Actionable content/SEO strategies

Format as JSON array:
[
  {
    "title": "Short recommendation title",
    "finding": "What the data shows",
    "aiReasoning": "Why this works for AI visibility (cite neural associations, training data patterns)",
    "actions": ["action 1", "action 2", "action 3"],
    "correlationScore": 0-100
  }
]

Return ONLY the JSON array.`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 1500,
      });

      const response = completion.choices[0]?.message?.content || "[]";
      const jsonMatch = response.match(/\[[\s\S]*\]/);

      if (jsonMatch) {
        const recs = JSON.parse(jsonMatch[0]);

        return recs.map((rec: any, index: number) => ({
          category: "recommendation",
          priority: 2 + index,
          title: rec.title,
          finding: rec.finding,
          dataEvidence: `Based on analysis of ${stats.overall.totalTests} AI queries`,
          aiReasoning: rec.aiReasoning,
          actions: rec.actions,
          expectedImpact: {
            mentionRate: "+10-15%",
            position: "Improve by 0.5-1.0",
            citationRate: "+15-20%",
          },
          effort: "medium",
          timeline: "6-8 weeks",
          confidence: "high",
          correlationScore: rec.correlationScore || 80,
        }));
      }

      return [];
    } catch (error) {
      console.error("Error generating recommendations:", error);
      return [];
    }
  }
}
