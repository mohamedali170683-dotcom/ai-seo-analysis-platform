/**
 * Optimization Report Generator
 *
 * Generates comprehensive content optimization reports combining all analysis
 */

import type {
  OptimizationReport,
  ExecutiveSummary,
  Recommendation
} from "@/lib/types/contentOptimization";
import type { LLMResponse } from "@/lib/types/features";
import { analyzeContentGaps } from "./contentGapAnalyzer";
import { generateRecommendations, getQuickWinRecommendations } from "./recommendationEngine";
import { generateSchemaRecommendations } from "./schemaGenerator";

/**
 * Generate comprehensive optimization report
 */
export async function generateOptimizationReport(
  brandId: string,
  responses: LLMResponse[],
  options?: {
    competitorUrls?: string[];
    period?: { start: string; end: string };
    includeCompetitorAnalysis?: boolean;
  }
): Promise<OptimizationReport> {
  const period = options?.period || {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    end: new Date().toISOString()
  };

  // Analyze content gaps
  const contentGaps = await analyzeContentGaps(
    brandId,
    responses,
    options?.competitorUrls || []
  );

  // Generate recommendations
  const recommendations = await generateRecommendations(
    contentGaps.gaps,
    responses
  );

  // Generate citation opportunities
  const citationOpportunities = analyzeCitationOpportunities(responses);

  // Generate keyword suggestions
  const keywordSuggestions = generateKeywordSuggestions(responses);

  // Analyze question coverage
  const questionCoverage = analyzeQuestionCoverage(responses);

  // Generate schema recommendations
  const schemaRecommendations = await generatePageSchemaRecommendations(responses);

  // Analyze competitors (if requested)
  const competitorAnalysis = options?.includeCompetitorAnalysis
    ? await analyzeCompetitors(responses, options?.competitorUrls || [])
    : [];

  // Get priority actions
  const priorityActions = getPriorityActions(recommendations);

  // Generate executive summary
  const executiveSummary = generateExecutiveSummary(
    contentGaps,
    recommendations,
    priorityActions
  );

  return {
    id: generateReportId(),
    brandId,
    generatedAt: new Date().toISOString(),
    period,
    executiveSummary,
    contentGaps,
    recommendations,
    citationOpportunities,
    keywordSuggestions,
    questionCoverage,
    schemaRecommendations,
    competitorAnalysis,
    priorityActions
  };
}

/**
 * Generate executive summary
 */
function generateExecutiveSummary(
  contentGaps: any,
  recommendations: Recommendation[],
  priorityActions: Recommendation[]
): ExecutiveSummary {
  // Calculate overall health score (0-100)
  const overallHealthScore = calculateHealthScore(contentGaps, recommendations);

  // Count total opportunities
  const totalOpportunities = contentGaps.gaps.length + recommendations.length;

  // Estimate impact
  const estimatedImpact = {
    visibilityIncrease: recommendations.reduce(
      (sum, r) => sum + r.expectedImpact.visibilityIncrease,
      0
    ),
    trafficIncrease: recommendations.reduce(
      (sum, r) => sum + r.expectedImpact.estimatedTraffic,
      0
    ),
    timeframe: determineOverallTimeframe(recommendations)
  };

  // Get top priorities
  const topPriorities = priorityActions.slice(0, 5).map(p => p.title);

  // Get quick wins
  const quickWins = getQuickWinRecommendations(recommendations);

  return {
    overallHealthScore,
    totalOpportunities,
    estimatedImpact,
    topPriorities,
    quickWins
  };
}

/**
 * Calculate overall health score
 */
function calculateHealthScore(contentGaps: any, recommendations: Recommendation[]): number {
  let score = 100;

  // Deduct points for gaps
  score -= contentGaps.summary.bySeverity.critical * 15;
  score -= contentGaps.summary.bySeverity.high * 10;
  score -= contentGaps.summary.bySeverity.medium * 5;
  score -= contentGaps.summary.bySeverity.low * 2;

  // Cap at reasonable range
  return Math.max(0, Math.min(100, score));
}

/**
 * Determine overall timeframe
 */
function determineOverallTimeframe(recommendations: Recommendation[]): string {
  const criticalCount = recommendations.filter(r => r.priority === "critical").length;
  const highCount = recommendations.filter(r => r.priority === "high").length;

  if (criticalCount > 3) return "Immediate action required";
  if (criticalCount > 0 || highCount > 5) return "1-2 months";
  return "2-3 months";
}

/**
 * Analyze citation opportunities
 */
