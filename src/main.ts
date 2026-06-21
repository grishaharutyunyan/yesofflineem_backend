import 'dotenv/config';
import * as path from 'path';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';
import { AppModule } from './app.module';

const logger = new Logger('HTTP');

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use((req: Request, res: Response, next: NextFunction) => {
    const { method, originalUrl } = req;
    const start = Date.now();
    res.on('finish', () => {
      logger.log(`${method} ${originalUrl} ${res.statusCode} +${Date.now() - start}ms`);
    });
    next();
  });
  const config = app.get(ConfigService);

  app.useStaticAssets(path.join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const frontendUrl = config.get<string>('frontendUrl') ?? 'http://localhost:3000';
  app.enableCors({
    origin: frontendUrl,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization',
  });

  const port = config.get<number>('port');
  await app.listen(port);
  logger.log(`Backend running on http://localhost:${port}`);
  logger.log(`CORS allowed origin: ${frontendUrl}`);
}

bootstrap().catch((error: unknown) => {
  logger.error('Failed to start application', error);
  process.exit(1);
});