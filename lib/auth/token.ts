/**
 * Token handling utilities for authentication.
 *
 * This module provides a foundation for token-based auth that can be
 * easily upgraded to NextAuth.js or other providers later.
 *
 * SECURITY NOTE: This is a simplified implementation. For production:
 * - Use NextAuth.js with proper providers
 * - Use RS256 or ES256 for JWT signing
 * - Store secrets in a secrets manager
 * - Implement proper session management
 */

import crypto from 'crypto';
import { logger } from '@/lib/utils/logger';

// =============================================================================
// TYPES
// =============================================================================

export interface TokenPayload {
  userId: string;
  username: string;
  email?: string;
  role?: 'user' | 'admin';
  iat: number; // Issued at
  exp: number; // Expiration
}

export interface TokenVerifyResult {
  valid: boolean;
  payload?: TokenPayload;
  error?: string;
}

// =============================================================================
// CONFIGURATION
// =============================================================================

const TOKEN_CONFIG = {
  // Token expiration time (24 hours in milliseconds)
  expirationMs: 24 * 60 * 60 * 1000,
  // Algorithm for HMAC signature
  algorithm: 'sha256' as const,
  // Cookie name
  cookieName: 'auth-token',
};

/**
 * Get the secret key for signing tokens.
 * Falls back to a development key if not set.
 */
function getSecretKey(): string {
  const secret = process.env.AUTH_SECRET || process.env.JWT_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      logger.warn('AUTH_SECRET not set in production - using fallback (INSECURE)');
    }
    // Development fallback - DO NOT use in production
    return 'dev-secret-key-not-for-production';
  }

  return secret;
}

// =============================================================================
// TOKEN GENERATION
// =============================================================================

/**
 * Create a signed token for a user.
 */
export function createToken(user: {
  id: string;
  username: string;
  email?: string;
  role?: 'user' | 'admin';
}): string {
  const now = Date.now();

  const payload: TokenPayload = {
    userId: user.id,
    username: user.username,
    email: user.email,
    role: user.role || 'user',
    iat: now,
    exp: now + TOKEN_CONFIG.expirationMs,
  };

  const payloadString = JSON.stringify(payload);
  const signature = signPayload(payloadString);

  // Format: base64(payload).signature
  const encodedPayload = Buffer.from(payloadString).toString('base64url');
  return `${encodedPayload}.${signature}`;
}

/**
 * Sign a payload using HMAC.
 */
function signPayload(payload: string): string {
  const secret = getSecretKey();
  return crypto
    .createHmac(TOKEN_CONFIG.algorithm, secret)
    .update(payload)
    .digest('base64url');
}

// =============================================================================
// TOKEN VERIFICATION
// =============================================================================

/**
 * Verify and decode a token.
 */
export function verifyToken(token: string): TokenVerifyResult {
  try {
    // Split token into parts
    const parts = token.split('.');
    if (parts.length !== 2) {
      return { valid: false, error: 'Invalid token format' };
    }

    const [encodedPayload, signature] = parts;

    // Decode payload
    const payloadString = Buffer.from(encodedPayload, 'base64url').toString('utf-8');

    // Verify signature
    const expectedSignature = signPayload(payloadString);
    if (!crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )) {
      return { valid: false, error: 'Invalid signature' };
    }

    // Parse and validate payload
    const payload: TokenPayload = JSON.parse(payloadString);

    // Check expiration
    if (payload.exp < Date.now()) {
      return { valid: false, error: 'Token expired' };
    }

    return { valid: true, payload };
  } catch (error) {
    logger.debug('Token verification failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return { valid: false, error: 'Token verification failed' };
  }
}

/**
 * Check if a token is expired.
 */
export function isTokenExpired(token: string): boolean {
  const result = verifyToken(token);
  return !result.valid || (result.payload?.exp ?? 0) < Date.now();
}

/**
 * Get remaining time until token expires (in seconds).
 */
export function getTokenTTL(token: string): number {
  const result = verifyToken(token);
  if (!result.valid || !result.payload) {
    return 0;
  }
  const remainingMs = result.payload.exp - Date.now();
  return Math.max(0, Math.floor(remainingMs / 1000));
}

// =============================================================================
// LEGACY TOKEN SUPPORT
// =============================================================================

/**
 * Verify legacy base64 tokens (for backward compatibility).
 * This supports the old format while we transition to the new format.
 */
export function verifyLegacyToken(token: string): TokenVerifyResult {
  try {
    // Try to decode as simple base64 JSON (old format)
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const data = JSON.parse(decoded);

    // Check required fields
    if (!data.username || !data.exp) {
      return { valid: false, error: 'Invalid legacy token format' };
    }

    // Check expiration
    if (data.exp < Date.now()) {
      return { valid: false, error: 'Token expired' };
    }

    // Convert to standard payload format
    const payload: TokenPayload = {
      userId: data.userId || data.username,
      username: data.username,
      email: data.email,
      role: data.role || 'user',
      iat: data.iat || Date.now(),
      exp: data.exp,
    };

    return { valid: true, payload };
  } catch {
    return { valid: false, error: 'Invalid legacy token' };
  }
}

/**
 * Verify token with fallback to legacy format.
 */
export function verifyTokenWithLegacy(token: string): TokenVerifyResult {
  // Try new format first
  const result = verifyToken(token);
  if (result.valid) {
    return result;
  }

  // Fall back to legacy format
  return verifyLegacyToken(token);
}

// =============================================================================
// AUTHORIZED USERS (Temporary - Replace with database)
// =============================================================================

/**
 * Authorized users configuration.
 * TODO: Replace with database-backed user management.
 */
const AUTHORIZED_USERS: Record<string, { password: string; role: 'user' | 'admin' }> = {
  'mohamed.ali': {
    password: process.env.ADMIN_PASSWORD || 'demo-password',
    role: 'admin',
  },
  'demo': {
    password: 'demo',
    role: 'user',
  },
};

/**
 * Validate user credentials.
 * TODO: Replace with database lookup and proper password hashing.
 */
export function validateCredentials(
  username: string,
  password: string
): { valid: boolean; user?: { id: string; username: string; role: 'user' | 'admin' } } {
  const userConfig = AUTHORIZED_USERS[username];

  if (!userConfig) {
    return { valid: false };
  }

  // Simple comparison - in production, use bcrypt.compare()
  if (userConfig.password !== password) {
    return { valid: false };
  }

  return {
    valid: true,
    user: {
      id: username, // Use username as ID for now
      username,
      role: userConfig.role,
    },
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export const TOKEN_COOKIE_NAME = TOKEN_CONFIG.cookieName;
export const TOKEN_EXPIRATION_MS = TOKEN_CONFIG.expirationMs;
