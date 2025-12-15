import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  '/wpp-demo',
  '/login',
  '/api/auth/login',
  '/api/auth/logout',
];

// Check if the path starts with any public route
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );
}

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
  
  // Verify the token (simple check - in production use JWT verification)
  try {
    const decoded = Buffer.from(authToken, 'base64').toString('utf-8');
    const tokenData = JSON.parse(decoded);
    
    // Check if token is valid and not expired
    if (tokenData.username === 'mohamed.ali' && tokenData.exp > Date.now()) {
      return NextResponse.next();
    }
  } catch {
    // Invalid token
  }
  
  // Invalid or expired token - redirect to login
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('redirect', pathname);
  const response = NextResponse.redirect(loginUrl);
  response.cookies.delete('auth-token');
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
