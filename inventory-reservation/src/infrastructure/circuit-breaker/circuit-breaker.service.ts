import { Injectable, Logger } from '@nestjs/common';

export enum CircuitState {
  CLOSED = 'CLOSED',     // Healthy — use Redis primary path
  OPEN = 'OPEN',         // Broken — skip Redis, use DB fallback
  HALF_OPEN = 'HALF_OPEN', // Testing — allow one request through
}

const FAILURE_THRESHOLD = 5;        // Open after this many consecutive failures
const RECOVERY_TIMEOUT_MS = 30_000; // Try half-open after 30 seconds

/**
 * Circuit Breaker — routes traffic based on Redis health.
 *
 * CLOSED → (N failures) → OPEN → (30s) → HALF_OPEN → (success) → CLOSED
 *                                                    → (failure) → OPEN
 *
 * Why not just try/catch?
 * A naive try/catch still attempts Redis on every request, causing each to
 * wait for the full timeout when Redis is down. The circuit breaker tracks
 * failure state and short-circuits instantly — no wait, no wasted DB threads.
 */
@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);

  private state = CircuitState.CLOSED;
  private failureCount = 0;
  private nextAttemptAt: Date | null = null;

  isOpen(): boolean {
    if (this.state === CircuitState.CLOSED) {
      return false;
    }

    if (this.state === CircuitState.OPEN) {
      if (this.nextAttemptAt && Date.now() >= this.nextAttemptAt.getTime()) {
        this.transitionTo(CircuitState.HALF_OPEN);
        return false; // Allow the probe request through
      }
      return true;
    }

    // HALF_OPEN: allow one request to test Redis
    return false;
  }

  recordFailure(): void {
    this.failureCount++;

    if (
      this.state === CircuitState.HALF_OPEN ||
      this.failureCount >= FAILURE_THRESHOLD
    ) {
      this.transitionTo(CircuitState.OPEN);
    }
  }

  recordSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.reset();
    }
  }

  reset(): void {
    this.failureCount = 0;
    this.nextAttemptAt = null;
    this.transitionTo(CircuitState.CLOSED);
  }

  getState(): CircuitState {
    return this.state;
  }

  private transitionTo(next: CircuitState): void {
    if (this.state !== next) {
      this.logger.warn(`Circuit breaker: ${this.state} → ${next}`);
      this.state = next;

      if (next === CircuitState.OPEN) {
        this.failureCount = 0;
        this.nextAttemptAt = new Date(Date.now() + RECOVERY_TIMEOUT_MS);
      }
    }
  }
}
