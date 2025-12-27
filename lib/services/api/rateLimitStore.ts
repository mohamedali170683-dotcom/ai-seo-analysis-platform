/**
 * Rate Limit Storage Abstraction
 *
 * Provides a unified interface for rate limit storage that can be backed by:
 * - In-memory Map (development/testing)
 * - Redis (production)
 *
 * Usage:
 * import { getRateLimitStore } from '@/lib/services/api/rateLimitStore';
 *
 * const store = getRateLimitStore();
 * await store.increment('user:123', 60); // 60 second window
 */

import { logger } from '@/lib/utils/logger';

// =============================================================================
// TYPES
// =============================================================================

export interface RateLimitEntry {
  count: number;
  resetAt: number; // Unix timestamp in milliseconds
}

export interface RateLimitStoreInterface {
  /**
   * Get current rate limit entry for a key
   */
  get(key: string): Promise<RateLimitEntry | null>;

  /**
   * Increment the counter for a key with specified window
   * Returns the new count and reset time
   */
  increment(key: string, windowSeconds: number): Promise<RateLimitEntry>;

  /**
   * Reset/delete a rate limit entry
   */
  reset(key: string): Promise<void>;

  /**
   * Check if rate limit is exceeded
   */
  isExceeded(key: string, limit: number): Promise<boolean>;

  /**
   * Get remaining requests before limit
   */
  getRemaining(key: string, limit: number): Promise<number>;

  /**
   * Cleanup expired entries (for memory store)
   */
  cleanup(): Promise<number>;

  /**
   * Get store type identifier
   */
  getType(): 'memory' | 'redis';
}

// =============================================================================
// IN-MEMORY STORE
// =============================================================================

/**
 * In-memory rate limit store for development and testing.
 * Note: This will not work correctly in serverless environments with multiple instances.
 */
class InMemoryRateLimitStore implements RateLimitStoreInterface {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Auto-cleanup every 5 minutes
    if (typeof setInterval !== 'undefined') {
      this.cleanupInterval = setInterval(() => {
        this.cleanup().catch((err) => {
          logger.error('Rate limit cleanup failed', err);
        });
      }, 5 * 60 * 1000);
    }
  }

  async get(key: string): Promise<RateLimitEntry | null> {
    const entry = this.store.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() >= entry.resetAt) {
      this.store.delete(key);
      return null;
    }

    return entry;
  }

  async increment(key: string, windowSeconds: number): Promise<RateLimitEntry> {
    const now = Date.now();
    const existing = await this.get(key);

    if (existing) {
      // Increment existing counter
      existing.count++;
      this.store.set(key, existing);
      return existing;
    }

    // Create new entry
    const entry: RateLimitEntry = {
      count: 1,
      resetAt: now + windowSeconds * 1000,
    };
    this.store.set(key, entry);
    return entry;
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key);
  }

  async isExceeded(key: string, limit: number): Promise<boolean> {
    const entry = await this.get(key);
    return entry !== null && entry.count >= limit;
  }

  async getRemaining(key: string, limit: number): Promise<number> {
    const entry = await this.get(key);
    if (!entry) return limit;
    return Math.max(0, limit - entry.count);
  }

  async cleanup(): Promise<number> {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.store.entries()) {
      if (now >= entry.resetAt) {
        this.store.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug(`Cleaned up ${cleaned} expired rate limit entries`);
    }

    return cleaned;
  }

  getType(): 'memory' | 'redis' {
    return 'memory';
  }

  /**
   * Get store size (for monitoring)
   */
  size(): number {
    return this.store.size;
  }

  /**
   * Destroy the store and cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
  }
}

// =============================================================================
// REDIS STORE (STUB)
// =============================================================================

/**
 * Redis-based rate limit store for production.
 * Uses Redis MULTI/EXEC for atomic operations.
 *
 * To enable:
 * 1. Set REDIS_URL environment variable
 * 2. The store will automatically use Redis when available
 */
class RedisRateLimitStore implements RateLimitStoreInterface {
  private redis: unknown; // Will be ioredis client
  private prefix = 'ratelimit:';

  constructor(redisClient: unknown) {
    this.redis = redisClient;
  }

  async get(key: string): Promise<RateLimitEntry | null> {
    const redis = this.redis as {
      get: (key: string) => Promise<string | null>;
      ttl: (key: string) => Promise<number>;
    };

    const fullKey = this.prefix + key;
    const [countStr, ttl] = await Promise.all([
      redis.get(fullKey),
      redis.ttl(fullKey),
    ]);

    if (!countStr || ttl <= 0) return null;

    return {
      count: parseInt(countStr, 10),
      resetAt: Date.now() + ttl * 1000,
    };
  }

