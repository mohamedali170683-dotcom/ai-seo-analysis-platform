/**
 * Type definitions for new platform features
 */

// ==================== Question Generation ====================

export interface Question {
  id: string;
  text: string;
  source: "seo" | "ai_generated";
  funnelStage: "awareness" | "consideration" | "decision";
  personaInfluence: "LOW" | "MEDIUM" | "HIGH";
  persona?: string | null;
  metadata?: {
    pattern?: string;
    modifiers?: string[];
  };
}

// ==================== Visibility Scoring ====================

export interface VisibilityScore {
  overall: number;
  byStage: {
    awareness: number;
    consideration: number;
    decision: number;
  };
  byLLM: {
    chatgpt: number;
    gemini: number;
    copilot: number;
    perplexity: number;
  };
}

export interface AwarenessScore {
  finalScore: number;
  breakdown: {
    contentCitationRate: number;
    mentionRate: number;
    sentiment: number;
    topicalAlignment: number;
  };
}

export interface StageScores {
  awareness: number;
  consideration: number;
  decision: number;
}

// ==================== Citations ====================

export interface Citation {
  url?: string;
  domain?: string;
  title?: string;
  snippet?: string;
  source?: string;
  type?: "explicit_attribution" | "domain_attribution" | "url";
  platform: string;
}

export interface CitationExtractor {
  hasNativeCitations: boolean | "PARTIAL";
  confidence: "HIGH" | "MEDIUM" | "LOW";
  extract: (response: any) => Citation[];
}

// ==================== Conversation Simulation ====================

export interface ConversationSession {
  id: string;
  brand: string;
  subcategory: string;
  persona: string;
  llm: string;
  turns: ConversationTurn[];
  metrics: SessionMetrics;
}

export interface ConversationTurn {
  turnNumber: number;
  query: string;
  response: any;
  analysis: TurnAnalysis;
  brandPresent: boolean;
  competitorsPresent: string[];
}

export interface TurnAnalysis {
  brandMentioned: boolean;
  brandPosition?: number;
  competitorsMentioned: string[];
  sentiment?: "positive" | "neutral" | "negative";
}

export interface SessionMetrics {
  final?: FinalMetrics;
  persistence?: number;
  dropOff?: DropOffAnalysis;
  recovery?: number;
  takeovers?: Takeover[];
}

export interface FinalMetrics {
  stickiness: StickinessScore;
  averageSentiment: string;
  recommendationRate: number;
}

export interface StickinessScore {
  overall: number;
  persistence: number;
  dropOff: DropOffAnalysis;
  recovery: number;
  takeovers: Takeover[];
}

export interface DropOffAnalysis {
  dropped: boolean;
  persistedToEnd?: boolean;
  lastMentionTurn?: number;
  score: number;
}

export interface Takeover {
  atTurn: number;
  query: string;
  replacedBy: string[];
}

// ==================== Content Gaps ====================

export interface ContentGap {
  topic: string;
  queryCount: number;
  queryExamples: string[];
  brandContentExists: boolean;
  competitorsCited: string[];
  opportunity: Opportunity;
}

export interface Opportunity {
  score: number;
  priority: "HIGH" | "MEDIUM" | "LOW";
  type: "creation" | "optimization";
}

export interface PageInventory {
  url: string;
  path: string;
  title: string;
  type: string;
  topics: string[];
  wordCount: number;
  hasStructuredData: boolean;
  citabilityScore: number;
}

// ==================== Competitive Triggers ====================

export interface TriggerTest {
  brand: string;
  subcategory: string;
  competitors: string[];
  llmsTested: string[];
  totalTests: number;
  results: TriggerResult[];
  analysis: TriggerAnalysis;
  timestamp: string;
  durationSeconds: number;
}

export interface TriggerResult {
  testId: string;
  llm: string;
  query: string;
  modifier: string;
  modifierCategory: string;
  modifierType: string;
  brandMentioned: boolean;
  brandPosition: number | null;
  competitorsMentioned: string[];
  competitorPositions: Record<string, number>;
  outcome: "win" | "loss" | "partial" | "absent" | "error";
  sentiment: string;
  recommendationStrength: number;
  timestamp: string;
  error?: string;
}

