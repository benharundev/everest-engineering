import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { ReservationStatus } from '../value-objects/reservation-status.enum';
import { InvalidStateException } from '../exceptions/invalid-state.exception';
import { ReservationCreatedEvent } from '../events/reservation-created.event';
import { ReservationConfirmedEvent } from '../events/reservation-confirmed.event';
import { ReservationCancelledEvent } from '../events/reservation-cancelled.event';
import { ReservationExpiredEvent } from '../events/reservation-expired.event';

export const RESERVATION_EXPIRY_MS = 2 * 60 * 1000; // 2 minutes

/**
 * Reservation aggregate root — enforces all valid state transitions.
 * Domain events are collected here and dispatched by the service layer.
 */
@Entity('reservations')
export class Reservation {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid')
  productId: string;

  @Column({ default: '' })
  productName: string;

  @Column('uuid')
  userId: string;

  @Column('int')
  quantity: number;

  @Column({ type: 'enum', enum: ReservationStatus, default: ReservationStatus.ACTIVE })
  status: ReservationStatus;

  @Column()
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Domain events — not persisted; dispatched by the service after save
  private _domainEvents: object[] = [];

  get domainEvents(): readonly object[] {
    return this._domainEvents;
  }

  clearDomainEvents(): void {
    this._domainEvents = [];
  }

  // ── Factory ────────────────────────────────────────────────────────────────

  static create(productId: string, productName: string, userId: string, quantity: number): Reservation {
    const reservation = new Reservation();
    reservation.id = uuidv4();
    reservation.productId = productId;
    reservation.productName = productName;
    reservation.userId = userId;
    reservation.quantity = quantity;
    reservation.status = ReservationStatus.ACTIVE;
    reservation.expiresAt = new Date(Date.now() + RESERVATION_EXPIRY_MS);
    reservation._domainEvents = [
      new ReservationCreatedEvent(
        reservation.id,
        productId,
        userId,
        quantity,
        reservation.expiresAt,
      ),
    ];
    return reservation;
  }

  // ── State transitions ──────────────────────────────────────────────────────

  confirm(): void {
    if (this.status !== ReservationStatus.ACTIVE) {
      throw new InvalidStateException(this.status, 'confirm');
    }
    this.status = ReservationStatus.CONFIRMED;
    this._domainEvents.push(
      new ReservationConfirmedEvent(this.id, this.productId, this.userId, this.quantity),
    );
  }

  cancel(): void {
    if (this.status !== ReservationStatus.ACTIVE) {
      throw new InvalidStateException(this.status, 'cancel');
    }
    this.status = ReservationStatus.CANCELLED;
    this._domainEvents.push(
      new ReservationCancelledEvent(this.id, this.productId, this.quantity),
    );
  }

  expire(): void {
    if (this.status !== ReservationStatus.ACTIVE) {
      throw new InvalidStateException(this.status, 'expire');
    }
    this.status = ReservationStatus.EXPIRED;
    this._domainEvents.push(
      new ReservationExpiredEvent(this.id, this.productId, this.quantity),
    );
  }
}
