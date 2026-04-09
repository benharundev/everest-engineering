import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Security
  app.use(helmet());
  app.enableCors();

  // Structured request/response logging
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Inventory Reservation API')
    .setDescription(
      'Prevents overselling under high concurrency using Redis atomic operations and circuit breaker pattern.',
    )
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Graceful shutdown — drain in-flight requests before exit
  app.enableShutdownHooks();

  const port = parseInt(process.env.PORT ?? '3000', 10);
  await app.listen(port);

  logger.log(`Inventory Reservation API running on http://localhost:${port}`);
  logger.log(`Swagger UI available at http://localhost:${port}/api`);
  logger.log(`Health check at http://localhost:${port}/health`);
}

bootstrap();