export interface TriggerAnalysis {
  summary: {
    totalTests: number;
    wins: number;
    losses: number;
    partials: number;
    absent: number;
    winRate: number;
    lossRate: number;
  };
  lossTriggers: LossTrigger[];
  winTriggers: WinTrigger[];
  byCategory: Record<string, {
    category: string;
    totalTests: number;
    wins: number;
    losses: number;
    winRate: number;
    lossRate: number;
  }>;
  byLLM: Record<string, {
    llm: string;
    totalTests: number;
    wins: number;
    losses: number;
    winRate: number;
    lossRate: number;
  }>;
  competitorDominance: Array<{
    competitor: string;
    appearances: number;
    wins: number;
    winRate: number;
    averagePosition: number;
    strongestCategories: string[];
  }>;
  recommendations: string[];
}

export interface LossTrigger {
  modifier: string;
  category: string;
  type: string;
  lossRate: number;
  lossCount: number;
  totalTests: number;
  severity: "critical" | "high" | "medium" | "low";
  dominantCompetitors: Array<{
    name: string;
    winCount: number;
    winRate: number;
  }>;
  affectedLLMs: string[];
  exampleQueries: string[];
}

export interface WinTrigger {
  modifier: string;
  category: string;
  type: string;
  winRate: number;
  winCount: number;
  totalTests: number;
  strength: "dominant" | "strong" | "moderate" | "weak";
  averagePosition: number | null;
  averageRecommendationStrength: number;
  affectedLLMs: string[];
  exampleQueries: string[];
}

// ==================== Temporal Tracking ====================

export interface Scan {
  id: string;
  timestamp: string;
  type: "key_queries" | "full_scan" | "extended_scan";
  brand: string;
  results: ScanResult[];
  summary?: ScanSummary;
}

export interface ScanResult {
  queryId: string;
  query: string;
  llmResults: any;
}

export interface ScanSummary {
  overallScore: number;
  byLLM: {
    chatgpt: number;
    gemini: number;
    copilot: number;
    perplexity: number;
  };
}

export interface Anomaly {
  type: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  currentValue: number;
  baselineValue: number;
  change: number;
  changePercent: number;
  direction: "IMPROVEMENT" | "DECLINE";
  llm?: string;
  timestamp?: string;
  possibleCause?: Attribution;
}

export interface Baseline {
  overallScore: number;
  overallStdDev: number;
  byLLM: {
    chatgpt: number;
    gemini: number;
    copilot: number;
    perplexity: number;
  };
  byLLMStdDev: {
    chatgpt: number;
    gemini: number;
    copilot: number;
    perplexity: number;
  };
}

export interface Attribution {
  anomaly: Anomaly;
  possibleCauses: Cause[];
  mostLikelyCause: Cause | null;
}

export interface Cause {
  type: "MODEL_UPDATE" | "COMPETITOR_CONTENT" | "BRAND_CONTENT_CHANGE" | "ALGORITHM_CHANGE";
  confidence: "HIGH" | "MEDIUM" | "LOW";
  details: any;
  explanation?: string;
}

// ==================== LLM Responses ====================

export interface LLMResponse {
  llm: "chatgpt" | "gemini" | "copilot" | "perplexity";
  query: string;
  content: string;
  fullResponse?: string;
  citations?: Citation[];
  sources?: any[];
  groundingMetadata?: any;
  webResults?: any[];
  timestamp: string;
  metadata?: any;
  sentiment?: "positive" | "neutral" | "negative";
  brandMentioned?: boolean;
}

// ==================== Brand Config ====================

export interface Brand {
  name: string;
  domain: string;
  category: string;
  subcategory: string;
  competitors: string[];
}

// ==================== Journey Simulation ====================

export interface Journey {
  stages: JourneyStage[];
  outcome: JourneyOutcome | null;
}

export interface JourneyStage {
  stage: string;
  query: string;
  analysis: any;
}

export interface JourneyOutcome {
  brandSelected: boolean;
  competitorSelected?: string;
  noDecision?: boolean;
}

// ==================== Uncertainty Detection ====================

export interface UncertaintyResult {
  hasUncertainty: boolean;
  level: "NONE" | "LOW" | "MEDIUM" | "HIGH";
  markers: Array<{
    pattern: string;
    severity: string;
  }>;
}
