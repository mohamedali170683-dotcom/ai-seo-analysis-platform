/**
 * Content Gap Analyzer
 *
 * Identifies missing content opportunities by analyzing LLM responses and competitor coverage
 */

import type {
  ContentGapAnalysis,
  ContentGap,
  GapType,
  GapImpact,
  CompetitorCoverage,
  GapSummary
} from "@/lib/types/contentOptimization";
import type { LLMResponse } from "@/lib/types/features";

/**
 * Analyze content gaps from LLM responses
 */
export async function analyzeContentGaps(
  brandId: string,
  responses: LLMResponse[],
  competitorUrls: string[]
): Promise<ContentGapAnalysis> {
  const gaps: ContentGap[] = [];

  // Detect missing topics
  gaps.push(...detectMissingTopics(responses, competitorUrls));

  // Detect insufficient depth
  gaps.push(...detectInsufficientDepth(responses, competitorUrls));

  // Detect missing questions
  gaps.push(...detectMissingQuestions(responses, competitorUrls));

  // Detect weak authority signals
  gaps.push(...detectWeakAuthority(responses, competitorUrls));

  // Detect missing schema markup
  gaps.push(...detectMissingSchema(responses, competitorUrls));

  // Detect poor citation-worthiness
  gaps.push(...detectPoorCitations(responses, competitorUrls));

  // Sort by severity and impact
  gaps.sort((a, b) => {
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
    if (severityDiff !== 0) return severityDiff;
    return b.impact.visibilityLoss - a.impact.visibilityLoss;
  });

  const summary = calculateGapSummary(gaps);
  const recommendations = generateGapRecommendations(gaps);

  return {
    id: generateAnalysisId(),
    brandId,
    analyzedAt: new Date().toISOString(),
    gaps,
    summary,
    recommendations
  };
}

/**
 * Detect missing topics where competitors have content but you don't
 */
function detectMissingTopics(
  responses: LLMResponse[],
  competitorUrls: string[]
): ContentGap[] {
  const gaps: ContentGap[] = [];
  const topicCoverage = analyzeTopicCoverage(responses);

  for (const [topic, coverage] of Object.entries(topicCoverage)) {
    if (coverage.yourCoverage === 0 && coverage.competitorCoverage > 0.5) {
      const gap: ContentGap = {
        id: generateGapId(),
        type: "missing_topic",
        severity: determineSeverity(coverage.competitorCoverage, coverage.queriesAffected),
        topic,
        description: `No content found for "${topic}" while ${coverage.competitorsCount} competitors have coverage`,
        impact: {
          visibilityLoss: coverage.competitorCoverage * 100,
          opportunityQueries: coverage.queries,
          competitorAdvantage: coverage.competitors,
          estimatedTraffic: estimateTrafficOpportunity(coverage.queries.length, coverage.competitorCoverage)
        },
        competitors: coverage.competitorDetails,
        suggestedActions: [
          `Create comprehensive content about ${topic}`,
          `Target queries: ${coverage.queries.slice(0, 3).join(", ")}`,
          `Study top competitor: ${coverage.topCompetitor}`,
          "Include FAQ section for common questions",
          "Add relevant schema markup"
        ]
      };
      gaps.push(gap);
    }
  }

  return gaps;
}

/**
 * Detect topics with insufficient depth
 */
function detectInsufficientDepth(
  responses: LLMResponse[],
  competitorUrls: string[]
): ContentGap[] {
  const gaps: ContentGap[] = [];
  const topicCoverage = analyzeTopicCoverage(responses);

  for (const [topic, coverage] of Object.entries(topicCoverage)) {
    if (coverage.yourCoverage > 0 && coverage.yourCoverage < coverage.competitorCoverage * 0.5) {
      const gap: ContentGap = {
        id: generateGapId(),
        type: "insufficient_depth",
        severity: "medium",
        topic,
        description: `Content exists but is less comprehensive than competitors (${(coverage.yourCoverage * 100).toFixed(0)}% vs ${(coverage.competitorCoverage * 100).toFixed(0)}%)`,
        impact: {
          visibilityLoss: (coverage.competitorCoverage - coverage.yourCoverage) * 100,
          opportunityQueries: coverage.queries.filter((_: string, i: number) => i % 2 === 0), // Half the queries
          competitorAdvantage: coverage.competitors.slice(0, 2),
          estimatedTraffic: estimateTrafficOpportunity(coverage.queries.length / 2, coverage.competitorCoverage - coverage.yourCoverage)
        },
        competitors: coverage.competitorDetails,
        suggestedActions: [
          `Expand existing content about ${topic}`,
          "Add more detailed explanations and examples",
          "Include expert quotes and data",
          "Create supporting content (FAQs, guides)",
          "Update with latest information"
        ]
      };
      gaps.push(gap);
    }
  }

  return gaps;
}

