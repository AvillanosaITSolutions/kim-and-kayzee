import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from '../../config/data-source-options';
import { Guest } from '../../guests/guest.entity';
import { seedGuests } from '../guest-data';

config();

/**
 * Data migration — refreshes the `guests` table to the 2026-08-08 masterlist
 * (see ../guest-data.ts). It:
 *   • upserts every masterlist guest by primary key (rsvpStatus, notes and
 *     invitationId on existing rows are preserved — only masterlist columns
 *     are merged);
 *   • deletes any guest row whose id is no longer in the masterlist
 *     (this revision drops G-0103, "Girlie Avillanosa", so the list goes
 *     103 → 102 guests).
 *
 * Safety:
 *   • Dry-run by default — prints the exact plan and writes nothing.
 *     Pass `--apply` to persist.
 *   • Targets the remote DATABASE_URL by default. Pass `--local` to force the
 *     local docker Postgres (DB_* vars) instead.
 *
 * Examples (run from apps/api):
 *   pnpm migrate:guests -- --local            # dry-run against local docker
 *   pnpm migrate:guests -- --local --apply    # apply to local docker
 *   pnpm migrate:guests                        # dry-run against remote
 *   pnpm migrate:guests -- --apply             # apply to remote (DATABASE_URL)
 */

const APPLY = process.argv.includes('--apply');
const LOCAL = process.argv.includes('--local');

// Columns owned by the masterlist. rsvpStatus / notes / invitationId are
// intentionally NOT listed so they are preserved on existing rows.
const MASTER_COLUMNS = [
  'includedBy',
  'nameOnInvitation',
  'firstName',
  'lastName',
  'guestType',
  'priority',
  'invitedBy',
  'hasInvite',
] as const;

type MasterColumn = (typeof MASTER_COLUMNS)[number];

function describeTarget(options: ReturnType<typeof buildDataSourceOptions>): string {
  const anyOpts = options as { url?: string; host?: string; port?: number };
  if (anyOpts.url) {
    // Show host only — never the credentials embedded in the URL.
    let host = 'remote';
    try {
      host = new URL(anyOpts.url).host;
    } catch {
      /* ignore malformed url — fall back to the generic label */
    }
    return `REMOTE (${host})`;
  }
  return `LOCAL (${anyOpts.host ?? 'localhost'}:${anyOpts.port ?? 5432})`;
}

async function run() {
  if (LOCAL) {
    // Force the discrete DB_* (docker) connection regardless of .env's
    // DATABASE_URL, which otherwise always wins.
    delete process.env.DATABASE_URL;
  }

  const options = buildDataSourceOptions();
  const target = describeTarget(options);

  const dataSource = new DataSource(options);
  await dataSource.initialize();
  const repo = dataSource.getRepository(Guest);

  const masterById = new Map(seedGuests.map((g) => [g.id, g]));
  const existing = await repo.find();
  const existingById = new Map(existing.map((g) => [g.id, g]));

  const toCreate: string[] = [];
  const toUpdate: { id: string; diffs: string[] }[] = [];

  for (const seed of seedGuests) {
    const current = existingById.get(seed.id);
    if (!current) {
      toCreate.push(seed.id);
      continue;
    }
    const diffs: string[] = [];
    for (const col of MASTER_COLUMNS) {
      const before = current[col as MasterColumn];
      const after = seed[col];
      if (before !== after) {
        diffs.push(`${col}: ${JSON.stringify(before)} → ${JSON.stringify(after)}`);
      }
    }
    if (diffs.length) toUpdate.push({ id: seed.id, diffs });
  }

  const toDelete = existing.filter((g) => !masterById.has(g.id));

  // ── Report ────────────────────────────────────────────────────────────
  const line = '─'.repeat(64);
  console.log(line);
  console.log(`Guest masterlist refresh — ${APPLY ? 'APPLY' : 'DRY RUN'}`);
  console.log(`Target: ${target}`);
  console.log(line);
  console.log(
    `Existing rows: ${existing.length} | Masterlist rows: ${seedGuests.length}`,
  );
  console.log(
    `To create: ${toCreate.length} | To update: ${toUpdate.length} | To delete: ${toDelete.length}`,
  );

  if (toCreate.length) {
    console.log(`\nCREATE (${toCreate.length}):`);
    for (const id of toCreate) {
      const g = masterById.get(id)!;
      console.log(`  + ${id}  ${`${g.firstName} ${g.lastName}`.trim()}`);
    }
  }

  if (toUpdate.length) {
    console.log(`\nUPDATE (${toUpdate.length}):`);
    for (const { id, diffs } of toUpdate) {
      const g = masterById.get(id)!;
      console.log(`  ~ ${id}  ${`${g.firstName} ${g.lastName}`.trim()}`);
      for (const d of diffs) console.log(`      ${d}`);
    }
  }

  if (toDelete.length) {
    console.log(`\nDELETE (${toDelete.length}):`);
    for (const g of toDelete) {
      console.log(
        `  - ${g.id}  ${`${g.firstName} ${g.lastName}`.trim()}` +
          (g.invitationId ? `  (was in ${g.invitationId})` : ''),
      );
    }
  }

  if (!APPLY) {
    console.log(`\n${line}`);
    console.log('DRY RUN — no changes written. Re-run with --apply to persist.');
    console.log(line);
    await dataSource.destroy();
    return;
  }

  // ── Apply ─────────────────────────────────────────────────────────────
  await dataSource.transaction(async (manager) => {
    const txRepo = manager.getRepository(Guest);
    for (const seed of seedGuests) {
      const current = existingById.get(seed.id);
      if (current) {
        txRepo.merge(current, seed);
        await txRepo.save(current);
      } else {
        await txRepo.save(txRepo.create(seed));
      }
    }
    if (toDelete.length) {
      await txRepo.remove(toDelete);
    }
  });

  const total = await repo.count();
  console.log(`\n${line}`);
  console.log(
    `APPLIED — ${toCreate.length} created, ${toUpdate.length} updated, ${toDelete.length} deleted. Total guests now: ${total}.`,
  );
  console.log(line);

  await dataSource.destroy();
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Migration failed:', err);
  process.exit(1);
});
