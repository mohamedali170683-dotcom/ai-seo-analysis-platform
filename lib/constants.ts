/**
 * Application-wide constants to avoid magic numbers and strings throughout the codebase.
 *
 * Usage:
 * import { TIMEOUTS, RETRY_CONFIG, PLATFORMS, SENTIMENT } from '@/lib/constants';
 */

// =============================================================================
// TIMEOUT CONFIGURATION
// =============================================================================

export const TIMEOUTS = {
  /** Default API request timeout (30 seconds) */
  DEFAULT_API: 30000,
  /** OpenAI API timeout (60 seconds) */
  OPENAI_API: 60000,
  /** Gemini API timeout (25 seconds) */
  GEMINI_API: 25000,
  /** Perplexity API timeout (20 seconds) */
  PERPLEXITY_API: 20000,
  /** Website crawling timeout (10 seconds) */
  CRAWL_DEFAULT: 10000,
  /** Quick fetch timeout (5 seconds) */
  QUICK_FETCH: 5000,
  /** Extended fetch timeout (8 seconds) */
  EXTENDED_FETCH: 8000,
  /** Ahrefs API timeout (10 seconds) */
  AHREFS_API: 10000,
  /** DataForSEO API timeout (15 seconds) */
  DATAFORSEO_API: 15000,
  /** Google Autocomplete timeout (5 seconds) */
  GOOGLE_AUTOCOMPLETE: 5000,
} as const;

// =============================================================================
// RETRY CONFIGURATION
// =============================================================================

export const RETRY_CONFIG = {
  /** Default maximum retry attempts */
  MAX_RETRIES: 3,
  /** Default delay between retries (1 second) */
  DEFAULT_DELAY_MS: 1000,
  /** Webhook retry delays in seconds [1min, 5min, 15min] */
  WEBHOOK_DELAYS: [60, 300, 900],
  /** Backoff multiplier for exponential backoff */
  BACKOFF_MULTIPLIER: 2,
  /** Rate limit delay (1 second) */
  RATE_LIMIT_DELAY_MS: 1000,
} as const;

// =============================================================================
// PAGINATION
// =============================================================================

export const PAGINATION = {
  /** Default page size for list endpoints */
  DEFAULT_PAGE_SIZE: 20,
  /** Maximum page size allowed */
  MAX_PAGE_SIZE: 100,
  /** Default page number */
  DEFAULT_PAGE: 1,
} as const;

// =============================================================================
// CRAWLING LIMITS
// =============================================================================

export const CRAWL_LIMITS = {
  /** Default maximum pages to crawl */
  MAX_PAGES_DEFAULT: 15,
  /** Maximum pages for deep crawl */
  MAX_PAGES_DEEP: 50,
  /** Maximum content length to analyze */
  MAX_CONTENT_LENGTH: 10000,
  /** Maximum snippet length */
  MAX_SNIPPET_LENGTH: 500,
} as const;

// =============================================================================
// PLATFORM IDENTIFIERS
// =============================================================================

export const PLATFORMS = {
  CHATGPT: 'chatgpt',
  GEMINI: 'gemini',
  PERPLEXITY: 'perplexity',
  COPILOT: 'copilot',
  CLAUDE: 'claude',
} as const;

export type Platform = typeof PLATFORMS[keyof typeof PLATFORMS];

// =============================================================================
// SENTIMENT VALUES
// =============================================================================

export const SENTIMENT = {
  POSITIVE: 'positive',
  NEUTRAL: 'neutral',
  NEGATIVE: 'negative',
} as const;

export type Sentiment = typeof SENTIMENT[keyof typeof SENTIMENT];

// =============================================================================
// SEARCH INTENT TYPES
// =============================================================================

export const SEARCH_INTENT = {
  INFORMATIONAL: 'informational',
  COMMERCIAL: 'commercial',
  TRANSACTIONAL: 'transactional',
  NAVIGATIONAL: 'navigational',
} as const;

export type SearchIntent = typeof SEARCH_INTENT[keyof typeof SEARCH_INTENT];

// =============================================================================
// BUYER JOURNEY STAGES
// =============================================================================

export const BUYER_STAGE = {
  AWARENESS: 'awareness',
  CONSIDERATION: 'consideration',
  DECISION: 'decision',
} as const;

export type BuyerStage = typeof BUYER_STAGE[keyof typeof BUYER_STAGE];

// =============================================================================
// PRIORITY LEVELS
// =============================================================================

export const PRIORITY = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const;

export type Priority = typeof PRIORITY[keyof typeof PRIORITY];

// =============================================================================
// RECOMMENDATION CATEGORIES
// =============================================================================

export const RECOMMENDATION_CATEGORY = {
  CONTENT_GAP: 'content_gap',
  CONTENT_OPTIMIZATION: 'content_optimization',
  TECHNICAL: 'technical',
  AUTHORITY: 'authority',
  COMPETITIVE: 'competitive',
} as const;

export type RecommendationCategory = typeof RECOMMENDATION_CATEGORY[keyof typeof RECOMMENDATION_CATEGORY];

// =============================================================================
// TREND DIRECTIONS
// =============================================================================

export const TREND = {
  UP: 'up',
  DOWN: 'down',
  STABLE: 'stable',
} as const;

export type Trend = typeof TREND[keyof typeof TREND];

// =============================================================================
// ALERT TYPES
// =============================================================================

export const ALERT_TYPE = {
  VISIBILITY_DROP: 'visibility_drop',
  COMPETITOR_TAKEOVER: 'competitor_takeover',
  HALLUCINATION_DETECTED: 'hallucination_detected',
  SENTIMENT_SHIFT: 'sentiment_shift',
  CITATION_LOST: 'citation_lost',
} as const;

export type AlertType = typeof ALERT_TYPE[keyof typeof ALERT_TYPE];

// =============================================================================
// HTTP STATUS CODES
// =============================================================================

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// =============================================================================
// SCORE THRESHOLDS
// =============================================================================

export const SCORE_THRESHOLDS = {
  /** Minimum score to be considered "good" */
  GOOD: 70,
  /** Minimum score to be considered "moderate" */
  MODERATE: 40,
  /** Scores below this are "poor" */
  POOR: 40,
} as const;

// =============================================================================
// RATE LIMITING
// =============================================================================

export const RATE_LIMITS = {
  /** Requests per minute for free tier */
  FREE_TIER_RPM: 10,
  /** Requests per minute for pro tier */
  PRO_TIER_RPM: 60,
  /** Requests per minute for enterprise tier */
  ENTERPRISE_TIER_RPM: 300,
  /** Window size in milliseconds (1 minute) */
  WINDOW_MS: 60000,
} as const;

// =============================================================================
// CACHE DURATIONS (in seconds)
// =============================================================================

export const CACHE_DURATION = {
  /** Short cache (5 minutes) */
  SHORT: 300,
  /** Medium cache (1 hour) */
  MEDIUM: 3600,
  /** Long cache (24 hours) */
  LONG: 86400,
  /** Analysis results cache (4 hours) */
  ANALYSIS: 14400,
} as const;

// =============================================================================
// VALIDATION LIMITS
// =============================================================================

export const VALIDATION = {
  /** Maximum brand name length */
  MAX_BRAND_LENGTH: 100,
  /** Maximum competitor name length */
  MAX_COMPETITOR_LENGTH: 100,
  /** Maximum URL length */
  MAX_URL_LENGTH: 2048,
  /** Maximum competitors per analysis */
  MAX_COMPETITORS: 10,
  /** Minimum brand name length */
  MIN_BRAND_LENGTH: 1,
} as const;