  async increment(key: string, windowSeconds: number): Promise<RateLimitEntry> {
    const redis = this.redis as {
      multi: () => {
        incr: (key: string) => unknown;
        expire: (key: string, seconds: number, mode: string) => unknown;
        ttl: (key: string) => unknown;
        exec: () => Promise<[Error | null, unknown][]>;
      };
    };

    const fullKey = this.prefix + key;

    // Use MULTI for atomic increment + expire
    const results = await redis
      .multi()
      .incr(fullKey)
      .expire(fullKey, windowSeconds, 'NX') // Only set expire if not exists
      .ttl(fullKey)
      .exec();

    if (!results) {
      throw new Error('Redis MULTI/EXEC failed');
    }

    const count = results[0][1] as number;
    const ttl = results[2][1] as number;

    return {
      count,
      resetAt: Date.now() + ttl * 1000,
    };
  }

  async reset(key: string): Promise<void> {
    const redis = this.redis as { del: (key: string) => Promise<number> };
    await redis.del(this.prefix + key);
  }

  async isExceeded(key: string, limit: number): Promise<boolean> {
    const entry = await this.get(key);
    return entry !== null && entry.count >= limit;
  }

  async getRemaining(key: string, limit: number): Promise<number> {
    const entry = await this.get(key);
    if (!entry) return limit;
    return Math.max(0, limit - entry.count);
  }

  async cleanup(): Promise<number> {
    // Redis handles TTL-based cleanup automatically
    return 0;
  }

  getType(): 'memory' | 'redis' {
    return 'redis';
  }
}

// =============================================================================
// FACTORY
// =============================================================================

let storeInstance: RateLimitStoreInterface | null = null;

/**
 * Get the rate limit store instance.
 * Automatically uses Redis if REDIS_URL is set, otherwise falls back to in-memory.
 */
export function getRateLimitStore(): RateLimitStoreInterface {
  if (storeInstance) {
    return storeInstance;
  }

  const redisUrl = process.env.REDIS_URL;

  if (redisUrl) {
    try {
      // Dynamic import of ioredis to avoid bundling if not used
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Redis = require('ioredis');
      const client = new Redis(redisUrl);
      storeInstance = new RedisRateLimitStore(client);
      logger.info('Using Redis rate limit store');
    } catch (error) {
      logger.warn('Failed to initialize Redis, falling back to in-memory store', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      storeInstance = new InMemoryRateLimitStore();
    }
  } else {
    logger.debug('Using in-memory rate limit store (set REDIS_URL for production)');
    storeInstance = new InMemoryRateLimitStore();
  }

  return storeInstance;
}

/**
 * Reset the store instance (for testing)
 */
export function resetRateLimitStore(): void {
  if (storeInstance && storeInstance.getType() === 'memory') {
    (storeInstance as InMemoryRateLimitStore).destroy();
  }
  storeInstance = null;
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Simple rate limit check for API routes
 *
 * @example
 * const result = await checkSimpleRateLimit('user:123', 100, 60);
 * if (result.exceeded) {
 *   return new Response('Too Many Requests', {
 *     status: 429,
 *     headers: { 'Retry-After': String(result.retryAfter) }
 *   });
 * }
 */
export async function checkSimpleRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<{
  exceeded: boolean;
  remaining: number;
  resetAt: number;
  retryAfter: number;
}> {
  const store = getRateLimitStore();

  // Check current state before incrementing
  const isExceeded = await store.isExceeded(key, limit);

  if (isExceeded) {
    const entry = await store.get(key);
    const resetAt = entry?.resetAt ?? Date.now() + windowSeconds * 1000;
    const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);

    return {
      exceeded: true,
      remaining: 0,
      resetAt,
      retryAfter: Math.max(0, retryAfter),
    };
  }

  // Increment counter
  const entry = await store.increment(key, windowSeconds);

  // Check if this increment exceeded the limit
  const exceeded = entry.count > limit;
  const remaining = Math.max(0, limit - entry.count);
  const retryAfter = exceeded ? Math.ceil((entry.resetAt - Date.now()) / 1000) : 0;

  return {
    exceeded,
    remaining,
    resetAt: entry.resetAt,
    retryAfter: Math.max(0, retryAfter),
  };
}

/**
 * Create rate limit headers for response
 */
export function createRateLimitHeaders(
  limit: number,
  remaining: number,
  resetAt: number
): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(limit),
    'X-RateLimit-Remaining': String(remaining),
    'X-RateLimit-Reset': String(Math.ceil(resetAt / 1000)),
  };
}
