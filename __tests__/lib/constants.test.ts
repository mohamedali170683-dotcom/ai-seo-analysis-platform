/**
 * Tests for application constants
 */

import {
  TIMEOUTS,
  RETRY_CONFIG,
  PAGINATION,
  PLATFORMS,
  SENTIMENT,
  SEARCH_INTENT,
  BUYER_STAGE,
  PRIORITY,
  ALERT_TYPE,
  HTTP_STATUS,
  SCORE_THRESHOLDS,
  VALIDATION,
} from '@/lib/constants';

describe('Constants', () => {
  describe('TIMEOUTS', () => {
    it('should have reasonable timeout values', () => {
      // All timeouts should be positive numbers
      Object.values(TIMEOUTS).forEach((value) => {
        expect(typeof value).toBe('number');
        expect(value).toBeGreaterThan(0);
      });

      // Specific sanity checks
      expect(TIMEOUTS.DEFAULT_API).toBe(30000);
      expect(TIMEOUTS.OPENAI_API).toBe(60000);
      expect(TIMEOUTS.QUICK_FETCH).toBeLessThan(TIMEOUTS.DEFAULT_API);
    });
  });

  describe('RETRY_CONFIG', () => {
    it('should have valid retry configuration', () => {
      expect(RETRY_CONFIG.MAX_RETRIES).toBeGreaterThan(0);
      expect(RETRY_CONFIG.DEFAULT_DELAY_MS).toBeGreaterThan(0);
      expect(RETRY_CONFIG.BACKOFF_MULTIPLIER).toBeGreaterThan(1);
      expect(RETRY_CONFIG.WEBHOOK_DELAYS).toHaveLength(3);
    });
  });

  describe('PAGINATION', () => {
    it('should have sensible pagination defaults', () => {
      expect(PAGINATION.DEFAULT_PAGE_SIZE).toBeGreaterThan(0);
      expect(PAGINATION.MAX_PAGE_SIZE).toBeGreaterThan(PAGINATION.DEFAULT_PAGE_SIZE);
      expect(PAGINATION.DEFAULT_PAGE).toBe(1);
    });
  });

  describe('PLATFORMS', () => {
    it('should include all supported platforms', () => {
      expect(PLATFORMS.CHATGPT).toBe('chatgpt');
      expect(PLATFORMS.GEMINI).toBe('gemini');
      expect(PLATFORMS.PERPLEXITY).toBe('perplexity');
      expect(PLATFORMS.COPILOT).toBe('copilot');
      expect(PLATFORMS.CLAUDE).toBe('claude');
    });
  });

  describe('SENTIMENT', () => {
    it('should have all sentiment values', () => {
      expect(SENTIMENT.POSITIVE).toBe('positive');
      expect(SENTIMENT.NEUTRAL).toBe('neutral');
      expect(SENTIMENT.NEGATIVE).toBe('negative');
    });
  });

  describe('SEARCH_INTENT', () => {
    it('should have all search intent types', () => {
      expect(SEARCH_INTENT.INFORMATIONAL).toBe('informational');
      expect(SEARCH_INTENT.COMMERCIAL).toBe('commercial');
      expect(SEARCH_INTENT.TRANSACTIONAL).toBe('transactional');
      expect(SEARCH_INTENT.NAVIGATIONAL).toBe('navigational');
    });
  });

  describe('BUYER_STAGE', () => {
    it('should have all buyer journey stages', () => {
      expect(BUYER_STAGE.AWARENESS).toBe('awareness');
      expect(BUYER_STAGE.CONSIDERATION).toBe('consideration');
      expect(BUYER_STAGE.DECISION).toBe('decision');
    });
  });

  describe('PRIORITY', () => {
    it('should have all priority levels', () => {
      expect(PRIORITY.HIGH).toBe('high');
      expect(PRIORITY.MEDIUM).toBe('medium');
      expect(PRIORITY.LOW).toBe('low');
    });
  });

  describe('ALERT_TYPE', () => {
    it('should have all alert types', () => {
      expect(ALERT_TYPE.VISIBILITY_DROP).toBeDefined();
      expect(ALERT_TYPE.COMPETITOR_TAKEOVER).toBeDefined();
      expect(ALERT_TYPE.HALLUCINATION_DETECTED).toBeDefined();
      expect(ALERT_TYPE.SENTIMENT_SHIFT).toBeDefined();
      expect(ALERT_TYPE.CITATION_LOST).toBeDefined();
    });
  });

  describe('HTTP_STATUS', () => {
    it('should have correct HTTP status codes', () => {
      expect(HTTP_STATUS.OK).toBe(200);
      expect(HTTP_STATUS.CREATED).toBe(201);
      expect(HTTP_STATUS.BAD_REQUEST).toBe(400);
      expect(HTTP_STATUS.UNAUTHORIZED).toBe(401);
      expect(HTTP_STATUS.NOT_FOUND).toBe(404);
      expect(HTTP_STATUS.TOO_MANY_REQUESTS).toBe(429);
      expect(HTTP_STATUS.INTERNAL_ERROR).toBe(500);
    });
  });

  describe('SCORE_THRESHOLDS', () => {
    it('should have logical score thresholds', () => {
      expect(SCORE_THRESHOLDS.GOOD).toBeGreaterThan(SCORE_THRESHOLDS.MODERATE);
      expect(SCORE_THRESHOLDS.MODERATE).toBe(SCORE_THRESHOLDS.POOR);
    });
  });

  describe('VALIDATION', () => {
    it('should have sensible validation limits', () => {
      expect(VALIDATION.MAX_BRAND_LENGTH).toBeGreaterThan(0);
      expect(VALIDATION.MAX_URL_LENGTH).toBe(2048);
      expect(VALIDATION.MAX_COMPETITORS).toBeGreaterThan(0);
      expect(VALIDATION.MIN_BRAND_LENGTH).toBe(1);
    });
  });
});
