import { IsArray, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateInvitationDto {
  @IsOptional()
  @IsString()
  @MaxLength(16)
  id?: string;

  @IsOptional()
  @IsString()
  addressLabel?: string;

  @IsOptional()
  @IsString()
  message?: string;

  /** Guest ids to attach to this invitation on creation. */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  memberIds?: string[];
}
