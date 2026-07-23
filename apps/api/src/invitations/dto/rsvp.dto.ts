import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsString,
  ValidateNested,
} from 'class-validator';
import type { RsvpStatus } from '../../guests/guest.entity';

export class RsvpResponseDto {
  @IsString()
  guestId!: string;

  @IsIn(['Pending', 'Attending', 'Declined'])
  rsvpStatus!: RsvpStatus;
}

/** Body for the public group-RSVP submission on the e-invite page. */
export class SubmitRsvpDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RsvpResponseDto)
  responses!: RsvpResponseDto[];
}
