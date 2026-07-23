import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from '../config/data-source-options';
import { Guest } from '../guests/guest.entity';
import { seedGuests } from './guest-data';

config();

/**
 * Idempotent seed: upserts every guest from the masterlist by primary key,
 * so running it repeatedly is safe and won't create duplicates. RSVP status
 * and notes are left untouched on existing rows.
 */
async function run() {
  const dataSource = new DataSource(buildDataSourceOptions());
  await dataSource.initialize();
  const repo = dataSource.getRepository(Guest);

  let created = 0;
  let updated = 0;

  for (const seed of seedGuests) {
    const existing = await repo.findOne({ where: { id: seed.id } });
    if (existing) {
      repo.merge(existing, seed);
      await repo.save(existing);
      updated += 1;
    } else {
      await repo.save(repo.create(seed));
      created += 1;
    }
  }

  const total = await repo.count();
  // eslint-disable-next-line no-console
  console.log(
    `Seed complete — ${created} created, ${updated} updated, ${total} total guests.`,
  );
  await dataSource.destroy();
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Seed failed:', err);
  process.exit(1);
});
