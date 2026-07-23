import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Guest } from '../guests/guest.entity';

/**
 * An invitation is a *group* of guests addressed together on one physical/
 * e-invite (e.g. "Mama and Papa" → two guests). Each invitation has its own
 * public page reachable by its unguessable `slug`.
 */
@Entity('invitations')
export class Invitation {
  /** Human-friendly id, e.g. "INV-0001". */
  @PrimaryColumn({ type: 'varchar', length: 16 })
  id!: string;

  /** URL-safe, hard-to-guess key for the public e-invite page. Unique. */
  @Column({ type: 'varchar', unique: true })
  slug!: string;

  /** How the invitation is addressed, e.g. "Kuya Caloy and Ate Joelle". */
  @Column({ type: 'varchar', default: '' })
  addressLabel!: string;

  /** Optional personal note shown on the invite. */
  @Column({ type: 'text', default: '' })
  message!: string;

  @OneToMany(() => Guest, (guest) => guest.invitation)
  members!: Guest[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
