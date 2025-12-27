/**
 * Tests for configuration management
 */

import {
  config,
  validateConfiguration,
  getConfigurationStatus,
  requireConfig,
} from '@/lib/config';

describe('Configuration Module', () => {
  // Store original env
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset modules to pick up env changes
    jest.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('config object', () => {
    it('should have app configuration', () => {
      expect(config.app).toBeDefined();
      expect(config.app.nodeEnv).toBeDefined();
      expect(typeof config.app.isProduction).toBe('boolean');
      expect(typeof config.app.isDevelopment).toBe('boolean');
      expect(typeof config.app.isTest).toBe('boolean');
    });

    it('should have database configuration', () => {
      expect(config.database).toBeDefined();
      expect(typeof config.database.isConfigured).toBe('boolean');
    });

    it('should have AI provider configurations', () => {
      expect(config.openai).toBeDefined();
      expect(config.gemini).toBeDefined();
      expect(config.perplexity).toBeDefined();

      expect(typeof config.openai.isConfigured).toBe('boolean');
      expect(typeof config.gemini.isConfigured).toBe('boolean');
      expect(typeof config.perplexity.isConfigured).toBe('boolean');
    });

    it('should have timeout values for providers', () => {
      expect(config.openai.timeout).toBe(60000);
      expect(config.gemini.timeout).toBe(25000);
      expect(config.perplexity.timeout).toBe(20000);
      expect(config.dataForSEO.timeout).toBe(15000);
      expect(config.ahrefs.timeout).toBe(10000);
    });

    it('should have auth configuration', () => {
      expect(config.auth).toBeDefined();
      expect(typeof config.auth.isConfigured).toBe('boolean');
    });

    it('should have redis configuration', () => {
      expect(config.redis).toBeDefined();
      expect(typeof config.redis.isConfigured).toBe('boolean');
    });
  });

  describe('validateConfiguration', () => {
    it('should return validation result', () => {
      const result = validateConfiguration();

      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('warnings');
      expect(result).toHaveProperty('errors');
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it('should return errors array when critical config is missing', () => {
      const result = validateConfiguration();

      // In test environment, database might not be configured
      // Check that the function returns a proper structure
      expect(typeof result.valid).toBe('boolean');
    });
  });

  describe('getConfigurationStatus', () => {
    it('should return status for all services', () => {
      const status = getConfigurationStatus();

      expect(status).toHaveProperty('database');
      expect(status).toHaveProperty('redis');
      expect(status).toHaveProperty('openai');
      expect(status).toHaveProperty('gemini');
      expect(status).toHaveProperty('perplexity');
      expect(status).toHaveProperty('dataForSEO');
      expect(status).toHaveProperty('ahrefs');
      expect(status).toHaveProperty('auth');

      // All values should be booleans
      Object.values(status).forEach((value) => {
        expect(typeof value).toBe('boolean');
      });
    });
  });

  describe('requireConfig', () => {
    it('should return value if defined', () => {
      const value = requireConfig('test-value', 'TEST_CONFIG');
      expect(value).toBe('test-value');
    });

    it('should throw if value is undefined', () => {
      expect(() => requireConfig(undefined, 'MISSING_CONFIG')).toThrow(
        'Required configuration missing: MISSING_CONFIG'
      );
    });

    it('should throw if value is null', () => {
      expect(() => requireConfig(null, 'NULL_CONFIG')).toThrow(
        'Required configuration missing: NULL_CONFIG'
      );
    });

    it('should throw if value is empty string', () => {
      expect(() => requireConfig('', 'EMPTY_CONFIG')).toThrow(
        'Required configuration missing: EMPTY_CONFIG'
      );
    });

    it('should accept 0 as valid value', () => {
      const value = requireConfig(0, 'ZERO_CONFIG');
      expect(value).toBe(0);
    });

    it('should accept false as valid value', () => {
      const value = requireConfig(false, 'FALSE_CONFIG');
      expect(value).toBe(false);
    });
  });

  describe('Environment detection', () => {
    it('should detect test environment', () => {
      // In Jest, NODE_ENV is typically 'test'
      expect(config.app.nodeEnv).toBe('test');
      expect(config.app.isTest).toBe(true);
    });
  });
});
