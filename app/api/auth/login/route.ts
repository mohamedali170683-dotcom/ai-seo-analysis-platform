import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { generateToken } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

// Force Node.js runtime for jsonwebtoken compatibility
export const runtime = 'nodejs';

// Demo credentials fallback
const DEMO_USERNAME = 'admin@velaris.io';
const DEMO_PASSWORD = 'VelarisAdmin2024';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'Username and password are required' },
        { status: 400 }
      );
    }

    let isValid = false;
    let user: { id: string; email: string; name: string | null; passwordHash?: string | null } | null = null;

    // Check demo credentials first (always works even if DB has issues)
    if (username === DEMO_USERNAME && password === DEMO_PASSWORD) {
      isValid = true;

      // Try to get or create demo user
      try {
        user = await prisma.user.findUnique({
          where: { email: DEMO_USERNAME },
          select: { id: true, email: true, name: true },
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              email: DEMO_USERNAME,
              name: 'Admin',
            },
            select: { id: true, email: true, name: true },
          });
        }
      } catch (dbError: any) {
        console.error('DB error creating demo user:', dbError?.message);
        // Create a temporary user object for token generation
        user = { id: 'demo-user', email: DEMO_USERNAME, name: 'Admin' };
      }
    } else {
      // Try to find user in database with password
      try {
        const dbUser = await prisma.user.findUnique({
          where: { email: username },
        });

        if (dbUser && (dbUser as any).passwordHash) {
          isValid = await bcrypt.compare(password, (dbUser as any).passwordHash);
          if (isValid) {
            user = { id: dbUser.id, email: dbUser.email, name: dbUser.name };
          }
        }
      } catch (dbError: any) {
        console.error('DB error finding user:', dbError?.message);
      }
    }

    if (!isValid || !user) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate signed JWT token
    const token = generateToken(username, user.id);

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
  } catch (error: any) {
    console.error('Login error:', error?.message || error);
    console.error('Login error stack:', error?.stack);
    // Return error details for debugging (temporarily)
    return NextResponse.json(
      {
        success: false,
        message: `Login failed: ${error?.message || 'Unknown error'}`,
        errorType: error?.name,
      },
      { status: 500 }
    );
  }
}
