import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Behind nginx/Traefik: trust the proxy so req.ip reflects the real client
  // (X-Forwarded-For) rather than the proxy — needed for the login PIN throttle.
  app.getHttpAdapter().getInstance().set('trust proxy', true);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      // Strip properties that aren't in the DTO (e.g. a full guest object
      // carrying id/createdAt/updatedAt/invitationId) rather than rejecting
      // the request, so clients can safely PATCH back a whole entity.
      whitelist: true,
      transform: true,
    }),
  );

  const origins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim());
  app.enableCors({ origin: origins });

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}/api`);
}

bootstrap();
