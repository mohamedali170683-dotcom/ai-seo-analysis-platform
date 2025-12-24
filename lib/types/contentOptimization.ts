/**
 * Type definitions for Content Optimization Engine
 */

// ==================== Content Gap Analysis ====================

export interface ContentGapAnalysis {
  id: string;
  brandId: string;
  analyzedAt: string;
  gaps: ContentGap[];
  summary: GapSummary;
  recommendations: Recommendation[];
}

export interface ContentGap {
  id: string;
  type: GapType;
  severity: "critical" | "high" | "medium" | "low";
  topic: string;
  description: string;
  impact: GapImpact;
  competitors: CompetitorCoverage[];
  suggestedActions: string[];
}

export type GapType =
  | "missing_topic"
  | "insufficient_depth"
  | "outdated_content"
  | "missing_question"
  | "weak_authority"
  | "no_schema_markup"
  | "poor_citation_worthiness";

export interface GapImpact {
  visibilityLoss: number; // Estimated % visibility loss
  opportunityQueries: string[]; // Queries you're missing
  competitorAdvantage: string[]; // Competitors benefiting
  estimatedTraffic: number; // Monthly traffic opportunity
}

export interface CompetitorCoverage {
  competitor: string;
  hasContent: boolean;
  contentQuality: "excellent" | "good" | "fair" | "poor";
  citationRate: number; // % of times cited
  contentUrl?: string;
}

export interface GapSummary {
  totalGaps: number;
  bySeverity: Record<string, number>;
  byType: Record<string, number>;
  totalOpportunity: number; // Estimated monthly traffic
  priorityScore: number; // 0-100
}

// ==================== Recommendations ====================

export interface Recommendation {
  id: string;
  type: RecommendationType;
  priority: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  reasoning: string;
  expectedImpact: ExpectedImpact;
  effort: "low" | "medium" | "high";
  roi: number; // Estimated ROI score
  actionItems: ActionItem[];
  examples?: string[];
  relatedGaps?: string[]; // Gap IDs
}

export type RecommendationType =
  | "create_content"
  | "update_content"
  | "add_schema"
  | "improve_citations"
  | "answer_questions"
  | "enhance_authority"
  | "optimize_keywords"
  | "add_visual_content";

export interface ExpectedImpact {
  visibilityIncrease: number; // % increase
  timeframe: string; // "1-2 weeks", "1-3 months"
  affectedQueries: number;
  estimatedTraffic: number;
  confidence: number; // 0-100
}

export interface ActionItem {
  id: string;
  description: string;
  priority: number; // 1-5
  completed: boolean;
  assignedTo?: string;
}

// ==================== Citation Opportunities ====================

export interface CitationOpportunity {
  id: string;
  topic: string;
  query: string;
  type: CitationType;
  currentState: CitationState;
  opportunity: OpportunityDetails;
  recommendations: string[];
}

export type CitationType =
  | "fact_citation"
  | "expert_quote"
  | "data_source"
  | "case_study"
  | "tutorial"
  | "comparison";

export interface CitationState {
  currentlyCited: boolean;
  citationRate: number; // 0-100
  competitorCitations: number;
  yourRanking?: number;
  topCitedSources: string[];
}

export interface OpportunityDetails {
  potentialGain: number; // % increase in citations
  difficulty: "easy" | "medium" | "hard";
  requiredContent: string;
  contentType: "article" | "data" | "tool" | "guide" | "video";
  estimatedEffort: string;
}

// ==================== Keyword & Topic Suggestions ====================

export interface KeywordSuggestion {
  id: string;
  keyword: string;
  topic: string;
  relevance: number; // 0-100
  searchVolume: number; // Monthly searches
  difficulty: number; // 0-100
  opportunity: number; // 0-100
  currentCoverage: CoverageLevel;
  recommendedAction: string;
  relatedKeywords: string[];
}

export type CoverageLevel = "none" | "minimal" | "partial" | "good" | "excellent";

export interface TopicCluster {
  id: string;
  mainTopic: string;
  subtopics: string[];
  keywords: string[];
  currentCoverage: CoverageLevel;
  competitorCoverage: CompetitorTopicCoverage[];
  recommendedContent: RecommendedContent[];
}

export interface CompetitorTopicCoverage {
  competitor: string;
  coverage: CoverageLevel;
  topContent: string[];
  citationRate: number;
}

export interface RecommendedContent {
  title: string;
  type: "pillar_page" | "cluster_content" | "faq" | "guide" | "comparison";
  targetKeywords: string[];
  targetQueries: string[];
  estimatedImpact: number;
  priority: number;
}

// ==================== Question Coverage ====================

export interface QuestionCoverage {
  id: string;
  question: string;
  category: QuestionCategory;
  askedBy: string[]; // LLMs asking this question
  currentAnswer: AnswerQuality;
  competitorAnswers: CompetitorAnswer[];
  recommendation: QuestionRecommendation;
}

export type QuestionCategory =
  | "what_is"
  | "how_to"
  | "why"
  | "when"
  | "where"
  | "who"
  | "comparison"
  | "best_practices"
  | "troubleshooting";

export interface AnswerQuality {
  hasAnswer: boolean;
  quality: "excellent" | "good" | "fair" | "poor" | "none";
  completeness: number; // 0-100
  accuracy: number; // 0-100
  citationRate: number; // % of times cited
  sourceUrl?: string;
}

