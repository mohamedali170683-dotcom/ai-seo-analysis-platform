import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Environment variables for authentication
const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
const AUTH_USERNAME = process.env.AUTH_USERNAME;
const AUTH_PASSWORD_HASH = process.env.AUTH_PASSWORD_HASH;

if (!JWT_SECRET) {
  console.warn('Warning: JWT_SECRET or NEXTAUTH_SECRET not set. Authentication will fail in production.');
}

export interface TokenPayload {
  username: string;
  userId: string;
  iat: number;
  exp: number;
}

export interface AuthUser {
  username: string;
  userId: string;
}

/**
 * Verify user credentials against hashed password
 */
export async function verifyCredentials(username: string, password: string): Promise<boolean> {
  if (!AUTH_USERNAME || !AUTH_PASSWORD_HASH) {
    console.error('Auth credentials not configured in environment variables');
    return false;
  }

  if (username !== AUTH_USERNAME) {
    return false;
  }

  return bcrypt.compare(password, AUTH_PASSWORD_HASH);
}

/**
 * Generate a signed JWT token
 */
export function generateToken(username: string, userId: string): string {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  const payload: Omit<TokenPayload, 'iat' | 'exp'> = {
    username,
    userId,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d',
    algorithm: 'HS256',
  });
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): TokenPayload | null {
  if (!JWT_SECRET) {
    console.error('JWT_SECRET is not configured');
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
    }) as TokenPayload;
    return decoded;
  } catch (error) {
    // Token is invalid or expired
    return null;
  }
}

/**
 * Extract user from token
 */
export function getUserFromToken(token: string): AuthUser | null {
  const payload = verifyToken(token);
  if (!payload) {
    return null;
  }

  return {
    username: payload.username,
    userId: payload.userId,
  };
}

/**
 * Hash a password for storage
 * Use this to generate AUTH_PASSWORD_HASH for .env
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Helper to generate a password hash (run once to create the hash for .env)
 * Usage: npx tsx -e "import('./lib/auth').then(m => m.hashPassword('yourpassword').then(console.log))"
 */
export async function generatePasswordHash(password: string): Promise<void> {
  const hash = await hashPassword(password);
  console.log('Add this to your .env file:');
  console.log(`AUTH_PASSWORD_HASH="${hash}"`);
}
