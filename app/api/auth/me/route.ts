import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserFromToken } from '@/lib/auth';

// Force Node.js runtime for JWT compatibility
export const runtime = 'nodejs';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, user: null },
        { status: 401 }
      );
    }

    const user = getUserFromToken(token);

    if (!user) {
      return NextResponse.json(
        { success: false, user: null },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        username: user.username,
        userId: user.userId,
      },
    });
  } catch (error: any) {
    console.error('Auth check error:', error?.message || error);
    return NextResponse.json(
      { success: false, user: null },
      { status: 500 }
    );
  }
}
