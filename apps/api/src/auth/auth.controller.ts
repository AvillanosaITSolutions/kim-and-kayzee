import {
  Body,
  Controller,
  Post,
  Get,
  Req,
  Res,
  HttpCode,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { IsString } from 'class-validator';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';
import { parseCookies } from './auth.guard';

class LoginDto {
  @IsString()
  username!: string;

  @IsString()
  password!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): { username: string } {
    if (!this.auth.validateCredentials(dto.username, dto.password)) {
      throw new UnauthorizedException('Invalid username or password');
    }
    const token = this.auth.issueToken(dto.username);
    res.cookie(this.auth.cookieName, token, this.auth.cookieOptions(this.auth.ttlMs));
    return { username: dto.username };
  }

  @Public()
  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response): { ok: true } {
    res.clearCookie(this.auth.cookieName, this.auth.cookieOptions());
    return { ok: true };
  }

  // Reports whether the caller has a valid session. Always 200 so the SPA can
  // decide whether to show the login screen without treating it as an error.
  @Public()
  @Get('me')
  me(@Req() req: Request): { authenticated: boolean; username: string | null } {
    const cookies = parseCookies(req.headers.cookie);
    const username = this.auth.usernameFromToken(cookies[this.auth.cookieName]);
    return { authenticated: Boolean(username), username };
  }
}
