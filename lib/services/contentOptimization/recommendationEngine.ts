/**
 * Recommendation Engine
 *
 * Generates actionable, prioritized recommendations for content optimization
 */

import type {
  Recommendation,
  RecommendationType,
  ExpectedImpact,
  ActionItem,
  ContentGap,
  QuestionCoverage,
  CitationOpportunity
} from "@/lib/types/contentOptimization";
import type { LLMResponse } from "@/lib/types/features";

/**
 * Generate comprehensive recommendations
 */
export async function generateRecommendations(
  gaps: ContentGap[],
  responses: LLMResponse[],
  currentContent?: any[]
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];

  // Generate recommendations from content gaps
  recommendations.push(...generateGapBasedRecommendations(gaps));

  // Generate recommendations from response analysis
  recommendations.push(...generateResponseBasedRecommendations(responses));

  // Generate quick wins
  recommendations.push(...generateQuickWins(gaps, responses));

  // Generate long-term strategic recommendations
  recommendations.push(...generateStrategicRecommendations(gaps, responses));

  // Calculate ROI and prioritize
  recommendations.forEach(rec => {
    rec.roi = calculateROI(rec);
  });

  // Sort by priority and ROI
  recommendations.sort((a, b) => {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return b.roi - a.roi;
  });

  return recommendations;
}

/**
 * Generate recommendations from content gaps
 */
function generateGapBasedRecommendations(gaps: ContentGap[]): Recommendation[] {
  const recommendations: Recommendation[] = [];

  for (const gap of gaps) {
    const rec = createRecommendationFromGap(gap);
    if (rec) recommendations.push(rec);
  }

  return recommendations;
}

/**
 * Create recommendation from gap
 */
function createRecommendationFromGap(gap: ContentGap): Recommendation | null {
  const typeMapping: Record<string, RecommendationType> = {
    missing_topic: "create_content",
    insufficient_depth: "update_content",
    outdated_content: "update_content",
    missing_question: "answer_questions",
    weak_authority: "enhance_authority",
    no_schema_markup: "add_schema",
    poor_citation_worthiness: "improve_citations"
  };

  const type = typeMapping[gap.type];
  if (!type) return null;

  const actionItems: ActionItem[] = gap.suggestedActions.map((action, i) => ({
    id: generateActionItemId(),
    description: action,
    priority: i + 1,
    completed: false
  }));

  return {
    id: generateRecommendationId(),
    type,
    priority: gap.severity,
    title: getTitleForGap(gap),
    description: gap.description,
    reasoning: generateReasoning(gap),
    expectedImpact: {
      visibilityIncrease: gap.impact.visibilityLoss * 0.7, // Assume 70% recovery
      timeframe: getTimeframe(gap.severity, type),
      affectedQueries: gap.impact.opportunityQueries.length,
      estimatedTraffic: gap.impact.estimatedTraffic,
      confidence: calculateConfidence(gap)
    },
    effort: estimateEffort(type, gap),
    roi: 0, // Will be calculated later
    actionItems,
    relatedGaps: [gap.id]
  };
}

/**
 * Get title for gap
 */
function getTitleForGap(gap: ContentGap): string {
  const titles: Record<string, string> = {
    missing_topic: `Create comprehensive content about ${gap.topic}`,
    insufficient_depth: `Expand existing content on ${gap.topic}`,
    outdated_content: `Update outdated information about ${gap.topic}`,
    missing_question: `Answer frequently asked question about ${gap.topic}`,
    weak_authority: `Add authority signals to ${gap.topic} content`,
    no_schema_markup: `Implement ${gap.topic}`,
    poor_citation_worthiness: `Improve citation-worthiness of ${gap.topic} content`
  };

  return titles[gap.type] || `Address ${gap.topic} gap`;
}

/**
 * Generate reasoning for recommendation
 */
function generateReasoning(gap: ContentGap): string {
  const reasons = [
    `This represents a ${gap.impact.visibilityLoss.toFixed(1)}% visibility loss opportunity.`,
    gap.competitors.length > 0 ? `${gap.competitors.length} competitors have coverage in this area.` : "",
    gap.impact.opportunityQueries.length > 0 ? `${gap.impact.opportunityQueries.length} queries are affected.` : "",
    gap.impact.estimatedTraffic > 0 ? `Estimated monthly traffic opportunity: ${gap.impact.estimatedTraffic.toLocaleString()}` : ""
  ].filter(r => r.length > 0);

  return reasons.join(" ");
}

