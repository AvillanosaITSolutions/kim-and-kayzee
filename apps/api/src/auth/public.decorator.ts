import { SetMetadata } from '@nestjs/common';

/**
 * Marks a route as reachable without a login. The global AuthGuard checks for
 * this and lets the request through. Used for the public e-invite endpoints and
 * the auth endpoints themselves.
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
