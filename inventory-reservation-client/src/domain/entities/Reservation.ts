import type { ReservationStatus } from '../value-objects/ReservationStatus';

/**
 * Reservation — rich domain entity.
 *
 * DDD: owns its own business rules (canConfirm, canCancel, expiry math).
 * Components never compute these — they call entity methods.
 */
export class Reservation {
  constructor(
    readonly id: string,
    readonly productId: string,
    readonly productName: string,
    readonly userId: string,
    readonly quantity: number,
    readonly status: ReservationStatus,
    readonly expiresAt: Date,
    readonly createdAt: Date,
  ) {}

  // ── State queries ────────────────────────────────────────────────────────────

  get isActive(): boolean    { return this.status === 'ACTIVE'; }
  get isConfirmed(): boolean { return this.status === 'CONFIRMED'; }
  get isCancelled(): boolean { return this.status === 'CANCELLED'; }
  get isExpired(): boolean   { return this.status === 'EXPIRED'; }

  // ── Business rules ───────────────────────────────────────────────────────────

  get canConfirm(): boolean { return this.status === 'ACTIVE'; }
  get canCancel(): boolean  { return this.status === 'ACTIVE'; }

  // ── Expiry calculations ──────────────────────────────────────────────────────

  /** 0–100: how much of the reservation window has elapsed */
  get expiryPercentElapsed(): number {
    const total = this.expiresAt.getTime() - this.createdAt.getTime();
    if (total <= 0) return 100;
    const elapsed = Date.now() - this.createdAt.getTime();
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  }

  get timeRemainingMs(): number {
    return Math.max(0, this.expiresAt.getTime() - Date.now());
  }

  // ── Immutable update ─────────────────────────────────────────────────────────

  withStatus(status: ReservationStatus): Reservation {
    return new Reservation(
      this.id, this.productId, this.productName, this.userId,
      this.quantity, status, this.expiresAt, this.createdAt,
    );
  }
}
