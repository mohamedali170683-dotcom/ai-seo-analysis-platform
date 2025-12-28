import { headers } from 'next/headers';
import { cookies } from 'next/headers';
import { verifyToken, type AuthUser } from './index';

/**
 * Get authenticated user from request headers (set by middleware)
 * Use this in API routes to get the current user
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  const headersList = await headers();
  const userId = headersList.get('x-user-id');
  const username = headersList.get('x-username');

  if (userId && username) {
    return { userId, username };
  }

  // Fallback: try to get from cookie directly (for edge cases)
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    return null;
  }

  const payload = verifyToken(token);
  if (!payload) {
    return null;
  }

  return {
    userId: payload.userId,
    username: payload.username,
  };
}

/**
 * Require authenticated user - throws if not authenticated
 * Use this in API routes that require authentication
 */
export async function requireAuthUser(): Promise<AuthUser> {
  const user = await getAuthUser();
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}
