import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BullModule } from '@nestjs/bull';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import * as Joi from 'joi';

import { Reservation } from './domain/entities/reservation.entity';
import { Inventory } from './domain/entities/inventory.entity';
import { ReservationStatusLog } from './domain/entities/reservation-status-log.entity';
import { InventoryAuditLog } from './domain/entities/inventory-audit-log.entity';
import { INVENTORY_REPOSITORY } from './domain/interfaces/inventory-repository.interface';
import { RESERVATION_REPOSITORY } from './domain/interfaces/reservation-repository.interface';

import { RedisModule } from './infrastructure/redis/redis.module';
import { CircuitBreakerModule } from './infrastructure/circuit-breaker/circuit-breaker.module';
import { MutexService } from './infrastructure/mutex/mutex.service';
import { TypeOrmInventoryRepository } from './infrastructure/persistence/typeorm-inventory.repository';
import { TypeOrmReservationRepository } from './infrastructure/persistence/typeorm-reservation.repository';
import { ExpiryProcessor } from './infrastructure/queue/expiry.processor';
import { EXPIRY_QUEUE_NAME } from './infrastructure/queue/expiry.queue';

import { ReservationService } from './application/services/reservation.service';
import { ExpirySchedulerListener } from './application/listeners/expiry-scheduler.listener';
import { StockReleaseListener } from './application/listeners/stock-release.listener';
import { StatusLogListener } from './application/listeners/status-log.listener';
import { InventoryAuditLogListener } from './application/listeners/inventory-audit-log.listener';

import { ReservationController } from './presentation/controllers/reservation.controller';
import { InventoryController } from './presentation/controllers/inventory.controller';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        PORT: Joi.number().default(3000),
        DB_HOST: Joi.string().default('localhost'),
        DB_PORT: Joi.number().default(5432),
        DB_USER: Joi.string().default('inventory'),
        DB_PASS: Joi.string().default('inventory'),
        DB_NAME: Joi.string().default('inventory_reservation'),
        REDIS_HOST: Joi.string().default('localhost'),
        REDIS_PORT: Joi.number().default(6379),
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
      }),
    }),

    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: parseInt(process.env.DB_PORT ?? '5432', 10),
      username: process.env.DB_USER ?? 'inventory',
      password: process.env.DB_PASS ?? 'inventory',
      database: process.env.DB_NAME ?? 'inventory_reservation',
      entities: [Reservation, Inventory, ReservationStatusLog, InventoryAuditLog],
      synchronize: process.env.NODE_ENV !== 'production',
    }),

    TypeOrmModule.forFeature([Reservation, Inventory, ReservationStatusLog, InventoryAuditLog]),

    EventEmitterModule.forRoot({ wildcard: false }),

    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
      },
    }),

    BullModule.registerQueue({ name: EXPIRY_QUEUE_NAME }),

    // Rate limiting: 200 req/min default; individual routes can override
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,
        limit: 200,
      },
    ]),

    RedisModule,
    CircuitBreakerModule,
    HealthModule,
  ],

  controllers: [ReservationController, InventoryController],

  providers: [
    // Global rate limiting guard
    { provide: APP_GUARD, useClass: ThrottlerGuard },

    // Infrastructure
    MutexService,
    {
      provide: INVENTORY_REPOSITORY,
      useClass: TypeOrmInventoryRepository,
    },
    {
      provide: RESERVATION_REPOSITORY,
      useClass: TypeOrmReservationRepository,
    },
    ExpiryProcessor,

    // Application
    ReservationService,
    ExpirySchedulerListener,
    StockReleaseListener,
    StatusLogListener,
    InventoryAuditLogListener,
  ],
})
export class AppModule {}
