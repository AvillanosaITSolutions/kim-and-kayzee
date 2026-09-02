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

  // Per-IP throttle so a 4-digit PIN (10k combos) can't be brute-forced.
  private readonly attempts = new Map<
    string,
    { fails: number; lockedUntil: number }
  >();
  private static readonly MAX_FAILS = 8;
  private static readonly LOCK_MS = 60_000;

  get cookieName(): string {
    return this.cfg.cookieName;
  }

  /** True only if the PIN matches and a PIN is actually configured. */
  validatePin(pin: string): boolean {
    if (!this.cfg.pin) return false; // fail closed when unconfigured
    return safeEqual(pin ?? '', this.cfg.pin);
  }

  /** Milliseconds remaining on a lockout for this IP, or 0 if not locked. */
  lockRemainingMs(ip: string): number {
    const a = this.attempts.get(ip);
    return a && a.lockedUntil > Date.now() ? a.lockedUntil - Date.now() : 0;
  }

  recordFail(ip: string): void {
    const a = this.attempts.get(ip) ?? { fails: 0, lockedUntil: 0 };
    a.fails += 1;
    if (a.fails >= AuthService.MAX_FAILS) {
      a.lockedUntil = Date.now() + AuthService.LOCK_MS;
      a.fails = 0;
    }
    this.attempts.set(ip, a);
  }

  recordSuccess(ip: string): void {
    this.attempts.delete(ip);
  }

  issueToken(): string {
    return issueToken(this.cfg.username, this.cfg.secret, this.cfg.ttlSeconds);
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
