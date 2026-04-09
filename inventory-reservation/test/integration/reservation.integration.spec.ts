/**
 * Integration Tests — Full Reservation Lifecycle
 *
 * These tests wire the full service stack with real domain logic but
 * mocked infrastructure (no real DB or Redis needed). They verify
 * end-to-end flows: reserve → confirm, reserve → cancel, reserve → expire.
 *
 * For true end-to-end tests with real Postgres + Redis, run against
 * docker-compose: `docker-compose up -d && npm run test:integration`
 * (requires setting USE_REAL_INFRA=true environment variable).
 */

import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DataSource } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReservationService } from '../../src/application/services/reservation.service';
import { CircuitBreakerService } from '../../src/infrastructure/circuit-breaker/circuit-breaker.service';
import { MutexService } from '../../src/infrastructure/mutex/mutex.service';
import { RedisStockService } from '../../src/infrastructure/redis/redis-stock.service';
import { INVENTORY_REPOSITORY } from '../../src/domain/interfaces/inventory-repository.interface';
import { RESERVATION_REPOSITORY } from '../../src/domain/interfaces/reservation-repository.interface';
import { Inventory } from '../../src/domain/entities/inventory.entity';
import { Reservation } from '../../src/domain/entities/reservation.entity';
import { ReservationStatusLog } from '../../src/domain/entities/reservation-status-log.entity';
import { ReservationStatus } from '../../src/domain/value-objects/reservation-status.enum';
import { InvalidStateException } from '../../src/domain/exceptions/invalid-state.exception';
import { OutOfStockException } from '../../src/domain/exceptions/out-of-stock.exception';

const PRODUCT_ID = '11111111-1111-1111-1111-111111111111';
const USER_ID = '22222222-2222-2222-2222-222222222222';

