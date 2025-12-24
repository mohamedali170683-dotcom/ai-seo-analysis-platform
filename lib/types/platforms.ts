/**
 * Type definitions for AI Platform integrations
 * Extends base types to support Claude and Google AI Overviews
 */

import type { LLMResponse } from "./features";

// ==================== Platform Types ====================

export type PlatformType =
  | "chatgpt"
  | "gemini"
  | "copilot"
  | "perplexity"
  | "claude"
  | "google_ai_overviews";

export interface PlatformConfig {
  type: PlatformType;
  name: string;
  enabled: boolean;
  apiKey?: string;
  endpoint?: string;
  options?: PlatformOptions;
}

export interface PlatformOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  searchMode?: "web" | "enterprise" | "academic";
  includeImages?: boolean;
  includeCitations?: boolean;
}

// ==================== Claude-Specific Types ====================

export interface ClaudeConfig extends PlatformConfig {
  type: "claude";
  options?: ClaudeOptions;
}

export interface ClaudeOptions extends PlatformOptions {
  model?: "claude-3-opus" | "claude-3-sonnet" | "claude-3-haiku" | "claude-3.5-sonnet";
  useArtifacts?: boolean; // Claude's artifacts feature
  systemPrompt?: string;
  thinkingBudget?: number; // For extended thinking
}

export interface ClaudeResponse extends LLMResponse {
  llm: "claude";
  modelVersion: string;
  stopReason?: "end_turn" | "max_tokens" | "stop_sequence";
  artifacts?: ClaudeArtifact[];
  thinkingProcess?: string; // Extended thinking output
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface ClaudeArtifact {
  id: string;
  type: "code" | "text" | "html" | "markdown";
  title: string;
  content: string;
  language?: string;
}

// ==================== Google AI Overviews Types ====================

export interface GoogleAIOverviewsConfig extends PlatformConfig {
  type: "google_ai_overviews";
  options?: GoogleAIOverviewsOptions;
}

export interface GoogleAIOverviewsOptions extends PlatformOptions {
  searchType?: "web" | "local" | "shopping" | "news";
  location?: string; // Geographic location for localized results
  language?: string; // Language code (e.g., "en", "es")
  safeSearch?: "off" | "moderate" | "strict";
  includeSnippets?: boolean;
}

export interface GoogleAIOverviewsResponse extends LLMResponse {
  llm: "google_ai_overviews";
  overview: AIOverview;
  organicResults?: OrganicResult[];
  relatedQuestions?: string[];
  searchInfo?: SearchInfo;
}

export interface AIOverview {
  generated: boolean; // Whether AI overview was shown
  content: string; // The AI-generated overview text
  sources: AIOverviewSource[];
  confidence?: "high" | "medium" | "low";
  disclaimer?: string;
}

export interface AIOverviewSource {
  title: string;
  url: string;
  snippet?: string;
  position: number; // Position in AI overview
  domain: string;
  favicon?: string;
}

export interface OrganicResult {
  position: number;
  title: string;
  url: string;
  domain: string;
  snippet: string;
  date?: string;
  richSnippet?: RichSnippet;
}

export interface RichSnippet {
  type: "faq" | "howto" | "product" | "review" | "recipe";
  data: any;
}

export interface SearchInfo {
  totalResults: number;
  searchTime: number; // seconds
  location?: string;
  language?: string;
}

// ==================== Platform Capabilities ====================

export interface PlatformCapabilities {
  platform: PlatformType;
  features: {
    webSearch: boolean;
    citations: boolean;
    images: boolean;
    codeExecution: boolean;
    artifacts: boolean; // Claude
    aiOverviews: boolean; // Google
    realtime: boolean;
    multimodal: boolean;
  };
  limits: {
    maxTokens: number;
    maxQueries: number; // per request
    rateLimit: string; // e.g., "50/min"
  };
  pricing: {
    perQuery?: number;
    perToken?: number;
    tier: "free" | "paid" | "enterprise";
  };
}

// ==================== Platform Query ====================

export interface PlatformQuery {
  platform: PlatformType;
  query: string;
  config: PlatformConfig;
  metadata?: {
    brand?: string;
    category?: string;
    stage?: "awareness" | "consideration" | "decision";
    location?: string;
  };
}

export interface PlatformQueryResult {
  platform: PlatformType;
  query: string;
  response: LLMResponse | ClaudeResponse | GoogleAIOverviewsResponse;
  executedAt: string;
  duration: number; // milliseconds
  cost?: number; // USD
  error?: string;
}

// ==================== Multi-Platform Scanning ====================

export interface MultiPlatformScan {
  id: string;
  query: string;
  platforms: PlatformType[];
  results: PlatformQueryResult[];
  startedAt: string;
  completedAt?: string;
  status: "running" | "completed" | "partial" | "failed";
  summary: MultiPlatformSummary;
}

export interface MultiPlatformSummary {
  totalPlatforms: number;
  successfulQueries: number;
  failedQueries: number;
  averageResponseTime: number;
  totalCost: number;
  brandMentionRate: number; // % of platforms that mentioned brand
  citationRate: number; // % of platforms that cited brand
  averageSentiment: number; // -100 to 100
}

// ==================== Platform-Specific Parsers ====================

export interface PlatformParser {
  platform: PlatformType;
  parse: (rawResponse: any) => LLMResponse | ClaudeResponse | GoogleAIOverviewsResponse;
  extractBrandMentions: (response: any) => string[];
  extractCitations: (response: any) => Array<{ url: string; title: string }>;
  extractSentiment: (response: any) => "positive" | "neutral" | "negative";
}

// ==================== Platform Analytics ====================

export interface PlatformAnalytics {
  platform: PlatformType;
  period: {
    start: string;
    end: string;
  };
  metrics: {
    totalQueries: number;
    brandMentions: number;
    citationRate: number;
    averagePosition?: number; // For Google AI Overviews
    sentimentBreakdown: {
      positive: number;
      neutral: number;
      negative: number;
    };
    topQueries: Array<{
      query: string;
      mentions: number;
      sentiment: string;
    }>;
  };
  trends: {
    mentionTrend: "increasing" | "stable" | "decreasing";
    citationTrend: "increasing" | "stable" | "decreasing";
    sentimentTrend: "improving" | "stable" | "declining";
  };
}

// ==================== Platform Comparison ====================

export interface PlatformComparison {
  query: string;
  platforms: PlatformComparisonData[];
  winner: PlatformType; // Platform with best brand performance
  insights: string[];
}

export interface PlatformComparisonData {
  platform: PlatformType;
  brandMentioned: boolean;
  cited: boolean;
  position?: number;
  sentiment: "positive" | "neutral" | "negative";
  responseQuality: number; // 0-100
  citationCount: number;
  competitorMentions: string[];
}

// ==================== Platform Health ====================

export interface PlatformHealth {
  platform: PlatformType;
  status: "healthy" | "degraded" | "down";
  lastChecked: string;
  uptime: number; // percentage
  averageLatency: number; // ms
  errorRate: number; // percentage
  incidents: PlatformIncident[];
}

export interface PlatformIncident {
  id: string;
  severity: "critical" | "major" | "minor";
  title: string;
  description: string;
  startedAt: string;
  resolvedAt?: string;
  impact: string;
}

// ==================== Platform Testing ====================

export interface PlatformTestResult {
  platform: PlatformType;
  testQuery: string;
  success: boolean;
  responseTime: number;
  error?: string;
  response?: any;
}
