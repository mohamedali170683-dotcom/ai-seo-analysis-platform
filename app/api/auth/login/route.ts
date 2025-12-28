import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { generateToken } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

// Demo credentials fallback
const DEMO_USERNAME = 'admin@velaris.io';
const DEMO_PASSWORD = 'Velaris2024!Secure';

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

    // First, check if user exists in database
    let user = await prisma.user.findUnique({
      where: { email: username },
    });

    let isValid = false;

    if (user && user.passwordHash) {
      // User exists with password - verify against stored hash
      isValid = await bcrypt.compare(password, user.passwordHash);
    } else if (username === DEMO_USERNAME && password === DEMO_PASSWORD) {
      // Fallback to demo credentials
      isValid = true;
      // Create or get demo user
      if (!user) {
        user = await prisma.user.create({
          data: {
            email: DEMO_USERNAME,
            name: 'Admin',
          },
        });
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
    // Don't leak internal error details in production
    const isDev = process.env.NODE_ENV === 'development';
    return NextResponse.json(
      {
        success: false,
        message: isDev ? `Login failed: ${error?.message}` : 'Login failed. Please try again.'
      },
      { status: 500 }
    );
  }
}
