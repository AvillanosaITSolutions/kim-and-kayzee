import { randomBytes } from 'crypto';

/**
 * Admin-login configuration, read once from the environment.
 *
 * - ADMIN_USERNAME / ADMIN_PASSWORD gate the dashboard. If ADMIN_PASSWORD is
 *   empty the login can never succeed (fail closed) — set it in PROD_DOTENV.
 * - AUTH_SECRET signs the session cookie. If unset we fall back to a random
 *   per-process secret (logged), which still works but logs everyone out on
 *   each restart/redeploy — set a stable value in production.
 */
export interface AuthConfig {
  username: string;
  password: string;
  secret: string;
  cookieName: string;
  ttlSeconds: number;
  secureCookie: boolean;
}

let cached: AuthConfig | null = null;

export function getAuthConfig(): AuthConfig {
  if (cached) return cached;

  const username = process.env.ADMIN_USERNAME?.trim() || 'admin';
  const password = process.env.ADMIN_PASSWORD ?? '';

  let secret = process.env.AUTH_SECRET?.trim() || '';
  if (!secret) {
    secret = randomBytes(32).toString('hex');
    // eslint-disable-next-line no-console
    console.warn(
      '[auth] AUTH_SECRET is not set — using a random per-process secret. ' +
        'Sessions will not survive a restart. Set AUTH_SECRET in the env.',
    );
  }
  if (!password) {
    // eslint-disable-next-line no-console
    console.warn(
      '[auth] ADMIN_PASSWORD is not set — the dashboard login is DISABLED ' +
        '(no one can sign in). Set ADMIN_PASSWORD in the env.',
    );
  }

  const ttlHours = Number(process.env.AUTH_TTL_HOURS ?? 168); // 7 days

  cached = {
    username,
    password,
    secret,
    cookieName: process.env.AUTH_COOKIE_NAME?.trim() || 'kk_session',
    ttlSeconds: Math.max(1, ttlHours) * 3600,
    secureCookie: process.env.NODE_ENV === 'production',
  };
  return cached;
}
