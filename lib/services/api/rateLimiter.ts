/**
 * Rate Limiter
 *
 * Handles API rate limiting using sliding window algorithm
 */

import type {
  RateLimit,
  RateLimitBucket,
  RateLimitCounter,
  RateLimitExceeded
} from "@/lib/types/api";

/**
 * In-memory rate limit store
 * In production, use Redis for distributed rate limiting
 */
const rateLimitStore = new Map<string, RateLimitBucket>();

/**
 * Check rate limit for API key
 */
export function checkRateLimit(
  userId: string,
  apiKeyId: string,
  limits: RateLimit
): RateLimitExceeded {
  const key = `${userId}:${apiKeyId}`;
  const now = new Date();

  // Get or create bucket
  let bucket = rateLimitStore.get(key);
  if (!bucket) {
    bucket = createBucket(userId, apiKeyId);
    rateLimitStore.set(key, bucket);
  }

  // Check minute limit
  const minuteCheck = checkWindow(bucket.minute, limits.requestsPerMinute, now, 60);
  if (minuteCheck.exceeded) {
    return minuteCheck;
  }

  // Check hour limit
  const hourCheck = checkWindow(bucket.hour, limits.requestsPerHour, now, 3600);
  if (hourCheck.exceeded) {
    return hourCheck;
  }

  // Check day limit
  const dayCheck = checkWindow(bucket.day, limits.requestsPerDay, now, 86400);
  if (dayCheck.exceeded) {
    return dayCheck;
  }

  // Increment counters
  incrementCounter(bucket.minute, now, 60);
  incrementCounter(bucket.hour, now, 3600);
  incrementCounter(bucket.day, now, 86400);

  // Update store
  rateLimitStore.set(key, bucket);

  // Return remaining limits (use most restrictive)
  const remaining = Math.min(
    limits.requestsPerMinute - bucket.minute.count,
    limits.requestsPerHour - bucket.hour.count,
    limits.requestsPerDay - bucket.day.count
  );

  return {
    exceeded: false,
    limit: limits.requestsPerMinute,
    current: bucket.minute.count,
    resetAt: bucket.minute.resetAt,
    retryAfter: 0
  };
}

/**
 * Check if window limit is exceeded
 */
function checkWindow(
  counter: RateLimitCounter,
  limit: number,
  now: Date,
  windowSeconds: number
): RateLimitExceeded {
  // Reset counter if window expired
  if (new Date(counter.resetAt) <= now) {
    counter.count = 0;
    const resetAt = new Date(now.getTime() + windowSeconds * 1000);
    counter.resetAt = resetAt.toISOString();
  }

  // Check if limit exceeded
  if (counter.count >= limit) {
    const resetAt = new Date(counter.resetAt);
    const retryAfter = Math.ceil((resetAt.getTime() - now.getTime()) / 1000);

    return {
      exceeded: true,
      limit,
      current: counter.count,
      resetAt: counter.resetAt,
      retryAfter
    };
  }

  return {
    exceeded: false,
    limit,
    current: counter.count,
    resetAt: counter.resetAt,
    retryAfter: 0
  };
}

/**
 * Increment counter
 */
function incrementCounter(counter: RateLimitCounter, now: Date, windowSeconds: number): void {
  // Reset if window expired
  if (new Date(counter.resetAt) <= now) {
    counter.count = 0;
    const resetAt = new Date(now.getTime() + windowSeconds * 1000);
    counter.resetAt = resetAt.toISOString();
  }

  counter.count++;
}

/**
 * Create new rate limit bucket
 */
function createBucket(userId: string, apiKeyId: string): RateLimitBucket {
  const now = new Date();

  return {
    userId,
    apiKeyId,
    minute: createCounter(now, 60),
    hour: createCounter(now, 3600),
    day: createCounter(now, 86400)
  };
}

/**
 * Create counter for time window
 */
function createCounter(now: Date, windowSeconds: number): RateLimitCounter {
  const resetAt = new Date(now.getTime() + windowSeconds * 1000);

  return {
    count: 0,
    resetAt: resetAt.toISOString()
  };
}

/**
 * Get rate limit info for API key
 */