/**
 * Get timeframe for recommendation
 */
function getTimeframe(severity: string, type: RecommendationType): string {
  if (type === "add_schema") return "1-2 days";
  if (type === "update_content") return "1-2 weeks";
  if (type === "create_content") {
    return severity === "critical" ? "1-2 weeks" : "2-4 weeks";
  }
  return "2-4 weeks";
}

/**
 * Calculate confidence score
 */
function calculateConfidence(gap: ContentGap): number {
  let confidence = 50;

  // Higher confidence if more competitors have this
  if (gap.competitors.length > 3) confidence += 20;
  if (gap.competitors.length > 5) confidence += 10;

  // Higher confidence if high severity
  if (gap.severity === "critical") confidence += 15;
  if (gap.severity === "high") confidence += 10;

  // Higher confidence if more queries affected
  if (gap.impact.opportunityQueries.length > 5) confidence += 10;

  return Math.min(95, confidence);
}

/**
 * Estimate effort required
 */
function estimateEffort(type: RecommendationType, gap: ContentGap): "low" | "medium" | "high" {
  if (type === "add_schema") return "low";
  if (type === "improve_citations") return "medium";
  if (type === "update_content") return "medium";
  if (type === "create_content") {
    return gap.severity === "critical" ? "high" : "medium";
  }
  return "medium";
}

/**
 * Generate recommendations from response analysis
 */
function generateResponseBasedRecommendations(responses: LLMResponse[]): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // Analyze citation patterns
  const citationAnalysis = analyzeCitationPatterns(responses);
  if (citationAnalysis.improvementOpportunity) {
    recommendations.push(createCitationRecommendation(citationAnalysis));
  }

  // Analyze sentiment patterns
  const sentimentAnalysis = analyzeSentimentPatterns(responses);
  if (sentimentAnalysis.improvementOpportunity) {
    recommendations.push(createSentimentRecommendation(sentimentAnalysis));
  }

  // Analyze question coverage
  const questionAnalysis = analyzeQuestionCoverage(responses);
  if (questionAnalysis.missingQuestions.length > 0) {
    recommendations.push(createQuestionRecommendation(questionAnalysis));
  }

  return recommendations;
}

/**
 * Analyze citation patterns
 */
function analyzeCitationPatterns(responses: LLMResponse[]): any {
  const withCitations = responses.filter(r => r.citations && r.citations.length > 0);
  const citationRate = withCitations.length / responses.length;

  return {
    citationRate,
    improvementOpportunity: citationRate < 0.3,
    missingCount: responses.length - withCitations.length
  };
}

/**
 * Create citation improvement recommendation
 */
function createCitationRecommendation(analysis: any): Recommendation {
  return {
    id: generateRecommendationId(),
    type: "improve_citations",
    priority: "high",
    title: "Improve Content Citation-Worthiness",
    description: `Only ${(analysis.citationRate * 100).toFixed(1)}% of responses cite your content. Improving citation-worthiness can significantly boost visibility.`,
    reasoning: "AI platforms prefer citing authoritative, data-rich content. Higher citation rates directly correlate with visibility.",
    expectedImpact: {
      visibilityIncrease: (0.5 - analysis.citationRate) * 100,
      timeframe: "4-8 weeks",
      affectedQueries: analysis.missingCount,
      estimatedTraffic: analysis.missingCount * 50,
      confidence: 80
    },
    effort: "high",
    roi: 0,
    actionItems: [
      {
        id: generateActionItemId(),
        description: "Add original research and data",
        priority: 1,
        completed: false
      },
      {
        id: generateActionItemId(),
        description: "Create comprehensive guides and resources",
        priority: 2,
        completed: false
      },
      {
        id: generateActionItemId(),
        description: "Include expert quotes and case studies",
        priority: 3,
        completed: false
      },
      {
        id: generateActionItemId(),
        description: "Improve content freshness (update regularly)",
        priority: 4,
        completed: false
      }
    ],
    examples: [
      "Add proprietary data or statistics",
      "Create an industry benchmark report",
      "Develop a comprehensive glossary or resource center"
    ]
  };
}

/**
 * Analyze sentiment patterns
 */
