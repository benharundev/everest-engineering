import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DataSource, EntityManager } from 'typeorm';
import { ReservationService } from '../../../src/application/services/reservation.service';
import { CircuitBreakerService } from '../../../src/infrastructure/circuit-breaker/circuit-breaker.service';
import { MutexService } from '../../../src/infrastructure/mutex/mutex.service';
import { RedisStockService } from '../../../src/infrastructure/redis/redis-stock.service';
import { INVENTORY_REPOSITORY } from '../../../src/domain/interfaces/inventory-repository.interface';
import { RESERVATION_REPOSITORY } from '../../../src/domain/interfaces/reservation-repository.interface';
import { Inventory } from '../../../src/domain/entities/inventory.entity';
import { Reservation } from '../../../src/domain/entities/reservation.entity';
import { ReservationStatus } from '../../../src/domain/value-objects/reservation-status.enum';
import { OutOfStockException } from '../../../src/domain/exceptions/out-of-stock.exception';
import { InvalidStateException } from '../../../src/domain/exceptions/invalid-state.exception';
import { NotFoundException } from '@nestjs/common';
import { CreateReservationDto } from '../../../src/application/dto/create-reservation.dto';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReservationStatusLog } from '../../../src/domain/entities/reservation-status-log.entity';

const PRODUCT_ID = '11111111-1111-1111-1111-111111111111';
const USER_ID = '22222222-2222-2222-2222-222222222222';

function makeInventory(totalStock: number, active = 0, confirmed = 0): Inventory {
  const inv = new Inventory();
  inv.productId = PRODUCT_ID;
  inv.totalStock = totalStock;
  inv.activeReservations = active;
  inv.confirmedSales = confirmed;
  return inv;
}