/**
 * Detect missing questions
 */
function detectMissingQuestions(
  responses: LLMResponse[],
  competitorUrls: string[]
): ContentGap[] {
  const gaps: ContentGap[] = [];
  const questions = extractQuestions(responses);

  for (const question of questions) {
    if (!question.yourAnswer && question.competitorAnswers > 0) {
      const gap: ContentGap = {
        id: generateGapId(),
        type: "missing_question",
        severity: question.frequency > 5 ? "high" : "medium",
        topic: question.topic,
        description: `Question "${question.text}" is unanswered while ${question.competitorAnswers} competitors provide answers`,
        impact: {
          visibilityLoss: question.frequency * 5,
          opportunityQueries: [question.text],
          competitorAdvantage: question.competitorsAnswering,
          estimatedTraffic: estimateTrafficOpportunity(1, question.frequency / 10)
        },
        competitors: question.competitorDetails,
        suggestedActions: [
          `Create content answering: "${question.text}"`,
          "Use FAQ schema markup",
          "Provide clear, concise answer",
          "Include examples and visuals",
          "Link to related content"
        ]
      };
      gaps.push(gap);
    }
  }

  return gaps;
}

/**
 * Detect weak authority signals
 */
function detectWeakAuthority(
  responses: LLMResponse[],
  competitorUrls: string[]
): ContentGap[] {
  const gaps: ContentGap[] = [];

  // Check for lack of expert quotes, data, case studies, etc.
  const authoritySignals = analyzeAuthoritySignals(responses);

  if (authoritySignals.expertQuotes < authoritySignals.competitorAverage * 0.5) {
    gaps.push({
      id: generateGapId(),
      type: "weak_authority",
      severity: "medium",
      topic: "Expert Authority",
      description: "Content lacks expert quotes and authority signals compared to competitors",
      impact: {
        visibilityLoss: 15,
        opportunityQueries: [],
        competitorAdvantage: [],
        estimatedTraffic: 0
      },
      competitors: [],
      suggestedActions: [
        "Add expert quotes and interviews",
        "Cite authoritative sources and studies",
        "Include data and statistics",
        "Feature case studies and examples",
        "Build author credibility (bio, credentials)"
      ]
    });
  }

  return gaps;
}

/**
 * Detect missing schema markup
 */
function detectMissingSchema(
  responses: LLMResponse[],
  competitorUrls: string[]
): ContentGap[] {
  const gaps: ContentGap[] = [];

  // Check for schema opportunities
  const schemaOpportunities = analyzeSchemaOpportunities(responses);

  for (const opportunity of schemaOpportunities) {
    if (!opportunity.implemented && opportunity.competitorUsage > 0.3) {
      gaps.push({
        id: generateGapId(),
        type: "no_schema_markup",
        severity: "medium",
        topic: `${opportunity.schemaType} Schema`,
        description: `Missing ${opportunity.schemaType} schema while ${(opportunity.competitorUsage * 100).toFixed(0)}% of competitors use it`,
        impact: {
          visibilityLoss: opportunity.competitorUsage * 20,
          opportunityQueries: opportunity.relevantQueries,
          competitorAdvantage: opportunity.competitorsUsing,
          estimatedTraffic: estimateTrafficOpportunity(opportunity.relevantQueries.length, opportunity.competitorUsage)
        },
        competitors: [],
        suggestedActions: [
          `Implement ${opportunity.schemaType} schema markup`,
          "Validate with Google's Rich Results Test",
          "Test for rich snippet eligibility",
          "Monitor LLM response changes"
        ]
      });
    }
  }

  return gaps;
}

/**
 * Detect poor citation-worthiness
 */
