import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete('auth-token');
  
  return NextResponse.json({ 
    success: true, 
    message: 'Logged out successfully' 
  });
}

export async function GET() {
  const cookieStore = await cookies();
  cookieStore.delete('auth-token');
  
  return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'));
}
