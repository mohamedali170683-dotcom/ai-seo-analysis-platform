/**
 * Centralized configuration management.
 *
 * This module validates and provides typed access to all configuration values.
 * It validates required environment variables at import time in production.
 *
 * Usage:
 * import { config } from '@/lib/config';
 *
 * const apiKey = config.openai.apiKey;
 * const isProduction = config.app.isProduction;
 */

import { z } from 'zod';
import { logger } from '@/lib/utils/logger';

// =============================================================================
// ENVIRONMENT SCHEMAS
// =============================================================================

/**
 * Required configuration for the application.
 * These will cause warnings/errors if not set.
 */
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database
  POSTGRES_PRISMA_URL: z.string().optional(),
  DATABASE_URL: z.string().optional(),

  // Redis (optional - falls back to in-memory)
  REDIS_URL: z.string().optional(),

  // AI API Keys
  OPENAI_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  PERPLEXITY_API_KEY: z.string().optional(),

  // External Services
  DATAFORSEO_LOGIN: z.string().optional(),
  DATAFORSEO_PASSWORD: z.string().optional(),
  AHREFS_API_KEY: z.string().optional(),

  // Authentication
  AUTH_SECRET: z.string().optional(),
  JWT_SECRET: z.string().optional(),
  ADMIN_PASSWORD: z.string().optional(),

  // Application
  NEXT_PUBLIC_APP_URL: z.string().optional(),
});

type EnvConfig = z.infer<typeof envSchema>;

// =============================================================================
// CONFIGURATION OBJECT
// =============================================================================

function createConfig() {
  // Parse environment variables
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    logger.error('Environment validation failed', undefined, {
      errors: result.error.flatten().fieldErrors,
    });
  }

  const env = result.success ? result.data : (process.env as unknown as EnvConfig);

  return {
    app: {
      nodeEnv: env.NODE_ENV || 'development',
      isProduction: env.NODE_ENV === 'production',
      isDevelopment: env.NODE_ENV === 'development',
      isTest: env.NODE_ENV === 'test',
      url: env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    },

    database: {
      url: env.POSTGRES_PRISMA_URL || env.DATABASE_URL,
      isConfigured: !!(env.POSTGRES_PRISMA_URL || env.DATABASE_URL),
    },

    redis: {
      url: env.REDIS_URL,
      isConfigured: !!env.REDIS_URL,
    },

    openai: {
      apiKey: env.OPENAI_API_KEY,
      isConfigured: !!env.OPENAI_API_KEY,
      timeout: 60000,
      maxRetries: 1,
    },

    gemini: {
      apiKey: env.GEMINI_API_KEY,
      isConfigured: !!env.GEMINI_API_KEY,
      timeout: 25000,
    },

    perplexity: {
      apiKey: env.PERPLEXITY_API_KEY,
      isConfigured: !!env.PERPLEXITY_API_KEY,
      timeout: 20000,
    },

    dataForSEO: {
      login: env.DATAFORSEO_LOGIN,
      password: env.DATAFORSEO_PASSWORD,
      isConfigured: !!(env.DATAFORSEO_LOGIN && env.DATAFORSEO_PASSWORD),
      timeout: 15000,
    },

    ahrefs: {
      apiKey: env.AHREFS_API_KEY,
      isConfigured: !!env.AHREFS_API_KEY,
      timeout: 10000,
    },

    auth: {
      secret: env.AUTH_SECRET || env.JWT_SECRET,
      isConfigured: !!(env.AUTH_SECRET || env.JWT_SECRET),
      adminPassword: env.ADMIN_PASSWORD,
    },
  };
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Check if required services are configured.
 * Call this at application startup to warn about missing configuration.
 */
export function validateConfiguration(): {
  valid: boolean;
  warnings: string[];
  errors: string[];
} {
  const warnings: string[] = [];
  const errors: string[] = [];

  const cfg = config;

  // Critical: Database
  if (!cfg.database.isConfigured) {
    errors.push('Database URL not configured (POSTGRES_PRISMA_URL or DATABASE_URL)');
  }

  // Important: At least one AI provider
  if (!cfg.openai.isConfigured && !cfg.gemini.isConfigured && !cfg.perplexity.isConfigured) {
    errors.push('No AI provider configured (OPENAI_API_KEY, GEMINI_API_KEY, or PERPLEXITY_API_KEY)');
  }

  // Warnings for optional but recommended
  if (!cfg.auth.isConfigured && cfg.app.isProduction) {
    warnings.push('AUTH_SECRET not set - using insecure fallback');
  }

  if (!cfg.redis.isConfigured && cfg.app.isProduction) {
    warnings.push('REDIS_URL not set - rate limiting will use in-memory store');
  }

  // Log results
  if (errors.length > 0) {
    logger.error('Configuration errors', undefined, { errors });
  }

  if (warnings.length > 0) {
    warnings.forEach((warning) => logger.warn(warning));
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors,
  };
}

/**
 * Get a summary of configured services (for health checks).
 */
export function getConfigurationStatus(): Record<string, boolean> {
  return {
    database: config.database.isConfigured,
    redis: config.redis.isConfigured,
    openai: config.openai.isConfigured,
    gemini: config.gemini.isConfigured,
    perplexity: config.perplexity.isConfigured,
    dataForSEO: config.dataForSEO.isConfigured,
    ahrefs: config.ahrefs.isConfigured,
    auth: config.auth.isConfigured,
  };
}

/**
 * Require a specific configuration value or throw.
 */
export function requireConfig<T>(value: T | undefined, name: string): T {
  if (value === undefined || value === null || value === '') {
    throw new Error(`Required configuration missing: ${name}`);
  }
  return value;
}

// =============================================================================
// EXPORTS
// =============================================================================

export const config = createConfig();

// Re-export for convenience
export type { EnvConfig };
