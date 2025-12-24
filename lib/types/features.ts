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

export interface TriggerTestConfig {
  brand: string;
  subcategory: string;
  competitors: string[];
  llms: string[];
}

export interface TestQuery {
  id: string;
  modifier: string;
  modifierCategory: string;
  fullQuery: string;
}

export interface TestResult extends TestQuery {
  brandMentioned: boolean;
  brandPosition?: number;
  competitorsMentioned: string[];
  winner?: string;
}

export interface TriggerResults {
  lossTriggers: LossTrigger[];
  winTriggers: WinTrigger[];
}

export interface LossTrigger {
  category: string;
  severity: number;
  specificTriggers: string[];
  competitorBenefiting: string[];
  examples: Array<{
    query: string;
    winner?: string;
  }>;
}

export interface WinTrigger {
  category: string;
  strength: number;
  specificTriggers: string[];
  examples: string[];
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
  citations?: Citation[];
  sources?: any[];
  timestamp: string;
  metadata?: any;
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
