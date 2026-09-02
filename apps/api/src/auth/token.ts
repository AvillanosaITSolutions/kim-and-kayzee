import { createHmac, timingSafeEqual } from 'crypto';

/**
 * A tiny signed-token helper (a minimal JWT-alike) so we don't pull in a JWT
 * library for a single admin login. The token is `base64url(payload).sig`,
 * where sig = HMAC-SHA256 of the payload with the server secret. It carries the
 * username and an expiry; tampering or expiry makes `verify` return null.
 */
export interface TokenPayload {
  sub: string; // username
  exp: number; // expiry, epoch seconds
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function sign(data: string, secret: string): string {
  return b64url(createHmac('sha256', secret).update(data).digest());
}

export function issueToken(
  username: string,
  secret: string,
  ttlSeconds: number,
): string {
  const payload: TokenPayload = {
    sub: username,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const body = b64url(JSON.stringify(payload));
  return `${body}.${sign(body, secret)}`;
}

export function verifyToken(
  token: string | undefined,
  secret: string,
): TokenPayload | null {
  if (!token) return null;
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const providedSig = token.slice(dot + 1);
  const expectedSig = sign(body, secret);

  // Constant-time compare; bail if the lengths differ (timingSafeEqual throws).
  const a = Buffer.from(providedSig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(body.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString(
        'utf8',
      ),
    ) as TokenPayload;
    if (typeof payload.exp !== 'number' || payload.exp < Date.now() / 1000) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