describe('Reservation Lifecycle — Integration', () => {
  let service: ReservationService;
  let circuitBreaker: CircuitBreakerService;
  let inventoryRepo: any;
  let reservationRepo: any;
  let redisStock: any;
  let eventEmitter: EventEmitter2;

  const reservationStore = new Map<string, Reservation>();

  beforeEach(async () => {
    reservationStore.clear();

    const inventory = new Inventory();
    inventory.productId = PRODUCT_ID;
    inventory.totalStock = 10;
    inventory.activeReservations = 0;
    inventory.confirmedSales = 0;

    inventoryRepo = {
      findByProductId: jest.fn().mockResolvedValue(inventory),
      findByProductIdWithLock: jest.fn().mockResolvedValue(inventory),
      save: jest.fn().mockImplementation(async (i: Inventory) => i),
      getAllAvailableStock: jest.fn().mockResolvedValue([
        { productId: PRODUCT_ID, availableStock: 10 },
      ]),
    };

    reservationRepo = {
      findById: jest.fn().mockImplementation(async (id: string) =>
        reservationStore.get(id) ?? null,
      ),
      save: jest.fn().mockImplementation(async (r: Reservation) => {
        reservationStore.set(r.id, r);
        return r;
      }),
      findByProductIdAndStatus: jest.fn().mockResolvedValue([]),
    };

    redisStock = {
      atomicDecrement: jest.fn().mockResolvedValue(true),
      increment: jest.fn().mockResolvedValue(undefined),
      setStock: jest.fn().mockResolvedValue(undefined),
      getStock: jest.fn().mockResolvedValue(10),
      ping: jest.fn().mockResolvedValue(true),
    };

    const dataSource = {
      transaction: jest.fn().mockImplementation(async (fn: Function) => fn({})),
    };

    eventEmitter = new EventEmitter2();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationService,
        CircuitBreakerService,
        MutexService,
        { provide: RedisStockService, useValue: redisStock },
        { provide: INVENTORY_REPOSITORY, useValue: inventoryRepo },
        { provide: RESERVATION_REPOSITORY, useValue: reservationRepo },
        { provide: DataSource, useValue: dataSource },
        { provide: EventEmitter2, useValue: eventEmitter },
        { provide: getRepositoryToken(ReservationStatusLog), useValue: { find: jest.fn() } },
      ],
    }).compile();

    service = module.get(ReservationService);
    circuitBreaker = module.get(CircuitBreakerService);
  });

  // ── Lifecycle: Reserve → Confirm ───────────────────────────────────────────

  describe('reserve → confirm', () => {
    it('creates an ACTIVE reservation then confirms it', async () => {
      const created = await service.reserve({
        productId: PRODUCT_ID,
        userId: USER_ID,
        quantity: 1,
      });

      expect(created.status).toBe(ReservationStatus.ACTIVE);

      const confirmed = await service.confirm(created.id);
      expect(confirmed.status).toBe(ReservationStatus.CONFIRMED);
    });

    it('cannot cancel a confirmed reservation', async () => {
      const created = await service.reserve({
        productId: PRODUCT_ID,
        userId: USER_ID,
        quantity: 1,
      });

      await service.confirm(created.id);

      await expect(service.cancel(created.id)).rejects.toThrow(InvalidStateException);
    });

    it('cannot confirm a reservation twice', async () => {
      const created = await service.reserve({
        productId: PRODUCT_ID,
        userId: USER_ID,
        quantity: 1,
      });

      await service.confirm(created.id);

      await expect(service.confirm(created.id)).rejects.toThrow(InvalidStateException);
    });
  });

  // ── Lifecycle: Reserve → Cancel ────────────────────────────────────────────

  describe('reserve → cancel', () => {
    it('creates an ACTIVE reservation then cancels it', async () => {
      const created = await service.reserve({
        productId: PRODUCT_ID,
        userId: USER_ID,
        quantity: 1,
      });

      const cancelled = await service.cancel(created.id);
      expect(cancelled.status).toBe(ReservationStatus.CANCELLED);
    });

    it('cannot confirm a cancelled reservation', async () => {
      const created = await service.reserve({
        productId: PRODUCT_ID,
        userId: USER_ID,
        quantity: 1,
      });

      await service.cancel(created.id);

      await expect(service.confirm(created.id)).rejects.toThrow(InvalidStateException);
    });
  });

  // ── Lifecycle: Reserve → Expire ────────────────────────────────────────────

  describe('reserve → expire (state machine)', () => {
    it('expiring an ACTIVE reservation via the entity transitions to EXPIRED', () => {
      const reservation = Reservation.create(PRODUCT_ID, 'Test Product', USER_ID, 1);
      reservation.expire();
      expect(reservation.status).toBe(ReservationStatus.EXPIRED);
    });

    it('cannot expire a CONFIRMED reservation', () => {
      const reservation = Reservation.create(PRODUCT_ID, 'Test Product', USER_ID, 1);
      reservation.confirm();
      expect(() => reservation.expire()).toThrow(InvalidStateException);
    });

    it('cannot expire a CANCELLED reservation', () => {
      const reservation = Reservation.create(PRODUCT_ID, 'Test Product', USER_ID, 1);
      reservation.cancel();
      expect(() => reservation.expire()).toThrow(InvalidStateException);
    });
  });

  // ── Circuit Breaker Failover ───────────────────────────────────────────────

  describe('circuit breaker — Redis down scenario', () => {
    beforeEach(() => {
      (circuitBreaker as any).state = 'OPEN';
      (circuitBreaker as any).nextAttemptAt = new Date(Date.now() + 60_000);
    });

    it('successfully reserves via fallback when circuit is open', async () => {
      const result = await service.reserve({
        productId: PRODUCT_ID,
        userId: USER_ID,
        quantity: 1,
      });

      expect(redisStock.atomicDecrement).not.toHaveBeenCalled();
      expect(result.status).toBe(ReservationStatus.ACTIVE);
    });

    it('rejects when stock is exhausted even via fallback', async () => {
      const emptyInventory = new Inventory();
      emptyInventory.productId = PRODUCT_ID;
      emptyInventory.totalStock = 5;
      emptyInventory.activeReservations = 5;
      emptyInventory.confirmedSales = 0;

      inventoryRepo.findByProductIdWithLock.mockResolvedValue(emptyInventory);

      await expect(
        service.reserve({ productId: PRODUCT_ID, userId: USER_ID, quantity: 1 }),
      ).rejects.toThrow(OutOfStockException);
    });
  });

  // ── Redis Recovery ─────────────────────────────────────────────────────────

  describe('onRedisRecovery()', () => {
    it('rehydrates Redis and resets circuit breaker to CLOSED', async () => {
      (circuitBreaker as any).state = 'OPEN';

      await service.onRedisRecovery();

      expect(redisStock.setStock).toHaveBeenCalledWith(PRODUCT_ID, 10);
      expect(circuitBreaker.getState()).toBe('CLOSED');
    });
  });
});
