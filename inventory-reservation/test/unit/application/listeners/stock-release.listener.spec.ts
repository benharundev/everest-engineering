import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, EntityManager } from 'typeorm';
import { StockReleaseListener } from '../../../../src/application/listeners/stock-release.listener';
import { CircuitBreakerService } from '../../../../src/infrastructure/circuit-breaker/circuit-breaker.service';
import { RedisStockService } from '../../../../src/infrastructure/redis/redis-stock.service';
import { INVENTORY_REPOSITORY } from '../../../../src/domain/interfaces/inventory-repository.interface';
import { Inventory } from '../../../../src/domain/entities/inventory.entity';
import { ReservationCancelledEvent } from '../../../../src/domain/events/reservation-cancelled.event';
import { ReservationExpiredEvent } from '../../../../src/domain/events/reservation-expired.event';
import { ReservationConfirmedEvent } from '../../../../src/domain/events/reservation-confirmed.event';

const PRODUCT_ID = '11111111-1111-1111-1111-111111111111';
const RESERVATION_ID = '22222222-2222-2222-2222-222222222222';

function makeInventory(total: number, active: number, confirmed = 0): Inventory {
  const inv = new Inventory();
  inv.productId = PRODUCT_ID;
  inv.totalStock = total;
  inv.activeReservations = active;
  inv.confirmedSales = confirmed;
  return inv;
}

describe('StockReleaseListener', () => {
  let listener: StockReleaseListener;
  let inventoryRepo: any;
  let redisStock: jest.Mocked<RedisStockService>;
  let circuitBreaker: CircuitBreakerService;

  beforeEach(async () => {
    const inv = makeInventory(10, 1);
    inventoryRepo = {
      findByProductId: jest.fn().mockResolvedValue(inv),
      findByProductIdWithLock: jest.fn().mockResolvedValue(inv),
      save: jest.fn().mockImplementation(async (i: Inventory) => i),
    };

    redisStock = {
      increment: jest.fn().mockResolvedValue(undefined),
      atomicDecrement: jest.fn(),
      setStock: jest.fn(),
      getStock: jest.fn(),
      ping: jest.fn(),
    } as any;

    const dataSource = {
      transaction: jest.fn().mockImplementation(async (fn: Function) => fn({} as EntityManager)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockReleaseListener,
        CircuitBreakerService,
        { provide: RedisStockService, useValue: redisStock },
        { provide: INVENTORY_REPOSITORY, useValue: inventoryRepo },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    listener = module.get(StockReleaseListener);
    circuitBreaker = module.get(CircuitBreakerService);
  });

  describe('handleCancelled()', () => {
    it('updates DB and increments Redis when circuit is closed', async () => {
      await listener.handleCancelled(
        new ReservationCancelledEvent(RESERVATION_ID, PRODUCT_ID, 1),
      );

      expect(inventoryRepo.findByProductIdWithLock).toHaveBeenCalled();
      expect(inventoryRepo.save).toHaveBeenCalled();
      expect(redisStock.increment).toHaveBeenCalledWith(PRODUCT_ID, 1);
    });

    it('skips Redis increment when circuit is open', async () => {
      (circuitBreaker as any).state = 'OPEN';
      (circuitBreaker as any).nextAttemptAt = new Date(Date.now() + 60_000);

      await listener.handleCancelled(
        new ReservationCancelledEvent(RESERVATION_ID, PRODUCT_ID, 1),
      );

      expect(redisStock.increment).not.toHaveBeenCalled();
    });

    it('records circuit failure when Redis increment throws', async () => {
      redisStock.increment.mockRejectedValue(new Error('Redis error'));
      const recordFailureSpy = jest.spyOn(circuitBreaker, 'recordFailure');

      await listener.handleCancelled(
        new ReservationCancelledEvent(RESERVATION_ID, PRODUCT_ID, 1),
      );

      expect(recordFailureSpy).toHaveBeenCalled();
    });
  });

  describe('handleExpired()', () => {
    it('updates DB and increments Redis', async () => {
      await listener.handleExpired(
        new ReservationExpiredEvent(RESERVATION_ID, PRODUCT_ID, 1),
      );

      expect(inventoryRepo.save).toHaveBeenCalled();
      expect(redisStock.increment).toHaveBeenCalledWith(PRODUCT_ID, 1);
    });
  });

  describe('handleConfirmed()', () => {
    it('calls confirmSale on inventory and saves', async () => {
      const confirmSpy = jest.spyOn(makeInventory(10, 1), 'confirmSale');
      const inv = makeInventory(10, 1);
      inventoryRepo.findByProductIdWithLock.mockResolvedValue(inv);
      const confirmSaleOnInv = jest.spyOn(inv, 'confirmSale');

      await listener.handleConfirmed(
        new ReservationConfirmedEvent(RESERVATION_ID, PRODUCT_ID, 'user', 1),
      );

      expect(confirmSaleOnInv).toHaveBeenCalledWith(1);
      expect(inventoryRepo.save).toHaveBeenCalled();
      // Redis is NOT touched on confirmation — stock stays the same
      expect(redisStock.increment).not.toHaveBeenCalled();

      confirmSpy.mockRestore();
    });

    it('skips gracefully when inventory not found', async () => {
      inventoryRepo.findByProductIdWithLock.mockResolvedValue(null);

      await expect(
        listener.handleConfirmed(
          new ReservationConfirmedEvent(RESERVATION_ID, PRODUCT_ID, 'user', 1),
        ),
      ).resolves.not.toThrow();
    });
  });
});
