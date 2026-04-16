import { SignJWT, jwtVerify } from 'jose';
import { timingSafeEqual } from 'crypto';

export const COOKIE_NAME = 'trip-auth';

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret === 'generate-a-random-secret-here') {
    throw new Error('AUTH_SECRET environment variable must be set');
  }
  return new TextEncoder().encode(secret);
}

export function getPassword(): string {
  const pw = process.env.TRIP_PASSWORD;
  if (!pw || pw === 'your-shared-password') {
    throw new Error('TRIP_PASSWORD environment variable must be set');
  }
  return pw;
}

export function verifyPassword(input: string): boolean {
  const correct = getPassword();
  const a = Buffer.from(input);
  const b = Buffer.from(correct);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function createSession(): Promise<string> {
  return new SignJWT({ authenticated: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(getSecret());
}

export async function verifySession(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, getSecret());
    return true;
  } catch {
    return false;
  }
}