function detectPoorCitations(
  responses: LLMResponse[],
  competitorUrls: string[]
): ContentGap[] {
  const gaps: ContentGap[] = [];

  const citationAnalysis = analyzeCitationWorthiness(responses);

  if (citationAnalysis.citationRate < citationAnalysis.competitorAverage * 0.5) {
    gaps.push({
      id: generateGapId(),
      type: "poor_citation_worthiness",
      severity: "high",
      topic: "Citation Rate",
      description: `Content is cited ${(citationAnalysis.citationRate * 100).toFixed(1)}% of the time vs ${(citationAnalysis.competitorAverage * 100).toFixed(1)}% for competitors`,
      impact: {
        visibilityLoss: (citationAnalysis.competitorAverage - citationAnalysis.citationRate) * 100,
        opportunityQueries: citationAnalysis.missedOpportunities,
        competitorAdvantage: citationAnalysis.topCited,
        estimatedTraffic: estimateTrafficOpportunity(citationAnalysis.missedOpportunities.length, citationAnalysis.competitorAverage)
      },
      competitors: [],
      suggestedActions: [
        "Add unique data and research",
        "Create quotable statistics",
        "Develop proprietary frameworks",
        "Build comprehensive resources",
        "Increase content freshness",
        "Improve content quality and depth"
      ]
    });
  }

  return gaps;
}

/**
 * Analyze topic coverage across responses
 */
function analyzeTopicCoverage(responses: LLMResponse[]): Record<string, any> {
  // Simplified implementation - in production would use NLP
  const coverage: Record<string, any> = {};

  // Extract topics from responses
  const topics = extractTopics(responses);

  for (const topic of topics) {
    coverage[topic] = {
      yourCoverage: calculateYourCoverage(topic, responses),
      competitorCoverage: calculateCompetitorCoverage(topic, responses),
      queries: getQueriesForTopic(topic, responses),
      competitors: getCompetitorsForTopic(topic, responses),
      competitorsCount: 0,
      topCompetitor: "",
      queriesAffected: 0,
      competitorDetails: []
    };
  }

  return coverage;
}

/**
 * Extract topics from responses
 */
function extractTopics(responses: LLMResponse[]): string[] {
  const topics = new Set<string>();

  for (const response of responses) {
    // Extract topics from query
    const query = response.query.toLowerCase();

    // Common topic patterns
    const patterns = [
      /what is ([a-z\s]+)/,
      /how to ([a-z\s]+)/,
      /best ([a-z\s]+)/,
      /([a-z\s]+) for ([a-z\s]+)/
    ];

    for (const pattern of patterns) {
      const match = query.match(pattern);
      if (match) {
        topics.add(match[1].trim());
      }
    }
  }

  return Array.from(topics);
}

/**
 * Calculate your coverage for a topic
 */
function calculateYourCoverage(topic: string, responses: LLMResponse[]): number {
  const relevantResponses = responses.filter(r =>
    r.query.toLowerCase().includes(topic.toLowerCase())
  );

  if (relevantResponses.length === 0) return 0;

  const mentionedCount = relevantResponses.filter(r => {
    const content = r.content || r.fullResponse || "";
    // Check if brand is mentioned in response
    return content.length > 0;
  }).length;

  return mentionedCount / relevantResponses.length;
}

/**
 * Calculate competitor coverage for a topic
 */
function calculateCompetitorCoverage(topic: string, responses: LLMResponse[]): number {
  // Simplified - in production would analyze competitor mentions
  return 0.7; // Placeholder
}

/**
 * Get queries related to a topic
 */
function getQueriesForTopic(topic: string, responses: LLMResponse[]): string[] {
  return responses
    .filter(r => r.query.toLowerCase().includes(topic.toLowerCase()))
    .map(r => r.query)
    .slice(0, 10);
}

/**
 * Get competitors covering a topic
 */
function getCompetitorsForTopic(topic: string, responses: LLMResponse[]): string[] {
  // Simplified - would extract from citations
  return [];
}

/**
 * Extract questions from responses
 */
function extractQuestions(responses: LLMResponse[]): any[] {
  const questions: any[] = [];

  for (const response of responses) {
    if (response.query.match(/^(what|how|why|when|where|who|which|can|should)/i)) {
      questions.push({
        text: response.query,
        topic: extractTopicFromQuestion(response.query),
        yourAnswer: false,
        competitorAnswers: 0,
        frequency: 1,
        competitorsAnswering: [],
        competitorDetails: []
      });
    }
  }

  return questions;
}

