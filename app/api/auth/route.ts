import { NextRequest, NextResponse } from 'next/server';
import { createSession, getPassword, verifySession, COOKIE_NAME } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const { password } = await request.json();

  if (password !== getPassword()) {
    return NextResponse.json(
      { success: false, error: 'Wrong password' },
      { status: 401 }
    );
  }

  const token = await createSession();
  const response = NextResponse.json({ success: true });

  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60,
    path: '/',
  });

  return response;
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ authenticated: false });
  }
  const valid = await verifySession(token);
  return NextResponse.json({ authenticated: valid });
}