describe('ReservationService', () => {
  let service: ReservationService;
  let circuitBreaker: CircuitBreakerService;
  let redisStock: jest.Mocked<RedisStockService>;
  let inventoryRepo: any;
  let reservationRepo: any;
  let dataSource: any;

  beforeEach(async () => {
    // Mock transaction to call the callback with a fake manager
    const fakeManager: Partial<EntityManager> = {} as any;

    inventoryRepo = {
      findByProductId: jest.fn(),
      findByProductIdWithLock: jest.fn(),
      save: jest.fn(),
      getAllAvailableStock: jest.fn(),
    };

    reservationRepo = {
      findAll: jest.fn().mockResolvedValue([[], 0]),
      findById: jest.fn(),
      save: jest.fn().mockImplementation(async (r: Reservation) => r),
      findByProductIdAndStatus: jest.fn(),
    };

    redisStock = {
      atomicDecrement: jest.fn(),
      increment: jest.fn(),
      setStock: jest.fn(),
      getStock: jest.fn(),
      ping: jest.fn(),
    } as any;

    dataSource = {
      transaction: jest.fn().mockImplementation(async (fn: Function) =>
        fn(fakeManager),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationService,
        CircuitBreakerService,
        MutexService,
        { provide: RedisStockService, useValue: redisStock },
        { provide: INVENTORY_REPOSITORY, useValue: inventoryRepo },
        { provide: RESERVATION_REPOSITORY, useValue: reservationRepo },
        { provide: DataSource, useValue: dataSource },
        { provide: EventEmitter2, useValue: { emitAsync: jest.fn() } },
        { provide: getRepositoryToken(ReservationStatusLog), useValue: { find: jest.fn() } },
      ],
    }).compile();

    service = module.get(ReservationService);
    circuitBreaker = module.get(CircuitBreakerService);
  });

  const dto: CreateReservationDto = {
    productId: PRODUCT_ID,
    userId: USER_ID,
    quantity: 1,
  };

  // ── reserve() — Redis path ─────────────────────────────────────────────────

  describe('reserve() — primary Redis path', () => {
    beforeEach(() => {
      const inv = makeInventory(10);
      inventoryRepo.findByProductIdWithLock.mockResolvedValue(inv);
      inventoryRepo.save.mockImplementation(async (i: Inventory) => i);
    });

    it('succeeds when Redis atomicDecrement returns true', async () => {
      redisStock.atomicDecrement.mockResolvedValue(true);

      const result = await service.reserve(dto);

      expect(redisStock.atomicDecrement).toHaveBeenCalledWith(PRODUCT_ID, 1);
      expect(result.status).toBe(ReservationStatus.ACTIVE);
      expect(result.productId).toBe(PRODUCT_ID);
    });

    it('throws OutOfStockException when Redis returns false', async () => {
      redisStock.atomicDecrement.mockResolvedValue(false);
      inventoryRepo.findByProductId.mockResolvedValue(makeInventory(10, 10));

      await expect(service.reserve(dto)).rejects.toThrow(OutOfStockException);
    });

    it('falls back to DB path when Redis throws', async () => {
      redisStock.atomicDecrement.mockRejectedValue(new Error('Redis connection error'));
      const inv = makeInventory(10);
      inventoryRepo.findByProductIdWithLock.mockResolvedValue(inv);
      inventoryRepo.save.mockImplementation(async (i: Inventory) => i);

      const result = await service.reserve(dto);

      expect(result.status).toBe(ReservationStatus.ACTIVE);
    });
  });

  // ── reserve() — Fallback path ──────────────────────────────────────────────

  describe('reserve() — fallback path (circuit open)', () => {
    beforeEach(() => {
      // Force circuit open
      (circuitBreaker as any).state = 'OPEN';
      (circuitBreaker as any).nextAttemptAt = new Date(Date.now() + 60_000);
    });

    it('uses DB path when circuit is open', async () => {
      const inv = makeInventory(10);
      inventoryRepo.findByProductIdWithLock.mockResolvedValue(inv);
      inventoryRepo.save.mockImplementation(async (i: Inventory) => i);

      const result = await service.reserve(dto);

      expect(redisStock.atomicDecrement).not.toHaveBeenCalled();
      expect(result.status).toBe(ReservationStatus.ACTIVE);
    });

    it('throws OutOfStockException when availableStock < quantity', async () => {
      const inv = makeInventory(1, 1); // available = 0
      inventoryRepo.findByProductIdWithLock.mockResolvedValue(inv);

      await expect(service.reserve(dto)).rejects.toThrow(OutOfStockException);
    });

    it('throws NotFoundException when product does not exist', async () => {
      inventoryRepo.findByProductIdWithLock.mockResolvedValue(null);

      await expect(service.reserve(dto)).rejects.toThrow(NotFoundException);
    });
  });

  // ── confirm() ──────────────────────────────────────────────────────────────

  describe('confirm()', () => {
    it('transitions an ACTIVE reservation to CONFIRMED', async () => {
      const reservation = Reservation.create(PRODUCT_ID, 'Test Product', USER_ID, 1);
      reservationRepo.findById.mockResolvedValue(reservation);

      const result = await service.confirm(reservation.id);

      expect(result.status).toBe(ReservationStatus.CONFIRMED);
    });

    it('throws NotFoundException for unknown reservation id', async () => {
      reservationRepo.findById.mockResolvedValue(null);

      await expect(service.confirm('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('propagates InvalidStateException from the entity', async () => {
      const reservation = Reservation.create(PRODUCT_ID, 'Test Product', USER_ID, 1);
      reservation.confirm(); // already confirmed
      reservationRepo.findById.mockResolvedValue(reservation);

      await expect(service.confirm(reservation.id)).rejects.toThrow(InvalidStateException);
    });
  });

  // ── cancel() ───────────────────────────────────────────────────────────────

  describe('cancel()', () => {
    it('transitions an ACTIVE reservation to CANCELLED', async () => {
      const reservation = Reservation.create(PRODUCT_ID, 'Test Product', USER_ID, 1);
      reservationRepo.findById.mockResolvedValue(reservation);

      const result = await service.cancel(reservation.id);

      expect(result.status).toBe(ReservationStatus.CANCELLED);
    });

    it('throws NotFoundException for unknown reservation id', async () => {
      reservationRepo.findById.mockResolvedValue(null);

      await expect(service.cancel('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('propagates InvalidStateException for a CONFIRMED reservation', async () => {
      const reservation = Reservation.create(PRODUCT_ID, 'Test Product', USER_ID, 1);
      reservation.confirm();
      reservationRepo.findById.mockResolvedValue(reservation);

      await expect(service.cancel(reservation.id)).rejects.toThrow(InvalidStateException);
    });
  });

  // ── onRedisRecovery() ──────────────────────────────────────────────────────

  describe('onRedisRecovery()', () => {
    it('rehydrates Redis and resets the circuit breaker', async () => {
      inventoryRepo.getAllAvailableStock.mockResolvedValue([
        { productId: PRODUCT_ID, availableStock: 7 },
      ]);

      // Force open circuit
      (circuitBreaker as any).state = 'OPEN';

      await service.onRedisRecovery();

      expect(redisStock.setStock).toHaveBeenCalledWith(PRODUCT_ID, 7);
      expect(circuitBreaker.getState()).toBe('CLOSED');
    });
  });
});
