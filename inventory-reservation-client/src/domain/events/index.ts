import { DomainEvent } from './DomainEvent';
import type { Reservation } from '../entities/Reservation';
import type { Inventory } from '../entities/Inventory';

export class ReservationCreatedEvent extends DomainEvent {
  readonly eventName = 'ReservationCreated' as const;
  constructor(
    public readonly reservation: Reservation,
    public readonly customerName: string,
  ) { super(); }
}

export class ReservationConfirmedEvent extends DomainEvent {
  readonly eventName = 'ReservationConfirmed' as const;
  constructor(public readonly reservation: Reservation) { super(); }
}

export class ReservationCancelledEvent extends DomainEvent {
  readonly eventName = 'ReservationCancelled' as const;
  constructor(public readonly reservation: Reservation) { super(); }
}

export class InventorySeededEvent extends DomainEvent {
  readonly eventName = 'InventorySeeded' as const;
  constructor(public readonly inventory: Inventory) { super(); }
}

export { DomainEvent };
