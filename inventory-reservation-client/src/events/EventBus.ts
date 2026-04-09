import type { DomainEvent } from '../domain/events/DomainEvent';

type Handler<T> = (event: T) => void;

/**
 * EventBus — lightweight pub/sub for domain events.
 *
 * EDA: producers (use cases) publish events.
 *      consumers (AppContext handlers) subscribe independently.
 *      Neither side knows about the other — zero coupling.
 *
 * OCP: add new behaviour by subscribing a new handler, never by
 *      editing the use case that publishes.
 */
export class EventBus {
  private readonly handlers = new Map<string, Handler<unknown>[]>();

  subscribe<T>(eventName: string, handler: Handler<T>): () => void {
    const list = this.handlers.get(eventName) ?? [];
    list.push(handler as Handler<unknown>);
    this.handlers.set(eventName, list);

    // Returns an unsubscribe function
    return () => {
      const current = this.handlers.get(eventName) ?? [];
      this.handlers.set(eventName, current.filter((h) => h !== handler));
    };
  }

  publish<T extends DomainEvent>(event: T): void {
    const list = this.handlers.get(event.eventName) ?? [];
    list.forEach((h) => h(event as unknown));
  }
}

/** Singleton instance — shared across the entire app */
export const eventBus = new EventBus();
