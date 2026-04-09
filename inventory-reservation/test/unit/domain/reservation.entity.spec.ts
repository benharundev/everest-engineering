import { Reservation, RESERVATION_EXPIRY_MS } from '../../../src/domain/entities/reservation.entity';
import { ReservationStatus } from '../../../src/domain/value-objects/reservation-status.enum';
import { InvalidStateException } from '../../../src/domain/exceptions/invalid-state.exception';
import { ReservationCreatedEvent } from '../../../src/domain/events/reservation-created.event';
import { ReservationConfirmedEvent } from '../../../src/domain/events/reservation-confirmed.event';
import { ReservationCancelledEvent } from '../../../src/domain/events/reservation-cancelled.event';
import { ReservationExpiredEvent } from '../../../src/domain/events/reservation-expired.event';

describe('Reservation Entity — State Machine', () => {
  const PRODUCT_ID = '11111111-1111-1111-1111-111111111111';
  const USER_ID = '22222222-2222-2222-2222-222222222222';
  const QUANTITY = 2;

  function makeReservation(): Reservation {
    return Reservation.create(PRODUCT_ID, 'Test Product', USER_ID, QUANTITY);
  }

  // ── Creation ───────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('creates a reservation with ACTIVE status', () => {
      const reservation = makeReservation();
      expect(reservation.status).toBe(ReservationStatus.ACTIVE);
    });

    it('assigns a UUID id', () => {
      const reservation = makeReservation();
      expect(reservation.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it('sets expiresAt to ~2 minutes from now', () => {
      const before = Date.now();
      const reservation = makeReservation();
      const after = Date.now();

      const expiresMs = reservation.expiresAt.getTime();
      expect(expiresMs).toBeGreaterThanOrEqual(before + RESERVATION_EXPIRY_MS);
      expect(expiresMs).toBeLessThanOrEqual(after + RESERVATION_EXPIRY_MS);
    });

    it('emits exactly one ReservationCreatedEvent', () => {
      const reservation = makeReservation();
      expect(reservation.domainEvents).toHaveLength(1);
      expect(reservation.domainEvents[0]).toBeInstanceOf(ReservationCreatedEvent);
    });

    it('includes correct data in the created event', () => {
      const reservation = makeReservation();
      const event = reservation.domainEvents[0] as ReservationCreatedEvent;
      expect(event.reservationId).toBe(reservation.id);
      expect(event.productId).toBe(PRODUCT_ID);
      expect(event.userId).toBe(USER_ID);
      expect(event.quantity).toBe(QUANTITY);
    });
  });

  // ── Confirm ────────────────────────────────────────────────────────────────

  describe('confirm()', () => {
    it('transitions ACTIVE → CONFIRMED', () => {
      const reservation = makeReservation();
      reservation.confirm();
      expect(reservation.status).toBe(ReservationStatus.CONFIRMED);
    });

    it('emits a ReservationConfirmedEvent', () => {
      const reservation = makeReservation();
      reservation.clearDomainEvents();
      reservation.confirm();
      expect(reservation.domainEvents).toHaveLength(1);
      expect(reservation.domainEvents[0]).toBeInstanceOf(ReservationConfirmedEvent);
    });

    it('throws InvalidStateException when already CONFIRMED', () => {
      const reservation = makeReservation();
      reservation.confirm();
      expect(() => reservation.confirm()).toThrow(InvalidStateException);
    });

    it('throws InvalidStateException when CANCELLED', () => {
      const reservation = makeReservation();
      reservation.cancel();
      expect(() => reservation.confirm()).toThrow(InvalidStateException);
    });

    it('throws InvalidStateException when EXPIRED', () => {
      const reservation = makeReservation();
      reservation.expire();
      expect(() => reservation.confirm()).toThrow(InvalidStateException);
    });
  });

  // ── Cancel ─────────────────────────────────────────────────────────────────

  describe('cancel()', () => {
    it('transitions ACTIVE → CANCELLED', () => {
      const reservation = makeReservation();
      reservation.cancel();
      expect(reservation.status).toBe(ReservationStatus.CANCELLED);
    });

    it('emits a ReservationCancelledEvent', () => {
      const reservation = makeReservation();
      reservation.clearDomainEvents();
      reservation.cancel();
      expect(reservation.domainEvents).toHaveLength(1);
      expect(reservation.domainEvents[0]).toBeInstanceOf(ReservationCancelledEvent);
    });

    it('throws InvalidStateException when already CANCELLED', () => {
      const reservation = makeReservation();
      reservation.cancel();
      expect(() => reservation.cancel()).toThrow(InvalidStateException);
    });

    it('throws InvalidStateException when CONFIRMED', () => {
      const reservation = makeReservation();
      reservation.confirm();
      expect(() => reservation.cancel()).toThrow(InvalidStateException);
    });
  });

  // ── Expire ─────────────────────────────────────────────────────────────────

  describe('expire()', () => {
    it('transitions ACTIVE → EXPIRED', () => {
      const reservation = makeReservation();
      reservation.expire();
      expect(reservation.status).toBe(ReservationStatus.EXPIRED);
    });

    it('emits a ReservationExpiredEvent', () => {
      const reservation = makeReservation();
      reservation.clearDomainEvents();
      reservation.expire();
      expect(reservation.domainEvents).toHaveLength(1);
      expect(reservation.domainEvents[0]).toBeInstanceOf(ReservationExpiredEvent);
    });

    it('throws InvalidStateException when CONFIRMED', () => {
      const reservation = makeReservation();
      reservation.confirm();
      expect(() => reservation.expire()).toThrow(InvalidStateException);
    });

    it('throws InvalidStateException when CANCELLED', () => {
      const reservation = makeReservation();
      reservation.cancel();
      expect(() => reservation.expire()).toThrow(InvalidStateException);
    });

    it('throws InvalidStateException when already EXPIRED', () => {
      const reservation = makeReservation();
      reservation.expire();
      expect(() => reservation.expire()).toThrow(InvalidStateException);
    });
  });

  // ── Domain Events ──────────────────────────────────────────────────────────

  describe('clearDomainEvents()', () => {
    it('clears all collected events', () => {
      const reservation = makeReservation();
      reservation.clearDomainEvents();
      expect(reservation.domainEvents).toHaveLength(0);
    });
  });
});
