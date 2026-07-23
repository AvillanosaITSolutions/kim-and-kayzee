import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { UpdateInvitationDto } from './dto/update-invitation.dto';
import { SubmitRsvpDto } from './dto/rsvp.dto';

@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitations: InvitationsService) {}

  @Get()
  findAll() {
    return this.invitations.findAll();
  }

  // Public lookup for the standalone e-invite page.
  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.invitations.findBySlug(slug);
  }

  // Public group-RSVP submission from the e-invite page.
  @Post('slug/:slug/rsvp')
  submitRsvp(@Param('slug') slug: string, @Body() dto: SubmitRsvpDto) {
    return this.invitations.submitRsvp(slug, dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.invitations.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateInvitationDto) {
    return this.invitations.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateInvitationDto) {
    return this.invitations.update(id, dto);
  }

  @Post(':id/members')
  setMembers(@Param('id') id: string, @Body('memberIds') memberIds: string[]) {
    return this.invitations.setMembers(id, memberIds ?? []);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.invitations.remove(id);
  }
}
