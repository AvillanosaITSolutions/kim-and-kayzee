import { IsIn, IsOptional, IsString } from 'class-validator';
import type { InvitedBy, RsvpStatus } from '../guest.entity';

/** Filters accepted by GET /guests as query-string params. */
export class QueryGuestsDto {
  /** Free-text search across name fields, id, and tag. */
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['Groom', 'Bride'])
  invitedBy?: InvitedBy;

  @IsOptional()
  @IsString()
  guestType?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsIn(['Pending', 'Attending', 'Declined'])
  rsvpStatus?: RsvpStatus;

  /** "true" / "false" — filter on whether an invite exists. */
  @IsOptional()
  @IsIn(['true', 'false'])
  hasInvite?: string;
}
