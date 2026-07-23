import { DataSourceOptions } from 'typeorm';
import { Guest } from '../guests/guest.entity';
import { Invitation } from '../invitations/invitation.entity';

/**
 * Single source of truth for the Postgres connection, reused by the Nest
 * TypeOrmModule and the standalone seed script. `synchronize` is on because
 * this is a small, single-table app — for a larger schema switch to
 * migrations instead.
 */
export function buildDataSourceOptions(): DataSourceOptions {
  return {
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5433),
    username: process.env.DB_USER ?? 'wedding',
    password: process.env.DB_PASSWORD ?? 'wedding',
    database: process.env.DB_NAME ?? 'wedding',
    entities: [Guest, Invitation],
    synchronize: true,
  };
}
