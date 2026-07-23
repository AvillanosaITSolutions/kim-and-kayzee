import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import type { InvitedBy, Priority, RsvpStatus } from '../guest.entity';

export class CreateGuestDto {
  /** Optional — the API generates the next "G-0000" id when omitted. */
  @IsOptional()
  @IsString()
  @MaxLength(16)
  id?: string;

  @IsOptional()
  @IsString()
  includedBy?: string;

  @IsOptional()
  @IsString()
  nameOnInvitation?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  guestType?: string;

  @IsOptional()
  @IsIn(['Important Person', 'Regular', 'Unsure', ''])
  priority?: Priority;

  @IsOptional()
  @IsIn(['Groom', 'Bride'])
  invitedBy?: InvitedBy;

  @IsOptional()
  @IsBoolean()
  hasInvite?: boolean;

  @IsOptional()
  @IsIn(['Pending', 'Attending', 'Declined'])
  rsvpStatus?: RsvpStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