function analyzeCitationOpportunities(responses: LLMResponse[]): any[] {
  const opportunities: any[] = [];

  // Group responses by topic
  const topicGroups = groupResponsesByTopic(responses);

  for (const [topic, groupResponses] of Object.entries(topicGroups)) {
    const citationRate = calculateCitationRate(groupResponses as LLMResponse[]);

    if (citationRate < 0.5) {
      opportunities.push({
        id: generateOpportunityId(),
        topic,
        query: (groupResponses as LLMResponse[])[0].query,
        type: "fact_citation",
        currentState: {
          currentlyCited: citationRate > 0,
          citationRate: citationRate * 100,
          competitorCitations: 0,
          topCitedSources: []
        },
        opportunity: {
          potentialGain: (0.7 - citationRate) * 100,
          difficulty: "medium",
          requiredContent: `Create authoritative content about ${topic}`,
          contentType: "article",
          estimatedEffort: "2-4 weeks"
        },
        recommendations: [
          "Add unique data and research",
          "Include expert quotes",
          "Create comprehensive guides",
          "Keep content fresh and updated"
        ]
      });
    }
  }

  return opportunities.slice(0, 10);
}

/**
 * Group responses by topic
 */
function groupResponsesByTopic(responses: LLMResponse[]): Record<string, LLMResponse[]> {
  const groups: Record<string, LLMResponse[]> = {};

  for (const response of responses) {
    // Extract topic from query (simplified)
    const topic = response.query.split(" ").slice(0, 3).join(" ");

    if (!groups[topic]) {
      groups[topic] = [];
    }
    groups[topic].push(response);
  }

  return groups;
}

/**
 * Calculate citation rate
 */
function calculateCitationRate(responses: LLMResponse[]): number {
  const withCitations = responses.filter(r => r.citations && r.citations.length > 0);
  return responses.length > 0 ? withCitations.length / responses.length : 0;
}

/**
 * Generate keyword suggestions
 */
function generateKeywordSuggestions(responses: LLMResponse[]): any[] {
  const keywords: any[] = [];
  const keywordMap = new Map<string, number>();

  // Extract keywords from queries
  for (const response of responses) {
    const words = response.query.toLowerCase().split(" ");

    for (const word of words) {
      if (word.length > 3 && !isStopWord(word)) {
        keywordMap.set(word, (keywordMap.get(word) || 0) + 1);
      }
    }
  }

  // Convert to suggestions
  for (const [keyword, frequency] of keywordMap.entries()) {
    keywords.push({
      id: generateKeywordId(),
      keyword,
      topic: keyword,
      relevance: Math.min(100, frequency * 10),
      searchVolume: estimateSearchVolume(frequency),
      difficulty: estimateDifficulty(keyword),
      opportunity: calculateOpportunity(frequency),
      currentCoverage: "partial",
      recommendedAction: `Create content targeting "${keyword}"`,
      relatedKeywords: []
    });
  }

  return keywords
    .sort((a, b) => b.opportunity - a.opportunity)
    .slice(0, 20);
}

/**
 * Check if word is a stop word
 */
function isStopWord(word: string): boolean {
  const stopWords = ["what", "how", "why", "when", "where", "who", "the", "is", "are", "for", "and", "or"];
  return stopWords.includes(word);
}

/**
 * Estimate search volume
 */
function estimateSearchVolume(frequency: number): number {
  return frequency * 100;
}

/**
 * Estimate difficulty
 */
function estimateDifficulty(keyword: string): number {
  // Simplified - longer keywords tend to be easier
  return Math.max(30, 100 - keyword.length * 5);
}

/**
 * Calculate opportunity score
 */
function calculateOpportunity(frequency: number): number {
  return Math.min(100, frequency * 15);
}

/**
 * Analyze question coverage
 */
function analyzeQuestionCoverage(responses: LLMResponse[]): any[] {
  const coverage: any[] = [];

  const questions = responses.filter(r =>
    r.query.match(/^(what|how|why|when|where|who|which|can|should)/i)
  );

  for (const question of questions.slice(0, 20)) {
    const hasGoodAnswer = (question.content || question.fullResponse || "").length > 200;

    coverage.push({
      id: generateQuestionId(),
      question: question.query,
      category: categorizeQuestion(question.query),
      askedBy: [question.llm],
      currentAnswer: {
        hasAnswer: hasGoodAnswer,
        quality: hasGoodAnswer ? "good" : "poor",
        completeness: hasGoodAnswer ? 75 : 25,
        accuracy: 80,
        citationRate: question.citations ? 50 : 0
      },
      competitorAnswers: [],
      recommendation: {
        action: hasGoodAnswer ? "enhance_existing" : "create_new",
        suggestedFormat: "faq",
        keyPoints: ["Provide clear answer", "Include examples", "Add visuals"],
        targetLength: "300-500 words",
        schemaSuggestion: "FAQPage"
      }
    });
  }

  return coverage;
}

/**
 * Categorize question type
 */
function categorizeQuestion(question: string): string {
  const lower = question.toLowerCase();

  if (lower.startsWith("what")) return "what_is";
  if (lower.startsWith("how")) return "how_to";
  if (lower.startsWith("why")) return "why";
  if (lower.startsWith("when")) return "when";
  if (lower.startsWith("where")) return "where";
  if (lower.startsWith("who")) return "who";
  if (lower.includes(" vs ") || lower.includes(" versus ")) return "comparison";

  return "best_practices";
}

