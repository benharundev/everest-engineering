import { Injectable } from '@nestjs/common';
import { Mutex } from 'async-mutex';

/**
 * In-Memory Mutex — Layer 2 of the fallback concurrency guard.
 *
 * Serialises concurrent async operations within a single Node.js process.
 * Used alongside SELECT FOR UPDATE (Layer 3) during Redis downtime.
 *
 * Why mutex alone isn't enough:
 *   Running 3 server instances means 3 separate mutexes — no cross-process
 *   protection. The DB SELECT FOR UPDATE handles the cross-process case.
 *
 * Why mutex is still needed:
 *   Without it, multiple concurrent requests in the same process can all
 *   read the same DB stock value before any of them write — race conditions
 *   within the process that FOR UPDATE alone won't catch in async Node.js.
 */
@Injectable()
export class MutexService {
  private readonly mutexes = new Map<string, Mutex>();

  async runExclusive<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const mutex = this.getOrCreate(key);
    return mutex.runExclusive(fn);
  }

  private getOrCreate(key: string): Mutex {
    if (!this.mutexes.has(key)) {
      this.mutexes.set(key, new Mutex());
    }
    return this.mutexes.get(key)!;
  }
}
