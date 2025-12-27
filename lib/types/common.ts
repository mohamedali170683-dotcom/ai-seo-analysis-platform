/**
 * Common TypeScript types used throughout the application.
 *
 * These types help reduce `any` usage and improve type safety.
 */

// =============================================================================
// GENERIC UTILITY TYPES
// =============================================================================

/**
 * JSON-serializable value (use instead of `any` for JSON data)
 */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

/**
 * JSON object type
 */
export type JsonObject = { [key: string]: JsonValue };

/**
 * Record with string keys and unknown values (safer than Record<string, any>)
 */
export type StringRecord = Record<string, unknown>;

/**
 * Nullable type helper
 */
export type Nullable<T> = T | null;

/**
 * Optional type helper
 */
export type Optional<T> = T | undefined;

/**
 * Make specific properties optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Make specific properties required
 */
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// =============================================================================
// AI PLATFORM TYPES
// =============================================================================

/**
 * Supported AI platforms
 */
export type AIPlatform = 'chatgpt' | 'gemini' | 'perplexity' | 'copilot' | 'claude';

/**
 * AI response source
 */
export interface AISource {
  url: string;
  title?: string;
  domain?: string;
  snippet?: string;
  position?: number;
  brandMentioned?: boolean;
  brandMentionCount?: number;
  hasBacklink?: boolean;
  backlinkUrls?: string[];
  scrapedAt?: string;
}

/**
 * AI platform response
 */
export interface AIResponse {
  platform: AIPlatform;
  question: string;
  fullResponse: string;
  brandMentioned: boolean;
  brandPosition?: number;
  sentiment?: 'positive' | 'neutral' | 'negative';
  contextExtract?: string;
  citedUrls?: string[];
  sources?: AISource[];
  hasGrounding?: boolean;
  isRealAPI?: boolean;
  error?: string;
}

/**
 * Platform query result
 */
export interface PlatformQueryResult {
  platform: AIPlatform;
  responses: AIResponse[];
  error?: string;
}

// =============================================================================
// SCORING TYPES
// =============================================================================

/**
 * Sentiment type
 */
export type Sentiment = 'positive' | 'neutral' | 'negative';

/**
 * Trend direction
 */
export type TrendDirection = 'up' | 'down' | 'stable';

/**
 * Score with breakdown
 */
export interface Score {
  value: number;
  max: number;
  percentage: number;
  breakdown?: ScoreBreakdown[];
}

/**
 * Score breakdown item
 */
export interface ScoreBreakdown {
  name: string;
  value: number;
  weight: number;
  contribution: number;
}

// =============================================================================
// BUYER JOURNEY TYPES
// =============================================================================

/**
 * Buyer journey stage
 */
export type BuyerStage = 'awareness' | 'consideration' | 'decision';

/**
 * Stage portrayal data
 */
export interface StagePortrayal {
  totalTests: number;
  mentionRate: number;
  avgPosition?: number;
  sentimentBreakdown: Record<Sentiment, number>;
  competitorComparison?: CompetitorComparison[];
}

/**
 * Competitor comparison data
 */
export interface CompetitorComparison {
  competitor?: string;
  competitorName?: string;
  name?: string;
  avgPosition: number;
  mentionRate?: number;
  sentiment?: Sentiment;
}

// =============================================================================
// ANALYSIS TYPES
// =============================================================================

/**
 * Analysis status
 */
export type AnalysisStatus = 'pending' | 'running' | 'completed' | 'failed';

/**
 * Analysis configuration
 */
export interface AnalysisConfig {
  brandName: string;
  domain?: string;
  competitors: string[];
  category?: string;
  subcategory?: string;
  persona?: string;
  testsPerPlatform?: number;
  questionsPerStage?: number;
}

/**
 * Analysis progress callback
 */
export type ProgressCallback = (progress: number, step: string) => void | Promise<void>;

// =============================================================================
// HTTP/FETCH TYPES
// =============================================================================

/**
 * Fetch options with typed headers
 */
export interface FetchOptions extends Omit<RequestInit, 'body'> {
  body?: string | FormData | URLSearchParams;
  timeout?: number;
}

/**
 * HTTP method type
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// =============================================================================
// EVENT TYPES
// =============================================================================

/**
 * Generic event handler type
 */
export type EventHandler<T = void> = (event: T) => void | Promise<void>;

/**
 * Cleanup function returned by subscriptions
 */
export type Unsubscribe = () => void;

// =============================================================================
// FUNCTION TYPES
// =============================================================================

/**
 * Async function type
 */
export type AsyncFunction<T = void, Args extends unknown[] = []> = (
  ...args: Args
) => Promise<T>;

/**
 * Retry options
 */
export interface RetryOptions {
  maxRetries: number;
  delayMs: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: Error, attempt: number) => boolean;
}
