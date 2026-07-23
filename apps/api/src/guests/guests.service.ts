import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Guest } from './guest.entity';
import { CreateGuestDto } from './dto/create-guest.dto';
import { UpdateGuestDto } from './dto/update-guest.dto';
import { QueryGuestsDto } from './dto/query-guests.dto';

/** Build the composite tag used in the original masterlist. */
export function buildTag(guest: Guest): string {
  return `${guest.id}-${guest.guestType}-${guest.firstName}_${guest.lastName}`;
}

export interface GuestStats {
  total: number;
  withInvite: number;
  withoutInvite: number;
  bySide: { Groom: number; Bride: number };
  byRsvp: { Pending: number; Attending: number; Declined: number };
  byGuestType: { guestType: string; count: number }[];
  byPriority: { priority: string; count: number }[];
}

@Injectable()
export class GuestsService {
  constructor(
    @InjectRepository(Guest)
    private readonly repo: Repository<Guest>,
  ) {}

  async findAll(query: QueryGuestsDto): Promise<Guest[]> {
    const qb = this.repo.createQueryBuilder('g');

    if (query.invitedBy) {
      qb.andWhere('g.invitedBy = :invitedBy', { invitedBy: query.invitedBy });
    }
    if (query.guestType) {
      qb.andWhere('g.guestType = :guestType', { guestType: query.guestType });
    }
    if (query.priority !== undefined) {
      qb.andWhere('g.priority = :priority', { priority: query.priority });
    }
    if (query.rsvpStatus) {
      qb.andWhere('g.rsvpStatus = :rsvpStatus', {
        rsvpStatus: query.rsvpStatus,
      });
    }
    if (query.hasInvite !== undefined) {
      qb.andWhere('g.hasInvite = :hasInvite', {
        hasInvite: query.hasInvite === 'true',
      });
    }
    if (query.search) {
      const term = `%${query.search.toLowerCase()}%`;
      qb.andWhere(
        new Brackets((b) => {
          b.where('LOWER(g.id) LIKE :term', { term })
            .orWhere('LOWER(g.firstName) LIKE :term', { term })
            .orWhere('LOWER(g.lastName) LIKE :term', { term })
            .orWhere('LOWER(g.nameOnInvitation) LIKE :term', { term })
            .orWhere('LOWER(g.includedBy) LIKE :term', { term });
        }),
      );
    }

    qb.orderBy('g.id', 'ASC');
    return qb.getMany();
  }

  async findOne(id: string): Promise<Guest> {
    const guest = await this.repo.findOne({ where: { id } });
    if (!guest) {
      throw new NotFoundException(`Guest ${id} not found`);
    }
    return guest;
  }

  async create(dto: CreateGuestDto): Promise<Guest> {
    const id = dto.id ?? (await this.nextId());
    const existing = await this.repo.findOne({ where: { id } });
    if (existing) {
      throw new ConflictException(`Guest ${id} already exists`);
    }
    const guest = this.repo.create({ ...dto, id });
    return this.repo.save(guest);
  }

  async update(id: string, dto: UpdateGuestDto): Promise<Guest> {
    const guest = await this.findOne(id);
    // Never let the primary key be reassigned through an update.
    const { id: _ignored, ...rest } = dto;
    Object.assign(guest, rest);
    return this.repo.save(guest);
  }

  async remove(id: string): Promise<void> {
    const result = await this.repo.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`Guest ${id} not found`);
    }
  }

  async stats(): Promise<GuestStats> {
    const guests = await this.repo.find();

    const byGuestType = new Map<string, number>();
    const byPriority = new Map<string, number>();
    const bySide = { Groom: 0, Bride: 0 };
    const byRsvp = { Pending: 0, Attending: 0, Declined: 0 };
    let withInvite = 0;

    for (const g of guests) {
      byGuestType.set(g.guestType, (byGuestType.get(g.guestType) ?? 0) + 1);
      const p = g.priority || 'Unclassified';
      byPriority.set(p, (byPriority.get(p) ?? 0) + 1);
      if (g.invitedBy === 'Groom') bySide.Groom += 1;
      if (g.invitedBy === 'Bride') bySide.Bride += 1;
      if (g.rsvpStatus in byRsvp) {
        byRsvp[g.rsvpStatus as keyof typeof byRsvp] += 1;
      }
      if (g.hasInvite) withInvite += 1;
    }

    return {
      total: guests.length,
      withInvite,
      withoutInvite: guests.length - withInvite,
      bySide,
      byRsvp,
      byGuestType: [...byGuestType.entries()]
        .map(([guestType, count]) => ({ guestType, count }))
        .sort((a, b) => b.count - a.count),
      byPriority: [...byPriority.entries()]
        .map(([priority, count]) => ({ priority, count }))
        .sort((a, b) => b.count - a.count),
    };
  }

  /** Compute the next sequential id, e.g. "G-0104". */
  private async nextId(): Promise<string> {
    const guests = await this.repo.find({ select: { id: true } });
    let max = 0;
    for (const g of guests) {
      const match = /^G-(\d+)$/.exec(g.id);
      if (match) {
        max = Math.max(max, Number(match[1]));
      }
    }
    return `G-${String(max + 1).padStart(4, '0')}`;
  }
}
