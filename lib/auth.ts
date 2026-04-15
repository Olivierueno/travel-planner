import { SignJWT, jwtVerify } from 'jose';

export const COOKIE_NAME = 'trip-auth';

function getSecret(): Uint8Array {
  return new TextEncoder().encode(
    process.env.AUTH_SECRET || 'dev-secret-change-me'
  );
}

export function getPassword(): string {
  return process.env.TRIP_PASSWORD || 'travel2025';
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
