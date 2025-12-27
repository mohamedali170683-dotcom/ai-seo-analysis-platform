import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// =============================================================================
// ROUTE CONFIGURATION
// =============================================================================

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  '/wpp-demo',
  '/login',
  '/api/',  // All API routes are public (they handle their own auth if needed)
];

// Routes that require admin role
const ADMIN_ROUTES = [
  '/admin',
  '/settings/advanced',
];

// =============================================================================
// HELPERS
// =============================================================================

// Check if the path starts with any public route
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route =>
    pathname === route || pathname.startsWith(route)
  );
}

// Check if route requires admin access
function isAdminRoute(pathname: string): boolean {
  return ADMIN_ROUTES.some(route =>
    pathname === route || pathname.startsWith(route)
  );
}

// Simple token verification for middleware (Edge runtime compatible)
// Note: Full verification with HMAC is done in lib/auth/token.ts
function verifyTokenInMiddleware(token: string): {
  valid: boolean;
  payload?: { username: string; userId?: string; role?: string; exp: number };
} {
  try {
    // Handle new format: base64url(payload).signature
    if (token.includes('.')) {
      const [encodedPayload] = token.split('.');
      const payloadString = Buffer.from(encodedPayload, 'base64url').toString('utf-8');
      const payload = JSON.parse(payloadString);

      if (payload.exp && payload.exp > Date.now()) {
        return { valid: true, payload };
      }
      return { valid: false };
    }

    // Handle legacy format: simple base64 JSON
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const payload = JSON.parse(decoded);

    if (payload.exp && payload.exp > Date.now()) {
      return { valid: true, payload };
    }
    return { valid: false };
  } catch {
    return { valid: false };
  }
}

// =============================================================================
// MIDDLEWARE
// =============================================================================

export function middleware(request: NextRequest) {
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
    // Redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verify the token
  const { valid, payload } = verifyTokenInMiddleware(authToken);

  if (!valid) {
    // Invalid or expired token - redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('auth-token');
    return response;
  }

  // Check admin access for protected routes
  if (isAdminRoute(pathname) && payload?.role !== 'admin') {
    // Redirect to home with error
    const homeUrl = new URL('/', request.url);
    homeUrl.searchParams.set('error', 'unauthorized');
    return NextResponse.redirect(homeUrl);
  }

  // Token is valid - add user info to headers for downstream use
  const response = NextResponse.next();

  // Pass user info to the request (accessible in API routes/pages)
  if (payload) {
    response.headers.set('x-user-id', payload.userId || payload.username);
    response.headers.set('x-user-role', payload.role || 'user');
  }

  return response;
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
