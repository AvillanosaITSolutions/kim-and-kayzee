import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { buildDataSourceOptions } from './config/data-source-options';
import { GuestsModule } from './guests/guests.module';
import { InvitationsModule } from './invitations/invitations.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(buildDataSourceOptions()),
    AuthModule,
    GuestsModule,
    InvitationsModule,
  ],
})
export class AppModule {}