function analyzeSentimentPatterns(responses: LLMResponse[]): any {
  const sentiments = responses.map(r => r.sentiment || "neutral");
  const negative = sentiments.filter(s => s === "negative").length;
  const negativeRate = negative / sentiments.length;

  return {
    negativeRate,
    improvementOpportunity: negativeRate > 0.15,
    negativeCount: negative
  };
}

/**
 * Create sentiment improvement recommendation
 */
function createSentimentRecommendation(analysis: any): Recommendation {
  return {
    id: generateRecommendationId(),
    type: "enhance_authority",
    priority: "high",
    title: "Address Negative Sentiment in AI Responses",
    description: `${(analysis.negativeRate * 100).toFixed(1)}% of AI responses have negative sentiment about your brand. This requires immediate attention.`,
    reasoning: "Negative sentiment in AI responses can damage brand reputation and reduce conversion rates.",
    expectedImpact: {
      visibilityIncrease: analysis.negativeRate * 50,
      timeframe: "2-4 weeks",
      affectedQueries: analysis.negativeCount,
      estimatedTraffic: 0,
      confidence: 70
    },
    effort: "high",
    roi: 0,
    actionItems: [
      {
        id: generateActionItemId(),
        description: "Identify root causes of negative sentiment",
        priority: 1,
        completed: false
      },
      {
        id: generateActionItemId(),
        description: "Address misinformation or outdated information",
        priority: 2,
        completed: false
      },
      {
        id: generateActionItemId(),
        description: "Publish positive case studies and testimonials",
        priority: 3,
        completed: false
      },
      {
        id: generateActionItemId(),
        description: "Improve transparency and communication",
        priority: 4,
        completed: false
      }
    ]
  };
}

/**
 * Analyze question coverage
 */
function analyzeQuestionCoverage(responses: LLMResponse[]): any {
  const questions = responses.filter(r =>
    r.query.match(/^(what|how|why|when|where|who|which)/i)
  );

  const unanswered = questions.filter(r => {
    const content = r.content || r.fullResponse || "";
    return content.length < 100; // Assume short responses = unanswered
  });

  return {
    totalQuestions: questions.length,
    missingQuestions: unanswered.map(r => r.query),
    answerRate: (questions.length - unanswered.length) / questions.length
  };
}

/**
 * Create question coverage recommendation
 */
function createQuestionRecommendation(analysis: any): Recommendation {
  return {
    id: generateRecommendationId(),
    type: "answer_questions",
    priority: "medium",
    title: "Improve Question Coverage with FAQ Content",
    description: `${analysis.missingQuestions.length} common questions lack comprehensive answers. Creating FAQ content can improve visibility for these queries.`,
    reasoning: "AI platforms heavily rely on FAQ content for question-based queries. Better question coverage improves answer engine visibility.",
    expectedImpact: {
      visibilityIncrease: analysis.missingQuestions.length * 3,
      timeframe: "1-2 weeks",
      affectedQueries: analysis.missingQuestions.length,
      estimatedTraffic: analysis.missingQuestions.length * 30,
      confidence: 85
    },
    effort: "low",
    roi: 0,
    actionItems: [
      {
        id: generateActionItemId(),
        description: "Create comprehensive FAQ page",
        priority: 1,
        completed: false
      },
      {
        id: generateActionItemId(),
        description: "Add FAQ schema markup",
        priority: 2,
        completed: false
      },
      {
        id: generateActionItemId(),
        description: `Answer top questions: ${analysis.missingQuestions.slice(0, 3).join(", ")}`,
        priority: 3,
        completed: false
      }
    ],
    examples: analysis.missingQuestions.slice(0, 5)
  };
}

/**
 * Generate quick wins
 */
