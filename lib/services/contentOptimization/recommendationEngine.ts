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
 * Create citation improvement recommendation (evidence-backed by GEO research)
 */
function createCitationRecommendation(analysis: any): Recommendation {
  return {
    id: generateRecommendationId(),
    type: "improve_citations",
    priority: "high",
    title: "Improve Content Citation-Worthiness (GEO-Optimized)",
    description: `Only ${(analysis.citationRate * 100).toFixed(1)}% of responses cite your content. The GEO study (KDD 2024) shows expert quotations increase visibility by +40.9% and statistics by +30.6% — these are the highest-impact optimizations available.`,
    reasoning: "Peer-reviewed research (Princeton/IIT Delhi, KDD 2024) confirms that citation-worthy content with statistics, expert quotes, and authoritative sources significantly outperforms traditional SEO. 92% of AI citations come from pages already ranking in Google's top 10. FAQPage schema alone improves citation rates from 15% to 41% (2.7x improvement).",
    expectedImpact: {
      visibilityIncrease: (0.5 - analysis.citationRate) * 100,
      timeframe: "4-8 weeks",
      affectedQueries: analysis.missingCount,
      estimatedTraffic: analysis.missingCount * 50,
      confidence: 85
    },
    effort: "medium",
    roi: 0,
    actionItems: [
      {
        id: generateActionItemId(),
        description: "Add statistics and data points to key content pages (+30.6% visibility, Tier 1 evidence)",
        priority: 1,
        completed: false
      },
      {
        id: generateActionItemId(),
        description: "Include expert quotations with credentials (+40.9% visibility, Tier 1 evidence)",
        priority: 2,
        completed: false
      },
      {
        id: generateActionItemId(),
        description: "Cite authoritative sources throughout content (+27.5% visibility, Tier 1 evidence)",
        priority: 3,
        completed: false
      },
      {
        id: generateActionItemId(),
        description: "Implement FAQPage schema in JSON-LD format (2.7x citation improvement, Tier 1 evidence)",
        priority: 4,
        completed: false
      },
      {
        id: generateActionItemId(),
        description: "Add visible 'last updated' timestamps — 85% of AI citations come from content < 2 years old",
        priority: 5,
        completed: false
      }
    ],
    examples: [
      "Add proprietary data or statistics (e.g., 'Our analysis of 1,000 customers found...')",
      "Include named expert quotations (e.g., 'According to [Expert], [Credential]...')",
      "Create comprehensive resource pages with authoritative source citations",
      "Implement FAQPage schema — proven 2.7x citation rate improvement"
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
    title: "Address Negative Sentiment & Strengthen E-E-A-T Signals",
    description: `${(analysis.negativeRate * 100).toFixed(1)}% of AI responses have negative sentiment. E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) heavily influences AI source selection — over 75% of ChatGPT citations in sensitive categories come from established institutional sources.`,
    reasoning: "Brand authority transfers from traditional signals to AI systems. Brand search volume shows a 0.334 correlation with AI citation probability — the strongest single predictor identified (Profound, 680M citations). Sites cited across 4+ AI platforms are 2.8x more likely to appear in ChatGPT responses.",
    expectedImpact: {
      visibilityIncrease: analysis.negativeRate * 50,
      timeframe: "4-8 weeks",
      affectedQueries: analysis.negativeCount,
      estimatedTraffic: 0,
      confidence: 75
    },
    effort: "high",
    roi: 0,
    actionItems: [
      {
        id: generateActionItemId(),
        description: "Publish verified case studies with specific, measurable outcomes",
        priority: 1,
        completed: false
      },
      {
        id: generateActionItemId(),
        description: "Create or optimize Wikidata entity for brand recognition (Knowledge Graph entities get 60% more citations)",
        priority: 2,
        completed: false
      },
      {
        id: generateActionItemId(),
        description: "Build author profile pages with credentials and sameAs schema for E-E-A-T",
        priority: 3,
        completed: false
      },
      {
        id: generateActionItemId(),
        description: "Pursue media coverage and third-party mentions to build cross-platform authority",
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
    title: "Implement FAQ Content with Schema Markup (Proven 2.7x Impact)",
    description: `${analysis.missingQuestions.length} common questions lack comprehensive answers. Pages with FAQPage schema achieve 41% citation rates vs 15% without — a 2.7x improvement (Relixir study, Tier 1 evidence).`,
    reasoning: "LLMs parse content at paragraph level. Each section must function as a standalone unit answering a specific question. Optimal paragraph length is 40-60 words — long enough for substance, short enough for clean extraction. Begin with a direct answer in the first 1-3 sentences.",
    expectedImpact: {
      visibilityIncrease: analysis.missingQuestions.length * 5,
      timeframe: "1-2 weeks",
      affectedQueries: analysis.missingQuestions.length,
      estimatedTraffic: analysis.missingQuestions.length * 30,
      confidence: 90
    },
    effort: "low",
    roi: 0,
    actionItems: [
      {
        id: generateActionItemId(),
        description: "Create FAQ page with 40-60 word answer blocks, each starting with a direct answer",
        priority: 1,
        completed: false
      },
      {
        id: generateActionItemId(),
        description: "Implement FAQPage schema in JSON-LD format (2.7x citation improvement, Tier 1 evidence)",
        priority: 2,
        completed: false
      },
      {
        id: generateActionItemId(),
        description: `Answer top questions with data and expert quotes: ${analysis.missingQuestions.slice(0, 3).join(", ")}`,
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

  // Schema markup is a quick win — Tier 1 evidence
  const schemaGaps = gaps.filter(g => g.type === "no_schema_markup");
  if (schemaGaps.length > 0) {
    quickWins.push({
      id: generateRecommendationId(),
      type: "add_schema",
      priority: "high",
      title: "Quick Win: Deploy Schema Markup (Tier 1 Evidence, 2.7x Impact)",
      description: "Microsoft's Fabrice Canel confirmed at SMX Munich 2025 that schema markup helps LLMs understand content. Google's Ryan Levering stated schema plays a critical role in 'grounding and scaling generative AI systems.'",
      reasoning: "FAQPage schema achieves 41% citation rates vs 15% without (2.7x improvement). Priority schemas: FAQPage, Organization, Person, Article, HowTo. Use JSON-LD format with sameAs properties linking to Wikidata, LinkedIn, and official profiles.",
      expectedImpact: {
        visibilityIncrease: 20,
        timeframe: "1-3 days",
        affectedQueries: schemaGaps.reduce((sum, g) => sum + g.impact.opportunityQueries.length, 0),
        estimatedTraffic: 0,
        confidence: 92
      },
      effort: "low",
      roi: 0,
      actionItems: [
        ...schemaGaps.slice(0, 2).map(gap => ({
          id: generateActionItemId(),
          description: gap.suggestedActions[0],
          priority: 1,
          completed: false
        })),
        {
          id: generateActionItemId(),
          description: "Add Organization schema with sameAs links to Wikidata, LinkedIn, and official profiles",
          priority: 2,
          completed: false
        },
      ]
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

  // Content hub strategy — backed by case study evidence
  const topicGaps = gaps.filter(g => g.type === "missing_topic" || g.type === "insufficient_depth");
  if (topicGaps.length >= 5) {
    strategic.push({
      id: generateRecommendationId(),
      type: "create_content",
      priority: "medium",
      title: "Strategic: Build GEO-Optimized Content Hub",
      description: "Create a comprehensive content hub using proven GEO tactics. Mint Studios achieved 67% visibility growth using short (500-1000 word), fact-dense articles targeting specific AI prompts. Go Fish Digital saw +43% AI traffic with cornerstone content enriched with statistics and schema.",
      reasoning: "AI platforms favor brands with comprehensive topic coverage. Each content piece should include: expert quotations (+40.9%), statistics (+30.6%), authoritative source citations (+27.5%). Structure in 40-60 word extractable blocks. Avoid keyword stuffing (-8.3%). Sites cited across 4+ AI platforms are 2.8x more likely to appear in ChatGPT responses.",
      expectedImpact: {
        visibilityIncrease: 45,
        timeframe: "1-3 months (results documented in as little as 1 week for new content)",
        affectedQueries: topicGaps.reduce((sum, g) => sum + g.impact.opportunityQueries.length, 0),
        estimatedTraffic: topicGaps.reduce((sum, g) => sum + g.impact.estimatedTraffic, 0),
        confidence: 80
      },
      effort: "high",
      roi: 0,
      actionItems: [
        {
          id: generateActionItemId(),
          description: "Map content hub topics to specific AI prompts (prompt mapping strategy, as used by Go Fish Digital)",
          priority: 1,
          completed: false
        },
        {
          id: generateActionItemId(),
          description: "Create pillar content: 500-1000 words, fact-dense, with expert quotes and statistics",
          priority: 2,
          completed: false
        },
        {
          id: generateActionItemId(),
          description: "Structure all content in 40-60 word paragraph blocks starting with direct answers",
          priority: 3,
          completed: false
        },
        {
          id: generateActionItemId(),
          description: "Implement Article, FAQPage, and HowTo schema on all content hub pages",
          priority: 4,
          completed: false
        },
        {
          id: generateActionItemId(),
          description: "Set up quarterly content refresh cadence with visible timestamps",
          priority: 5,
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
