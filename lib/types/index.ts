export interface TrafficMetrics {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  change?: {
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  };
}

export interface KeywordData {
  keyword: string;
  searchVolume?: number;
  difficulty?: number;
  intent?: "informational" | "commercial" | "transactional" | "navigational";
  hasAiOverview: boolean;
  metrics: TrafficMetrics;
  beforeMetrics?: TrafficMetrics;
  afterMetrics?: TrafficMetrics;
}

export interface AiOverviewData {
  date: string;
  hasAiOverview: boolean;
  position?: number;
  contentLength?: number;
  sources?: string[];
}

export interface TrafficImpact {
  totalClicksChange: number;
  totalImpressionsChange: number;
  avgCtrChange: number;
  avgPositionChange: number;
  affectedKeywords: number;
  impactPercentage: number;
}

export interface ChatbotVisibilityMetrics {
  platform: "chatgpt" | "gemini";
  overallScore: number;
  mentionRate: number;
  avgPosition?: number;
  citationRate: number;
  shareOfVoice?: number;
  trend?: "up" | "down" | "stable";
  competitorComparison?: {
    competitor: string;
    score: number;
  }[];
}

export interface ChatbotQueryResult {
  question: string;
  platform: "chatgpt" | "gemini";
  hasBrandMention: boolean;
  brandPosition?: number;
  citedUrls?: string[];
  competitors?: string[];
  sentiment?: "positive" | "neutral" | "negative";
  responseText: string;
}

export interface OptimizationRecommendation {
  id: string;
  category: "content_gap" | "content_optimization" | "technical" | "authority" | "competitive";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  impact: string;
  effort: string;
  actionItems: string[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