function generateQuickWins(gaps: ContentGap[], responses: LLMResponse[]): Recommendation[] {
  const quickWins: Recommendation[] = [];

  // Schema markup is a quick win
  const schemaGaps = gaps.filter(g => g.type === "no_schema_markup");
  if (schemaGaps.length > 0) {
    quickWins.push({
      id: generateRecommendationId(),
      type: "add_schema",
      priority: "high",
      title: "Quick Win: Add Schema Markup to Existing Pages",
      description: "Implement schema markup on key pages - requires minimal effort but can significantly improve visibility.",
      reasoning: "Schema markup is a low-effort, high-impact optimization that helps AI platforms better understand your content.",
      expectedImpact: {
        visibilityIncrease: 15,
        timeframe: "1-3 days",
        affectedQueries: schemaGaps.reduce((sum, g) => sum + g.impact.opportunityQueries.length, 0),
        estimatedTraffic: 0,
        confidence: 90
      },
      effort: "low",
      roi: 0,
      actionItems: schemaGaps.slice(0, 3).map(gap => ({
        id: generateActionItemId(),
        description: gap.suggestedActions[0],
        priority: 1,
        completed: false
      }))
    });
  }

  // FAQ additions are quick wins
  const questionGaps = gaps.filter(g => g.type === "missing_question");
  if (questionGaps.length >= 3) {
    quickWins.push({
      id: generateRecommendationId(),
      type: "answer_questions",
      priority: "medium",
      title: "Quick Win: Add FAQ Section to Website",
      description: `Answer ${questionGaps.length} common questions to improve question-based query coverage.`,
      reasoning: "FAQ content is quick to create and highly valued by AI platforms for question-based queries.",
      expectedImpact: {
        visibilityIncrease: questionGaps.length * 2,
        timeframe: "1 week",
        affectedQueries: questionGaps.length,
        estimatedTraffic: questionGaps.length * 25,
        confidence: 85
      },
      effort: "low",
      roi: 0,
      actionItems: questionGaps.slice(0, 5).map((gap, i) => ({
        id: generateActionItemId(),
        description: `Answer: ${gap.topic}`,
        priority: i + 1,
        completed: false
      }))
    });
  }

  return quickWins;
}

/**
 * Generate strategic recommendations
 */
function generateStrategicRecommendations(gaps: ContentGap[], responses: LLMResponse[]): Recommendation[] {
  const strategic: Recommendation[] = [];

  // Content hub strategy
  const topicGaps = gaps.filter(g => g.type === "missing_topic" || g.type === "insufficient_depth");
  if (topicGaps.length >= 5) {
    strategic.push({
      id: generateRecommendationId(),
      type: "create_content",
      priority: "medium",
      title: "Strategic: Build Comprehensive Content Hub",
      description: "Create a comprehensive content hub covering all key topics to establish topical authority.",
      reasoning: "AI platforms favor brands with comprehensive topic coverage. A content hub demonstrates expertise across your domain.",
      expectedImpact: {
        visibilityIncrease: 40,
        timeframe: "2-3 months",
        affectedQueries: topicGaps.reduce((sum, g) => sum + g.impact.opportunityQueries.length, 0),
        estimatedTraffic: topicGaps.reduce((sum, g) => sum + g.impact.estimatedTraffic, 0),
        confidence: 75
      },
      effort: "high",
      roi: 0,
      actionItems: [
        {
          id: generateActionItemId(),
          description: "Map out content hub structure and topics",
          priority: 1,
          completed: false
        },
        {
          id: generateActionItemId(),
          description: "Create pillar content for main topics",
          priority: 2,
          completed: false
        },
        {
          id: generateActionItemId(),
          description: "Develop supporting content for subtopics",
          priority: 3,
          completed: false
        },
        {
          id: generateActionItemId(),
          description: "Implement internal linking strategy",
          priority: 4,
          completed: false
        }
      ]
    });
  }

  return strategic;
}

/**
 * Calculate ROI score
 */
function calculateROI(rec: Recommendation): number {
  const effortScore = { low: 1, medium: 2, high: 3 }[rec.effort];
  const impactScore = rec.expectedImpact.visibilityIncrease;

  // ROI = Impact / Effort
  return Math.round((impactScore / effortScore) * 10);
}

/**
 * Generate recommendation ID
 */
function generateRecommendationId(): string {
  return `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate action item ID
 */
function generateActionItemId(): string {
  return `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get top recommendations by ROI
 */
export function getTopRecommendationsByROI(
  recommendations: Recommendation[],
  limit: number = 5
): Recommendation[] {
  return recommendations
    .sort((a, b) => b.roi - a.roi)
    .slice(0, limit);
}

/**
 * Get quick wins (low effort, high impact)
 */
export function getQuickWinRecommendations(
  recommendations: Recommendation[]
): Recommendation[] {
  return recommendations.filter(rec =>
    rec.effort === "low" &&
    rec.expectedImpact.visibilityIncrease >= 10
  );
}

/**
 * Get critical priorities
 */
export function getCriticalPriorities(
  recommendations: Recommendation[]
): Recommendation[] {
  return recommendations.filter(rec => rec.priority === "critical");
}
