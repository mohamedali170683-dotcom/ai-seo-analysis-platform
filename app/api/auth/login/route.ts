import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyCredentials, generateToken } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

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

    // Verify credentials against hashed password
    const isValid = await verifyCredentials(username, password);

    if (!isValid) {
      // Use generic message to prevent username enumeration
      return NextResponse.json(
        { success: false, message: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Get or create user in database
    let user = await prisma.user.findUnique({
      where: { email: username },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: username,
          name: username,
        },
      });
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
  } catch (error) {
    console.error('Login error:', error);
    // Don't leak internal error details
    return NextResponse.json(
      { success: false, message: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}
