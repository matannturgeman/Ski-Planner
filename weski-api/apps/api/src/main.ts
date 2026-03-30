import 'dotenv/config';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AllExceptionsFilter } from '@libs/server-data-access';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const host = process.env.HOST || 'localhost';

  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useGlobalFilters(new AllExceptionsFilter());

  const config = new DocumentBuilder()
    .setTitle('WeSki Hotels API')
    .setDescription('Hotel search API')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/api', app, document);

  app.enableCors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Origin, Content-Type, Accept',
    credentials: false,
  });

  const globalPrefix = process.env.API_PREFIX || 'api';
  app.setGlobalPrefix(globalPrefix);

  await app.listen(port, host);

  Logger.log(`API running at http://${host}:${port}/${globalPrefix}`);
  Logger.log(`Swagger docs at http://${host}:${port}/api`);
}

bootstrap();