/**
 * Generate schema recommendations for pages
 */
async function generatePageSchemaRecommendations(responses: LLMResponse[]): Promise<any[]> {
  // Group by page/topic and recommend schema
  const recommendations: any[] = [];

  // Recommend FAQ schema if many questions
  const questionCount = responses.filter(r => r.query.match(/\?$/)).length;
  if (questionCount > 3) {
    recommendations.push({
      id: generateSchemaId(),
      pageUrl: "/faq",
      currentSchema: [],
      recommendedSchema: [{
        type: "FAQPage",
        reason: "You have many question-based queries",
        properties: [],
        example: {}
      }],
      priority: "high",
      impact: {
        richSnippetChance: 80,
        visibilityIncrease: 25,
        competitorsUsingIt: 60,
        aiPlatformSupport: ["ChatGPT", "Gemini"]
      },
      implementation: {
        difficulty: "easy",
        estimatedTime: "1-2 hours",
        codeSnippet: "",
        validationUrl: "https://search.google.com/test/rich-results",
        testingTips: []
      }
    });
  }

  return recommendations;
}

/**
 * Analyze competitors
 */
async function analyzeCompetitors(responses: LLMResponse[], competitorUrls: string[]): Promise<any[]> {
  // Simplified competitor analysis
  return competitorUrls.map(url => ({
    competitor: url,
    analyzedAt: new Date().toISOString(),
    topContent: [],
    contentStrategy: {
      focus: [],
      contentTypes: [],
      updateFrequency: "weekly",
      strengthAreas: [],
      weaknesses: []
    },
    gaps: ["Opportunity to create better content"],
    threats: ["Strong competitor in this space"]
  }));
}

/**
 * Get priority actions
 */
function getPriorityActions(recommendations: Recommendation[]): Recommendation[] {
  return recommendations
    .filter(r => r.priority === "critical" || r.priority === "high")
    .sort((a, b) => {
      const priorityOrder = { critical: 2, high: 1, medium: 0, low: 0 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.roi - a.roi;
    })
    .slice(0, 10);
}

/**
 * Format report as markdown
 */
export function formatReportAsMarkdown(report: OptimizationReport): string {
  const lines = [
    `# Content Optimization Report`,
    ``,
    `**Generated:** ${new Date(report.generatedAt).toLocaleString()}`,
    `**Period:** ${new Date(report.period.start).toLocaleDateString()} - ${new Date(report.period.end).toLocaleDateString()}`,
    ``,
    `## Executive Summary`,
    ``,
    `**Overall Health Score:** ${report.executiveSummary.overallHealthScore}/100`,
    `**Total Opportunities:** ${report.executiveSummary.totalOpportunities}`,
    ``,
    `### Estimated Impact`,
    `- Visibility Increase: +${report.executiveSummary.estimatedImpact.visibilityIncrease.toFixed(1)}%`,
    `- Traffic Increase: +${report.executiveSummary.estimatedImpact.trafficIncrease.toLocaleString()} monthly visitors`,
    `- Timeframe: ${report.executiveSummary.estimatedImpact.timeframe}`,
    ``,
    `### Top Priorities`,
    ``,
    ...report.executiveSummary.topPriorities.map((p, i) => `${i + 1}. ${p}`),
    ``,
    `### Quick Wins`,
    ``,
    ...report.executiveSummary.quickWins.slice(0, 3).map(qw =>
      `- **${qw.title}** (${qw.effort} effort, +${qw.expectedImpact.visibilityIncrease.toFixed(1)}% visibility)`
    ),
    ``,
    `## Content Gaps (${report.contentGaps.gaps.length})`,
    ``,
    ...report.contentGaps.gaps.slice(0, 5).map(gap =>
      `### ${gap.topic} [${gap.severity.toUpperCase()}]\n\n${gap.description}\n\n**Impact:** ${gap.impact.visibilityLoss.toFixed(1)}% visibility loss\n`
    ),
    ``,
    `## Top Recommendations (${report.priorityActions.length})`,
    ``,
    ...report.priorityActions.slice(0, 5).map((rec, i) =>
      `### ${i + 1}. ${rec.title}\n\n${rec.description}\n\n**Priority:** ${rec.priority.toUpperCase()} | **Effort:** ${rec.effort} | **ROI:** ${rec.roi}\n\n**Expected Impact:** +${rec.expectedImpact.visibilityIncrease.toFixed(1)}% visibility in ${rec.expectedImpact.timeframe}\n`
    ),
    ``
  ];

  return lines.join("\n");
}

/**
 * Format report as HTML
 */
export function formatReportAsHTML(report: OptimizationReport): string {
  // Similar to automation report HTML formatting
  return `<html><body><h1>Content Optimization Report</h1>...</body></html>`;
}

// ID generators

function generateReportId(): string {
  return `optreport_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateOpportunityId(): string {
  return `opp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateKeywordId(): string {
  return `kw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateQuestionId(): string {
  return `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateSchemaId(): string {
  return `schema_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
