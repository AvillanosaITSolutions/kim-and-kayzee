import { Transform } from 'class-transformer';
import { IsArray, IsIn, IsOptional, IsString } from 'class-validator';
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

  /**
   * One or more categories to include (matched as OR). Sent as repeated
   * `guestType` query params; a single value is normalised to a one-item array.
   */
  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === '' || value === null
      ? undefined
      : Array.isArray(value)
        ? value
        : [value],
  )
  @IsArray()
  @IsString({ each: true })
  guestType?: string[];

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
