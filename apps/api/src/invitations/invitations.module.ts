import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Guest } from '../guests/guest.entity';
import { Invitation } from './invitation.entity';
import { InvitationsService } from './invitations.service';
import { InvitationsController } from './invitations.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Invitation, Guest])],
  controllers: [InvitationsController],
  providers: [InvitationsService],
})
export class InvitationsModule {}
