import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Must match the fallback secret in lib/auth/index.ts
const DEV_JWT_SECRET = 'dev-secret-key-do-not-use-in-production-velaris-2024';
const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || DEV_JWT_SECRET;

// Convert secret to Uint8Array for jose
const secretKey = new TextEncoder().encode(JWT_SECRET);

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  '/wpp-demo',
  '/login',
  '/register',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/logout',
  '/api/health',
];

// API routes that require authentication
const PROTECTED_API_ROUTES = [
  '/api/analysis',
  '/api/brand-positioning',
  '/api/ground-truth',
  '/api/hallucination-detection',
  '/api/integrations',
  '/api/alerts',
  '/api/webhooks',
  '/api/automation',
  '/api/projects',
];

// Check if the path starts with any public route
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  );
}

// Check if the path is a protected API route
function isProtectedApiRoute(pathname: string): boolean {
  return PROTECTED_API_ROUTES.some(route =>
    pathname === route || pathname.startsWith(route + '/') || pathname.startsWith(route + '?')
  );
}

interface TokenPayload {
  username: string;
  userId: string;
  iat: number;
  exp: number;
}

async function verifyToken(token: string): Promise<TokenPayload | null> {
  if (!JWT_SECRET) {
    console.error('JWT_SECRET is not configured');
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ['HS256'],
    });
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Allow static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.') // Static files like .css, .js, .png
  ) {
    return NextResponse.next();
  }

  // Check for auth cookie
  const authToken = request.cookies.get('auth-token')?.value;

  if (!authToken) {
    // For API routes, return 401
    if (isProtectedApiRoute(pathname)) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }
    // For pages, redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verify the JWT token
  const tokenPayload = await verifyToken(authToken);

  if (!tokenPayload) {
    // For API routes, return 401
    if (isProtectedApiRoute(pathname)) {
      const response = NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 401 }
      );
      response.cookies.delete('auth-token');
      return response;
    }
    // For pages, redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('auth-token');
    return response;
  }

  // Add user info to request headers for API routes
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', tokenPayload.userId);
  requestHeaders.set('x-username', tokenPayload.username);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
