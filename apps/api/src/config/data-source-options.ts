import { DataSourceOptions } from 'typeorm';
import { Guest } from '../guests/guest.entity';
import { Invitation } from '../invitations/invitation.entity';

/**
 * Single source of truth for the Postgres connection, reused by the Nest
 * TypeOrmModule and the standalone seed script. `synchronize` is on because
 * this is a small, single-table app — for a larger schema switch to
 * migrations instead.
 *
 * On the VPS the discrete DB_* vars point at the Postgres container over the
 * compose network (no TLS). A single `DATABASE_URL` is also supported and takes
 * precedence — it auto-enables SSL, for a managed Postgres that requires TLS.
 * Set `DB_SSL=true` to force SSL with the discrete vars.
 */
export function buildDataSourceOptions(): DataSourceOptions {
  const url = process.env.DATABASE_URL;

  // Most managed Postgres present a certificate that isn't in Node's default
  // trust store; `rejectUnauthorized: false` keeps the connection encrypted
  // without pinning the CA.
  const useSsl = Boolean(url) || process.env.DB_SSL === 'true';
  const ssl = useSsl ? { rejectUnauthorized: false } : undefined;

  const common = {
    type: 'postgres' as const,
    entities: [Guest, Invitation],
    synchronize: true,
    ssl,
  };

  if (url) {
    return { ...common, url };
  }

  return {
    ...common,
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5433),
    username: process.env.DB_USER ?? 'wedding',
    password: process.env.DB_PASSWORD ?? 'wedding',
    database: process.env.DB_NAME ?? 'wedding',
  };
}
