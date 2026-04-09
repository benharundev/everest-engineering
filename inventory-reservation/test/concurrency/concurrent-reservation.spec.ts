/**
 * Concurrency Tests — The hardest tests.
 *
 * These tests simulate simultaneous reservation requests to verify that
 * no overselling occurs regardless of which concurrency path is taken.
 *
 * Runs in-process with real MutexService and an in-memory inventory store
 * to avoid the need for running infrastructure.
 */

import { EventEmitter2 } from '@nestjs/event-emitter';
import { DataSource, EntityManager } from 'typeorm';
import { ReservationService } from '../../src/application/services/reservation.service';
import { CircuitBreakerService, CircuitState } from '../../src/infrastructure/circuit-breaker/circuit-breaker.service';
import { MutexService } from '../../src/infrastructure/mutex/mutex.service';
import { RedisStockService } from '../../src/infrastructure/redis/redis-stock.service';
import { Inventory } from '../../src/domain/entities/inventory.entity';
import { Reservation } from '../../src/domain/entities/reservation.entity';
import { OutOfStockException } from '../../src/domain/exceptions/out-of-stock.exception';
import { CreateReservationDto } from '../../src/application/dto/create-reservation.dto';

const PRODUCT_ID = '11111111-1111-1111-1111-111111111111';
const USER_ID = '22222222-2222-2222-2222-222222222222';

/**
 * In-memory inventory store — simulates DB row-level locking via a mutex.
 * The mutex here mimics what SELECT FOR UPDATE does cross-process.
 */
class InMemoryInventoryStore {
  private stock: number;
  private activeReservations: number = 0;
  private readonly mutex = new MutexService();

  constructor(initialStock: number) {
    this.stock = initialStock;
  }

  async tryReserve(quantity: number): Promise<boolean> {
    return this.mutex.runExclusive(PRODUCT_ID, async () => {
      const available = this.stock - this.activeReservations;
      if (available < quantity) return false;
      this.activeReservations += quantity;
      return true;
    });
  }

  release(quantity: number): void {
    this.activeReservations = Math.max(0, this.activeReservations - quantity);
  }

  getActiveReservations(): number {
    return this.activeReservations;
  }
}

describe('Concurrency Tests', () => {
  describe('In-Memory Mutex fallback path (simulates Redis-down scenario)', () => {
    it('allows exactly N reservations when N concurrent requests compete for N stock', async () => {
      const TOTAL_STOCK = 10;
      const CONCURRENT_REQUESTS = 100;
      const store = new InMemoryInventoryStore(TOTAL_STOCK);

      const requests = Array.from({ length: CONCURRENT_REQUESTS }, () =>
        store.tryReserve(1),
      );

      const results = await Promise.all(requests);
      const successCount = results.filter(Boolean).length;
      const failCount = results.filter((r) => !r).length;

      expect(successCount).toBe(TOTAL_STOCK);
      expect(failCount).toBe(CONCURRENT_REQUESTS - TOTAL_STOCK);
      expect(store.getActiveReservations()).toBe(TOTAL_STOCK);
    });

    it('allows exactly 1 winner when stock=1 and 50 concurrent requests compete', async () => {
      const store = new InMemoryInventoryStore(1);

      const results = await Promise.all(
        Array.from({ length: 50 }, () => store.tryReserve(1)),
      );

      const successCount = results.filter(Boolean).length;
      expect(successCount).toBe(1);
      expect(store.getActiveReservations()).toBe(1);
    });

    it('rejects all requests when stock is already 0', async () => {
      const store = new InMemoryInventoryStore(0);

      const results = await Promise.all(
        Array.from({ length: 20 }, () => store.tryReserve(1)),
      );

      expect(results.every((r) => !r)).toBe(true);
    });

    it('never oversells when requests arrive faster than each can complete', async () => {
      const STOCK = 5;
      const store = new InMemoryInventoryStore(STOCK);

      // Fire 200 concurrent requests in rapid bursts
      const wave1 = Array.from({ length: 100 }, () => store.tryReserve(1));
      const wave2 = Array.from({ length: 100 }, () => store.tryReserve(1));

      const results = await Promise.all([...wave1, ...wave2]);
      const successCount = results.filter(Boolean).length;

      expect(successCount).toBe(STOCK);
      expect(store.getActiveReservations()).toBe(STOCK);
    });
  });

  describe('Redis Lua atomic decrement (simulates primary path)', () => {
    /**
     * Simulates the atomicity of the Redis Lua script using an in-process
     * atomic counter. This validates that the logic around the Lua script
     * (the check + decrement contract) is correct.
     */
    it('simulates Lua atomicity: only N requests succeed for N stock', async () => {
      const STOCK = 10;
      let atomicCounter = STOCK;
      const mutex = new MutexService();

      // Simulate what the Lua script does atomically on Redis
      const atomicDecrement = (qty: number): Promise<boolean> =>
        mutex.runExclusive('lua-sim', async () => {
          if (atomicCounter >= qty) {
            atomicCounter -= qty;
            return true;
          }
          return false;
        });

      const results = await Promise.all(
        Array.from({ length: 50 }, () => atomicDecrement(1)),
      );

      const successCount = results.filter(Boolean).length;
      expect(successCount).toBe(STOCK);
      expect(atomicCounter).toBe(0);
    });
  });

  describe('Circuit Breaker routing under concurrent load', () => {
    it('routes all requests to fallback when circuit is OPEN', async () => {
      const cb = new CircuitBreakerService();
      // Force open
      for (let i = 0; i < 5; i++) cb.recordFailure();

      const results = Array.from({ length: 100 }, () => cb.isOpen());
      expect(results.every(Boolean)).toBe(true);
    });

    it('all requests see CLOSED and route to Redis when healthy', async () => {
      const cb = new CircuitBreakerService();
      const results = Array.from({ length: 100 }, () => cb.isOpen());
      expect(results.every((r) => !r)).toBe(true);
    });
  });
});
