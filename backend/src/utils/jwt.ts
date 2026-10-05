import crypto from 'node:crypto';
import { config } from '../config/index.ts';

export interface SessionPayload {
  userId: string;
  role: 'STUDENT' | 'STAFF' | 'ADMIN';
  email: string;
  name: string;
  exp: number; // timestamp in ms
  iat: number;
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str).toString('base64url');
}

function base64UrlDecode(str: string): string {
  return Buffer.from(str, 'base64url').toString('utf8');
}

export function generateSessionToken(user: { id: string; role: 'STUDENT' | 'STAFF' | 'ADMIN'; email: string; name: string }): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Date.now();
  const exp = now + config.tokenExpiryHours * 60 * 60 * 1000;

  const payload: SessionPayload = {
    userId: user.id,
    role: user.role,
    email: user.email,
    name: user.name,
    iat: now,
    exp,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto
    .createHmac('sha256', config.sessionSecret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', config.sessionSecret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const payload: SessionPayload = JSON.parse(base64UrlDecode(encodedPayload));
    if (Date.now() > payload.exp) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}
