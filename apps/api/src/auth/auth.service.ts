import { Injectable } from '@nestjs/common';
import { timingSafeEqual } from 'crypto';
import { getAuthConfig } from './auth.config';
import { issueToken, verifyToken } from './token';

/** Constant-time string compare that tolerates differing lengths. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

@Injectable()
export class AuthService {
  private readonly cfg = getAuthConfig();

  get cookieName(): string {
    return this.cfg.cookieName;
  }

  /** True only if credentials match and a password is actually configured. */
  validateCredentials(username: string, password: string): boolean {
    if (!this.cfg.password) return false; // fail closed when unconfigured
    return (
      safeEqual(username ?? '', this.cfg.username) &&
      safeEqual(password ?? '', this.cfg.password)
    );
  }

  issueToken(username: string): string {
    return issueToken(username, this.cfg.secret, this.cfg.ttlSeconds);
  }

  /** Returns the username for a valid session cookie, or null. */
  usernameFromToken(token: string | undefined): string | null {
    return verifyToken(token, this.cfg.secret)?.sub ?? null;
  }

  cookieOptions(maxAgeMs?: number) {
    return {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: this.cfg.secureCookie,
      path: '/',
      ...(maxAgeMs === undefined ? {} : { maxAge: maxAgeMs }),
    };
  }

  get ttlMs(): number {
    return this.cfg.ttlSeconds * 1000;
  }
}
