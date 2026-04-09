/**
 * DomainEvent — base class for all domain events.
 *
 * EDA: events are the only communication channel between use cases
 * and side-effect handlers (toasts, refresh, name-store, etc.).
 */
export abstract class DomainEvent {
  readonly occurredAt = new Date();
  abstract readonly eventName: string;
}
