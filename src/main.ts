import { NestFactory } from '@nestjs/core';
import { urlencoded, json } from 'express';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get<ConfigService>(ConfigService);

  app.useGlobalPipes(new ValidationPipe());
  app.setGlobalPrefix('/api/v1/core');
  app.enableCors();

  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  await app.listen(configService.get<string>('PORT') || 3000);
}
bootstrap();