export interface CompetitorAnswer {
  competitor: string;
  quality: "excellent" | "good" | "fair" | "poor";
  citationRate: number;
  sourceUrl: string;
}

export interface QuestionRecommendation {
  action: "create_new" | "update_existing" | "enhance_existing";
  suggestedFormat: "article" | "faq" | "video" | "infographic" | "tool";
  keyPoints: string[];
  targetLength: string; // "500-1000 words"
  schemaSuggestion?: string;
}

// ==================== Schema Markup Recommendations ====================

export interface SchemaRecommendation {
  id: string;
  pageUrl: string;
  currentSchema: string[]; // Current schema types
  recommendedSchema: SchemaType[];
  priority: "critical" | "high" | "medium" | "low";
  impact: SchemaImpact;
  implementation: SchemaImplementation;
}

export interface SchemaType {
  type: string; // "FAQPage", "HowTo", "Product", etc.
  reason: string;
  properties: SchemaProperty[];
  example: any; // JSON-LD example
}

export interface SchemaProperty {
  name: string;
  required: boolean;
  value?: string;
  suggestion?: string;
}

export interface SchemaImpact {
  richSnippetChance: number; // 0-100
  visibilityIncrease: number; // %
  competitorsUsingIt: number;
  aiPlatformSupport: string[]; // Which LLMs respect this schema
}

export interface SchemaImplementation {
  difficulty: "easy" | "medium" | "hard";
  estimatedTime: string;
  codeSnippet: string;
  validationUrl: string;
  testingTips: string[];
}

// ==================== Content Quality Score ====================

export interface ContentQualityScore {
  url: string;
  overallScore: number; // 0-100
  dimensions: QualityDimensions;
  issues: QualityIssue[];
  strengths: string[];
  recommendations: string[];
}

export interface QualityDimensions {
  comprehensiveness: number; // 0-100
  accuracy: number;
  freshness: number;
  authority: number;
  citationWorthiness: number;
  technicalOptimization: number;
  userExperience: number;
}

export interface QualityIssue {
  type: string;
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  location?: string;
  fix: string;
}

// ==================== Competitor Content Analysis ====================

export interface CompetitorContentAnalysis {
  competitor: string;
  analyzedAt: string;
  topContent: CompetitorContent[];
  contentStrategy: ContentStrategy;
  gaps: string[]; // Areas where you can outperform
  threats: string[]; // Areas where they're strong
}

export interface CompetitorContent {
  url: string;
  title: string;
  type: string;
  performance: ContentPerformance;
  features: ContentFeature[];
  canBeat: boolean;
  beatabilityScore: number; // 0-100
}

export interface ContentPerformance {
  citationRate: number;
  llmMentions: number;
  estimatedTraffic: number;
  authorityScore: number;
}

export interface ContentFeature {
  feature: string;
  present: boolean;
  quality: "excellent" | "good" | "fair" | "poor";
}

export interface ContentStrategy {
  focus: string[];
  contentTypes: string[];
  updateFrequency: string;
  strengthAreas: string[];
  weaknesses: string[];
}

// ==================== Content Calendar ====================

export interface ContentCalendar {
  id: string;
  brandId: string;
  items: CalendarItem[];
  generatedAt: string;
  periodCovered: {
    start: string;
    end: string;
  };
}

export interface CalendarItem {
  id: string;
  dueDate: string;
  type: "create" | "update" | "optimize" | "review";
  title: string;
  description: string;
  targetKeywords: string[];
  targetQueries: string[];
  priority: number;
  estimatedEffort: string;
  expectedImpact: number;
  status: "planned" | "in_progress" | "completed" | "cancelled";
  assignedTo?: string;
  relatedRecommendationId?: string;
}

// ==================== Optimization Report ====================

export interface OptimizationReport {
  id: string;
  brandId: string;
  generatedAt: string;
  period: {
    start: string;
    end: string;
  };
  executiveSummary: ExecutiveSummary;
  contentGaps: ContentGapAnalysis;
  recommendations: Recommendation[];
  citationOpportunities: CitationOpportunity[];
  keywordSuggestions: KeywordSuggestion[];
  questionCoverage: QuestionCoverage[];
  schemaRecommendations: SchemaRecommendation[];
  competitorAnalysis: CompetitorContentAnalysis[];
  priorityActions: Recommendation[];
}

export interface ExecutiveSummary {
  overallHealthScore: number; // 0-100
  totalOpportunities: number;
  estimatedImpact: {
    visibilityIncrease: number;
    trafficIncrease: number;
    timeframe: string;
  };
  topPriorities: string[];
  quickWins: Recommendation[];
}

// ==================== Content Performance Tracking ====================

export interface ContentPerformanceTracker {
  contentId: string;
  url: string;
  title: string;
  publishedAt: string;
  lastUpdated: string;
  metrics: ContentMetrics;
  historicalData: HistoricalMetric[];
  optimization: OptimizationHistory[];
}

export interface ContentMetrics {
  visibilityScore: number;
  citationRate: number;
  llmMentions: number;
  questionsCovered: number;
  schemaImplemented: boolean;
  authorityScore: number;
}

export interface HistoricalMetric {
  date: string;
  visibilityScore: number;
  citationRate: number;
  llmMentions: number;
}

export interface OptimizationHistory {
  date: string;
  action: string;
  impact: number; // % change
  description: string;
}
