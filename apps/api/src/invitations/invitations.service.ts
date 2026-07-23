import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { In, Not, Repository } from 'typeorm';
import { Guest } from '../guests/guest.entity';
import { Invitation } from './invitation.entity';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { UpdateInvitationDto } from './dto/update-invitation.dto';
import { SubmitRsvpDto } from './dto/rsvp.dto';

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      // strip emoji and any non-word characters, keep spaces/hyphens
      .replace(/[^\p{Letter}\p{Number}\s-]/gu, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 40) || 'invite'
  );
}

@Injectable()
export class InvitationsService {
  constructor(
    @InjectRepository(Invitation)
    private readonly repo: Repository<Invitation>,
    @InjectRepository(Guest)
    private readonly guests: Repository<Guest>,
  ) {}

  findAll(): Promise<Invitation[]> {
    return this.repo.find({
      relations: { members: true },
      order: { id: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Invitation> {
    const invitation = await this.repo.findOne({
      where: { id },
      relations: { members: true },
    });
    if (!invitation) {
      throw new NotFoundException(`Invitation ${id} not found`);
    }
    this.sortMembers(invitation);
    return invitation;
  }

  async findBySlug(slug: string): Promise<Invitation> {
    const invitation = await this.repo.findOne({
      where: { slug },
      relations: { members: true },
    });
    if (!invitation) {
      throw new NotFoundException(`Invitation "${slug}" not found`);
    }
    this.sortMembers(invitation);
    return invitation;
  }

  async create(dto: CreateInvitationDto): Promise<Invitation> {
    const id = dto.id ?? (await this.nextId());
    if (await this.repo.findOne({ where: { id } })) {
      throw new ConflictException(`Invitation ${id} already exists`);
    }
    const invitation = this.repo.create({
      id,
      addressLabel: dto.addressLabel ?? '',
      message: dto.message ?? '',
      slug: await this.uniqueSlug(dto.addressLabel ?? id),
    });
    await this.repo.save(invitation);

    if (dto.memberIds?.length) {
      await this.setMembers(id, dto.memberIds);
    }
    return this.findOne(id);
  }

  async update(id: string, dto: UpdateInvitationDto): Promise<Invitation> {
    const invitation = await this.findOne(id);
    if (dto.addressLabel !== undefined) {
      invitation.addressLabel = dto.addressLabel;
    }
    if (dto.message !== undefined) {
      invitation.message = dto.message;
    }
    await this.repo.save(invitation);

    if (dto.memberIds) {
      await this.setMembers(id, dto.memberIds);
    }
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    // Detach members first so they return to the "unassigned" pool.
    await this.guests.update({ invitationId: id }, { invitationId: null });
    const result = await this.repo.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`Invitation ${id} not found`);
    }
  }

  /** Replace the full member set: attach the given guests, detach the rest. */
  async setMembers(id: string, memberIds: string[]): Promise<Invitation> {
    await this.findOne(id); // ensures it exists

    const unique = [...new Set(memberIds)];
    if (unique.length) {
      const found = await this.guests.find({
        where: { id: In(unique) },
        select: { id: true },
      });
      if (found.length !== unique.length) {
        const foundIds = new Set(found.map((g) => g.id));
        const missing = unique.filter((gid) => !foundIds.has(gid));
        throw new BadRequestException(
          `Unknown guest id(s): ${missing.join(', ')}`,
        );
      }
      // A guest belongs to at most one invitation — this reassigns as needed.
      await this.guests.update({ id: In(unique) }, { invitationId: id });
    }

    // Detach anyone currently on this invitation who isn't in the new list.
    await this.guests.update(
      unique.length
        ? { invitationId: id, id: Not(In(unique)) }
        : { invitationId: id },
      { invitationId: null },
    );

    return this.findOne(id);
  }

  /** Public group-RSVP submission from the e-invite page (keyed by slug). */
  async submitRsvp(slug: string, dto: SubmitRsvpDto): Promise<Invitation> {
    const invitation = await this.findBySlug(slug);
    const memberIds = new Set(invitation.members.map((m) => m.id));

    for (const r of dto.responses) {
      if (!memberIds.has(r.guestId)) {
        throw new BadRequestException(
          `Guest ${r.guestId} is not on this invitation`,
        );
      }
    }
    for (const r of dto.responses) {
      await this.guests.update(
        { id: r.guestId },
        { rsvpStatus: r.rsvpStatus },
      );
    }
    return this.findBySlug(slug);
  }

  private sortMembers(invitation: Invitation): void {
    invitation.members?.sort((a, b) => a.id.localeCompare(b.id));
  }

  private async nextId(): Promise<string> {
    const all = await this.repo.find({ select: { id: true } });
    let max = 0;
    for (const inv of all) {
      const m = /^INV-(\d+)$/.exec(inv.id);
      if (m) max = Math.max(max, Number(m[1]));
    }
    return `INV-${String(max + 1).padStart(4, '0')}`;
  }

  private async uniqueSlug(seed: string): Promise<string> {
    const base = slugify(seed);
    // Short random suffix keeps the public URL from being guessable/enumerable.
    for (let i = 0; i < 5; i++) {
      const slug = `${base}-${randomUUID().slice(0, 6)}`;
      if (!(await this.repo.findOne({ where: { slug } }))) {
        return slug;
      }
    }
    return `${base}-${randomUUID()}`;
  }
}
