import 'reflect-metadata';
import { config } from 'dotenv';
import { randomUUID } from 'crypto';
import { DataSource, In } from 'typeorm';
import { buildDataSourceOptions } from '../config/data-source-options';
import { Guest } from '../guests/guest.entity';
import { Invitation } from '../invitations/invitation.entity';
import { invitationStructure, parseTag } from './invitation-structure';

config();

const normalizeName = (first: string, last: string) =>
  `${first}|${last}`.toLowerCase().replace(/\s+/g, ' ').trim();

const slugify = (input: string) =>
  input
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40) || 'invite';

/** Build a readable address from member display names. */
function labelFromMembers(members: Guest[]): string {
  const names = members.map(
    (m) => `${m.firstName} ${m.lastName}`.trim() || m.nameOnInvitation || m.id,
  );
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/**
 * Rebuilds the invitations table from the provided structure. Idempotent:
 * it first detaches all guests and clears existing invitations, then recreates
 * them, so re-running always produces the same result.
 */
async function run() {
  const dataSource = new DataSource(buildDataSourceOptions());
  await dataSource.initialize();
  const guestRepo = dataSource.getRepository(Guest);
  const invRepo = dataSource.getRepository(Invitation);

  const guests = await guestRepo.find();
  const byName = new Map<string, Guest>();
  const byId = new Map<string, Guest>();
  for (const g of guests) {
    byId.set(g.id, g);
    const key = normalizeName(g.firstName, g.lastName);
    if (!byName.has(key)) byName.set(key, g);
  }

  // Reset existing groupings for a clean, repeatable rebuild.
  await guestRepo
    .createQueryBuilder()
    .update(Guest)
    .set({ invitationId: null })
    .execute();
  await invRepo.createQueryBuilder().delete().execute();

  const assigned = new Set<string>();
  const unmatched: string[] = [];
  let created = 0;
  let seq = 0;

  for (const row of invitationStructure) {
    const members: Guest[] = [];
    for (const tag of row.tags) {
      const { id, firstName, lastName } = parseTag(tag);
      // Name is the stable key across the id renumbering; fall back to id.
      const guest =
        byName.get(normalizeName(firstName, lastName)) ?? byId.get(id);
      if (!guest) {
        unmatched.push(tag);
        continue;
      }
      if (assigned.has(guest.id)) continue; // already placed in an earlier invite
      assigned.add(guest.id);
      members.push(guest);
    }

    if (members.length === 0) continue; // skip empties (e.g. the duplicate row)

    seq += 1;
    const id = `INV-${String(seq).padStart(4, '0')}`;
    const address = row.address.trim() || labelFromMembers(members);
    const slug = `${slugify(address)}-${randomUUID().slice(0, 6)}`;

    await invRepo.save(invRepo.create({ id, slug, addressLabel: address }));
    await guestRepo.update(
      { id: In(members.map((m) => m.id)) },
      { invitationId: id },
    );
    created += 1;
  }

  const unassigned = guests
    .filter((g) => !assigned.has(g.id))
    .map((g) => `${g.id} (${`${g.firstName} ${g.lastName}`.trim()})`);

  // eslint-disable-next-line no-console
  console.log(
    [
      `Invitations seed complete — ${created} invitations created.`,
      `Guests assigned: ${assigned.size} / ${guests.length}.`,
      unassigned.length
        ? `Unassigned guests (${unassigned.length}): ${unassigned.join(', ')}`
        : 'All guests assigned to an invitation.',
      unmatched.length
        ? `Unmatched tags (${unmatched.length}): ${unmatched.join(' | ')}`
        : 'All tags matched a guest.',
    ].join('\n'),
  );

  await dataSource.destroy();
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Invitations seed failed:', err);
  process.exit(1);
});
