import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Hardcoded credentials (in production, use environment variables and hashed passwords)
const VALID_USERNAME = 'mohamed.ali';
const VALID_PASSWORD = '47719573rR_';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // Validate credentials
    if (username === VALID_USERNAME && password === VALID_PASSWORD) {
      // Create a simple token (in production, use JWT with proper signing)
      const tokenData = {
        username,
        exp: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days expiration
        iat: Date.now(),
      };
      
      const token = Buffer.from(JSON.stringify(tokenData)).toString('base64');
      
      // Set the auth cookie
      const cookieStore = await cookies();
      cookieStore.set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
        path: '/',
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Login successful' 
      });
    }

    // Invalid credentials
    return NextResponse.json(
      { success: false, message: 'Invalid username or password' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Login failed' },
      { status: 500 }
    );
  }
}
