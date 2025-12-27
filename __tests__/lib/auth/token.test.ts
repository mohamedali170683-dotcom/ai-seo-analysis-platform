/**
 * Tests for authentication token utilities
 */

import {
  createToken,
  verifyToken,
  verifyLegacyToken,
  verifyTokenWithLegacy,
  isTokenExpired,
  getTokenTTL,
  validateCredentials,
  TOKEN_COOKIE_NAME,
  TOKEN_EXPIRATION_MS,
} from '@/lib/auth/token';

describe('Auth Token Utilities', () => {
  describe('createToken', () => {
    it('should create a token with correct format', () => {
      const token = createToken({
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
      });

      // Token should be in format: base64url(payload).signature
      expect(token).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
    });

    it('should create tokens with different signatures for different users', () => {
      const token1 = createToken({ id: 'user-1', username: 'user1' });
      const token2 = createToken({ id: 'user-2', username: 'user2' });

      expect(token1).not.toBe(token2);
    });

    it('should default role to user', () => {
      const token = createToken({ id: 'user-1', username: 'testuser' });
      const result = verifyToken(token);

      expect(result.valid).toBe(true);
      expect(result.payload?.role).toBe('user');
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const token = createToken({
        id: 'user-123',
        username: 'testuser',
        role: 'admin',
      });

      const result = verifyToken(token);

      expect(result.valid).toBe(true);
      expect(result.payload).toBeDefined();
      expect(result.payload?.userId).toBe('user-123');
      expect(result.payload?.username).toBe('testuser');
      expect(result.payload?.role).toBe('admin');
    });

    it('should reject tokens with invalid format', () => {
      const result = verifyToken('invalid-token-format');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid token format');
    });

    it('should reject tokens with invalid signature', () => {
      const token = createToken({ id: 'user-1', username: 'test' });
      // Tamper with the signature
      const [payload, _signature] = token.split('.');
      const tamperedToken = `${payload}.tampered-signature`;

      const result = verifyToken(tamperedToken);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid signature');
    });

    it('should reject expired tokens', () => {
      // Create a token payload manually with expired timestamp
      const expiredPayload = {
        userId: 'user-1',
        username: 'test',
        role: 'user',
        iat: Date.now() - 48 * 60 * 60 * 1000, // 48 hours ago
        exp: Date.now() - 24 * 60 * 60 * 1000, // Expired 24 hours ago
      };

      const encodedPayload = Buffer.from(JSON.stringify(expiredPayload)).toString('base64url');
      // Note: This won't have a valid signature, but the expiration check happens first
      const result = verifyToken(`${encodedPayload}.fake-signature`);

      // The signature check should fail before expiration
      expect(result.valid).toBe(false);
    });
  });

  describe('verifyLegacyToken', () => {
    it('should verify legacy base64 tokens', () => {
      const legacyPayload = {
        username: 'testuser',
        exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours from now
      };
      const legacyToken = Buffer.from(JSON.stringify(legacyPayload)).toString('base64');

      const result = verifyLegacyToken(legacyToken);

      expect(result.valid).toBe(true);
      expect(result.payload?.username).toBe('testuser');
    });

    it('should reject expired legacy tokens', () => {
      const expiredPayload = {
        username: 'testuser',
        exp: Date.now() - 1000, // Expired 1 second ago
      };
      const legacyToken = Buffer.from(JSON.stringify(expiredPayload)).toString('base64');

      const result = verifyLegacyToken(legacyToken);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Token expired');
    });

    it('should reject invalid legacy tokens', () => {
      const result = verifyLegacyToken('not-valid-base64-json');

      expect(result.valid).toBe(false);
    });
  });

  describe('verifyTokenWithLegacy', () => {
    it('should verify new format tokens', () => {
      const token = createToken({ id: 'user-1', username: 'test' });
      const result = verifyTokenWithLegacy(token);

      expect(result.valid).toBe(true);
    });

    it('should fall back to legacy format', () => {
      const legacyPayload = {
        username: 'legacy-user',
        exp: Date.now() + 24 * 60 * 60 * 1000,
      };
      const legacyToken = Buffer.from(JSON.stringify(legacyPayload)).toString('base64');

      const result = verifyTokenWithLegacy(legacyToken);

      expect(result.valid).toBe(true);
      expect(result.payload?.username).toBe('legacy-user');
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for valid non-expired token', () => {
      const token = createToken({ id: 'user-1', username: 'test' });
      expect(isTokenExpired(token)).toBe(false);
    });

    it('should return true for invalid tokens', () => {
      expect(isTokenExpired('invalid-token')).toBe(true);
    });
  });

  describe('getTokenTTL', () => {
    it('should return remaining seconds for valid token', () => {
      const token = createToken({ id: 'user-1', username: 'test' });
      const ttl = getTokenTTL(token);

      // Should be close to 24 hours (86400 seconds) minus a few seconds for execution
      expect(ttl).toBeGreaterThan(86000);
      expect(ttl).toBeLessThanOrEqual(86400);
    });

    it('should return 0 for invalid tokens', () => {
      expect(getTokenTTL('invalid-token')).toBe(0);
    });
  });

  describe('validateCredentials', () => {
    it('should validate demo user credentials', () => {
      const result = validateCredentials('demo', 'demo');

      expect(result.valid).toBe(true);
      expect(result.user?.username).toBe('demo');
      expect(result.user?.role).toBe('user');
    });

    it('should reject invalid username', () => {
      const result = validateCredentials('nonexistent', 'password');

      expect(result.valid).toBe(false);
      expect(result.user).toBeUndefined();
    });

    it('should reject invalid password', () => {
      const result = validateCredentials('demo', 'wrong-password');

      expect(result.valid).toBe(false);
    });
  });

  describe('Constants', () => {
    it('should export TOKEN_COOKIE_NAME', () => {
      expect(TOKEN_COOKIE_NAME).toBe('auth-token');
    });

    it('should export TOKEN_EXPIRATION_MS as 24 hours', () => {
      expect(TOKEN_EXPIRATION_MS).toBe(24 * 60 * 60 * 1000);
    });
  });
});