export function getRateLimitInfo(
  userId: string,
  apiKeyId: string,
  limits: RateLimit
): {
  minute: { used: number; limit: number; remaining: number; resetAt: string };
  hour: { used: number; limit: number; remaining: number; resetAt: string };
  day: { used: number; limit: number; remaining: number; resetAt: string };
} {
  const key = `${userId}:${apiKeyId}`;
  const bucket = rateLimitStore.get(key);

  if (!bucket) {
    const now = new Date();
    return {
      minute: {
        used: 0,
        limit: limits.requestsPerMinute,
        remaining: limits.requestsPerMinute,
        resetAt: new Date(now.getTime() + 60000).toISOString()
      },
      hour: {
        used: 0,
        limit: limits.requestsPerHour,
        remaining: limits.requestsPerHour,
        resetAt: new Date(now.getTime() + 3600000).toISOString()
      },
      day: {
        used: 0,
        limit: limits.requestsPerDay,
        remaining: limits.requestsPerDay,
        resetAt: new Date(now.getTime() + 86400000).toISOString()
      }
    };
  }

  return {
    minute: {
      used: bucket.minute.count,
      limit: limits.requestsPerMinute,
      remaining: Math.max(0, limits.requestsPerMinute - bucket.minute.count),
      resetAt: bucket.minute.resetAt
    },
    hour: {
      used: bucket.hour.count,
      limit: limits.requestsPerHour,
      remaining: Math.max(0, limits.requestsPerHour - bucket.hour.count),
      resetAt: bucket.hour.resetAt
    },
    day: {
      used: bucket.day.count,
      limit: limits.requestsPerDay,
      remaining: Math.max(0, limits.requestsPerDay - bucket.day.count),
      resetAt: bucket.day.resetAt
    }
  };
}

/**
 * Reset rate limit for API key
 */
export function resetRateLimit(userId: string, apiKeyId: string): void {
  const key = `${userId}:${apiKeyId}`;
  rateLimitStore.delete(key);
}

/**
 * Get default rate limits by tier
 */
export function getDefaultRateLimits(tier: "free" | "starter" | "pro" | "enterprise"): RateLimit {
  const limits: Record<string, RateLimit> = {
    free: {
      requestsPerMinute: 10,
      requestsPerHour: 100,
      requestsPerDay: 1000
    },
    starter: {
      requestsPerMinute: 30,
      requestsPerHour: 500,
      requestsPerDay: 10000
    },
    pro: {
      requestsPerMinute: 100,
      requestsPerHour: 2000,
      requestsPerDay: 50000
    },
    enterprise: {
      requestsPerMinute: 1000,
      requestsPerHour: 20000,
      requestsPerDay: 1000000
    }
  };

  return limits[tier] || limits.free;
}

/**
 * Cleanup expired buckets
 */
export function cleanupExpiredBuckets(): number {
  const now = new Date();
  let cleaned = 0;

  for (const [key, bucket] of rateLimitStore.entries()) {
    // If all windows have expired, remove bucket
    const minuteExpired = new Date(bucket.minute.resetAt) <= now;
    const hourExpired = new Date(bucket.hour.resetAt) <= now;
    const dayExpired = new Date(bucket.day.resetAt) <= now;

    if (minuteExpired && hourExpired && dayExpired && bucket.minute.count === 0) {
      rateLimitStore.delete(key);
      cleaned++;
    }
  }

  return cleaned;
}

/**
 * Get total buckets in memory
 */
export function getBucketCount(): number {
  return rateLimitStore.size;
}

/**
 * Clear all rate limits (for testing)
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear();
}

/**
 * Get rate limit statistics
 */
export function getRateLimitStats(): {
  totalBuckets: number;
  bucketsAbove50Percent: number;
  bucketsAbove80Percent: number;
  bucketsAtLimit: number;
} {
  let bucketsAbove50 = 0;
  let bucketsAbove80 = 0;
  let bucketsAtLimit = 0;

  for (const bucket of rateLimitStore.values()) {
    // Check minute window
    const minuteUsage = bucket.minute.count;

    // This is approximate since we don't store the limit in the bucket
    // In production, you'd want to store the limit or lookup from API key
    const estimatedLimit = 100; // Assumption

    const usagePercent = (minuteUsage / estimatedLimit) * 100;

    if (usagePercent >= 100) bucketsAtLimit++;
    else if (usagePercent >= 80) bucketsAbove80++;
    else if (usagePercent >= 50) bucketsAbove50++;
  }

  return {
    totalBuckets: rateLimitStore.size,
    bucketsAbove50Percent: bucketsAbove50,
    bucketsAbove80Percent: bucketsAbove80,
    bucketsAtLimit
  };
}

/**
 * Token bucket algorithm (alternative implementation)
 */
export class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  private readonly capacity: number;
  private readonly refillRate: number; // tokens per second

  constructor(capacity: number, refillRate: number) {
    this.capacity = capacity;
    this.refillRate = refillRate;
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  /**
   * Try to consume tokens
   */
  tryConsume(count: number = 1): boolean {
    this.refill();

    if (this.tokens >= count) {
      this.tokens -= count;
      return true;
    }

    return false;
  }

  /**
   * Refill tokens based on time elapsed
   */
  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000; // seconds
    const tokensToAdd = elapsed * this.refillRate;

    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  /**
   * Get remaining tokens
   */
  getRemaining(): number {
    this.refill();
    return Math.floor(this.tokens);
  }

  /**
   * Get time until next token
   */
  getTimeUntilNextToken(): number {
    if (this.tokens >= 1) return 0;
    return (1 / this.refillRate) * 1000; // milliseconds
  }
}
