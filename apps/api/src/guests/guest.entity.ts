import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Invitation } from '../invitations/invitation.entity';

/** Which side of the couple invited the guest. */
export type InvitedBy = 'Groom' | 'Bride';

/** How firmly the guest is on the list. Empty string means unclassified. */
export type Priority = 'Important Person' | 'Regular' | 'Unsure' | '';

/** RSVP lifecycle for a guest. Defaults to "Pending" until they respond. */
export type RsvpStatus = 'Pending' | 'Attending' | 'Declined';

@Entity('guests')
export class Guest {
  /** Human-friendly id from the masterlist, e.g. "G-0001". */
  @PrimaryColumn({ type: 'varchar', length: 16 })
  id!: string;

  /** Optional grouping — the person this guest is "included by" / listed under. */
  @Column({ type: 'varchar', default: '' })
  includedBy!: string;

  /** How the name is printed on the physical invitation. */
  @Column({ type: 'varchar', default: '' })
  nameOnInvitation!: string;

  @Column({ type: 'varchar', default: '' })
  firstName!: string;

  @Column({ type: 'varchar', default: '' })
  lastName!: string;

  /** Category with an emoji prefix, e.g. "🥇Family Member", "👞 Abay (Male)". */
  @Column({ type: 'varchar', default: 'Regular Guest' })
  guestType!: string;

  @Column({ type: 'varchar', default: '' })
  priority!: Priority;

  @Column({ type: 'varchar', default: 'Groom' })
  invitedBy!: InvitedBy;

  /** True once a physical invitation exists / has been handed out. */
  @Column({ type: 'boolean', default: false })
  hasInvite!: boolean;

  @Column({ type: 'varchar', default: 'Pending' })
  rsvpStatus!: RsvpStatus;

  @Column({ type: 'text', default: '' })
  notes!: string;

  /** The invitation this guest is grouped under, if any. */
  @Column({ type: 'varchar', nullable: true })
  invitationId!: string | null;

  @ManyToOne(() => Invitation, (invitation) => invitation.members, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'invitationId' })
  invitation?: Invitation | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
