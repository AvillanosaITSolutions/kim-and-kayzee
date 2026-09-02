import {
  Body,
  Controller,
  Post,
  Get,
  Req,
  Res,
  HttpCode,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Matches } from 'class-validator';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';
import { parseCookies } from './auth.guard';

class LoginDto {
  @Matches(/^\d{4}$/, { message: 'PIN must be 4 digits' })
  pin!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): { ok: true } {
    const ip = req.ip ?? 'unknown';
    const wait = this.auth.lockRemainingMs(ip);
    if (wait > 0) {
      throw new HttpException(
        `Too many attempts. Try again in ${Math.ceil(wait / 1000)}s.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    if (!this.auth.validatePin(dto.pin)) {
      this.auth.recordFail(ip);
      throw new UnauthorizedException('Incorrect PIN');
    }
    this.auth.recordSuccess(ip);
    const token = this.auth.issueToken();
    res.cookie(this.auth.cookieName, token, this.auth.cookieOptions(this.auth.ttlMs));
    return { ok: true };
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
