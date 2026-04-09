import { Injectable, Inject, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';

/**
 * Lua script: atomic check-and-decrement.
 *
 * Runs as a single indivisible operation on Redis (single-threaded by design).
 * No other command can interleave between the GET and DECRBY.
 *
 * Returns 1 on success, 0 if insufficient stock.
 */
const ATOMIC_DECREMENT_SCRIPT = `
local stock = tonumber(redis.call('GET', KEYS[1]))
if stock == nil then return -1 end
if stock >= tonumber(ARGV[1]) then
  redis.call('DECRBY', KEYS[1], ARGV[1])
  return 1
end
return 0
`;

@Injectable()
export class RedisStockService {
  private readonly logger = new Logger(RedisStockService.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  /**
   * Atomically checks stock and decrements if sufficient.
   * Returns true on success, false on insufficient stock.
   * Throws on Redis error (caller should record circuit breaker failure).
   */
  async atomicDecrement(productId: string, quantity: number): Promise<boolean> {
    const key = this.stockKey(productId);
    const result = await this.redis.eval(
      ATOMIC_DECREMENT_SCRIPT,
      1,
      key,
      quantity.toString(),
    ) as number;

    if (result === -1) {
      // Key doesn't exist — treat as out of stock
      return false;
    }

    return result === 1;
  }

  /**
   * Increment stock counter — called when a reservation is cancelled or expired.
   */
  async increment(productId: string, quantity: number): Promise<void> {
    await this.redis.incrby(this.stockKey(productId), quantity);
  }

  /**
   * Set stock counter — used for rehydration after Redis recovery.
   */
  async setStock(productId: string, availableStock: number): Promise<void> {
    await this.redis.set(this.stockKey(productId), availableStock);
  }

  async getStock(productId: string): Promise<number | null> {
    const value = await this.redis.get(this.stockKey(productId));
    return value === null ? null : parseInt(value, 10);
  }

  async ping(): Promise<boolean> {
    try {
      const response = await this.redis.ping();
      return response === 'PONG';
    } catch {
      return false;
    }
  }

  private stockKey(productId: string): string {
    return `stock:${productId}`;
  }
}