/**
 * Extract topic from question
 */
function extractTopicFromQuestion(question: string): string {
  const words = question.toLowerCase().split(" ");
  return words.slice(0, 4).join(" ");
}

/**
 * Analyze authority signals
 */
function analyzeAuthoritySignals(responses: LLMResponse[]): any {
  return {
    expertQuotes: 0,
    competitorAverage: 5
  };
}

/**
 * Analyze schema opportunities
 */
function analyzeSchemaOpportunities(responses: LLMResponse[]): any[] {
  return [
    {
      schemaType: "FAQPage",
      implemented: false,
      competitorUsage: 0.6,
      relevantQueries: [],
      competitorsUsing: []
    }
  ];
}

/**
 * Analyze citation-worthiness
 */
function analyzeCitationWorthiness(responses: LLMResponse[]): any {
  return {
    citationRate: 0.2,
    competitorAverage: 0.5,
    missedOpportunities: [],
    topCited: []
  };
}

/**
 * Determine gap severity
 */
function determineSeverity(competitorCoverage: number, queriesAffected: number): "critical" | "high" | "medium" | "low" {
  if (competitorCoverage > 0.8 && queriesAffected > 10) return "critical";
  if (competitorCoverage > 0.6 || queriesAffected > 5) return "high";
  if (competitorCoverage > 0.4 || queriesAffected > 2) return "medium";
  return "low";
}

/**
 * Estimate traffic opportunity
 */
function estimateTrafficOpportunity(queries: number, coverage: number): number {
  // Simplified calculation
  const avgTrafficPerQuery = 100;
  return Math.round(queries * avgTrafficPerQuery * coverage);
}

/**
 * Calculate gap summary
 */
function calculateGapSummary(gaps: ContentGap[]): GapSummary {
  const bySeverity: Record<string, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  };

  const byType: Record<string, number> = {};

  let totalOpportunity = 0;

  for (const gap of gaps) {
    bySeverity[gap.severity]++;
    byType[gap.type] = (byType[gap.type] || 0) + 1;
    totalOpportunity += gap.impact.estimatedTraffic;
  }

  // Calculate priority score (0-100)
  const priorityScore = Math.min(100,
    (bySeverity.critical * 25) +
    (bySeverity.high * 15) +
    (bySeverity.medium * 8) +
    (bySeverity.low * 3)
  );

  return {
    totalGaps: gaps.length,
    bySeverity,
    byType,
    totalOpportunity,
    priorityScore
  };
}

/**
 * Generate recommendations from gaps
 */
function generateGapRecommendations(gaps: ContentGap[]): any[] {
  return gaps.slice(0, 10).map(gap => ({
    id: `rec_${gap.id}`,
    type: mapGapTypeToRecommendation(gap.type),
    priority: gap.severity,
    title: `Address: ${gap.description}`,
    description: gap.suggestedActions.join(". "),
    reasoning: `This gap is causing an estimated ${gap.impact.visibilityLoss.toFixed(1)}% visibility loss`,
    expectedImpact: {
      visibilityIncrease: gap.impact.visibilityLoss * 0.7,
      timeframe: gap.severity === "critical" ? "1-2 weeks" : "2-4 weeks",
      affectedQueries: gap.impact.opportunityQueries.length,
      estimatedTraffic: gap.impact.estimatedTraffic,
      confidence: 75
    },
    effort: "medium",
    roi: 0,
    actionItems: gap.suggestedActions.map((action, i) => ({
      id: `action_${i}`,
      description: action,
      priority: i + 1,
      completed: false
    }))
  }));
}

/**
 * Map gap type to recommendation type
 */
function mapGapTypeToRecommendation(gapType: GapType): any {
  const mapping: Record<GapType, any> = {
    missing_topic: "create_content",
    insufficient_depth: "update_content",
    outdated_content: "update_content",
    missing_question: "answer_questions",
    weak_authority: "enhance_authority",
    no_schema_markup: "add_schema",
    poor_citation_worthiness: "improve_citations"
  };

  return mapping[gapType] || "create_content";
}

/**
 * Generate gap ID
 */
function generateGapId(): string {
  return `gap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate analysis ID
 */
function generateAnalysisId(): string {
  return `ana_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
