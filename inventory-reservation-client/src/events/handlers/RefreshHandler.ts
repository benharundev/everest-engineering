import { eventBus } from '../EventBus';

/**
 * RefreshHandler — triggers a global data refresh after any mutating event.
 *
 * EDA: the use case doesn't call triggerRefresh() — it just publishes an event.
 * SRP: this handler only manages the refresh tick — nothing else.
 */
export function registerRefreshHandler(triggerRefresh: () => void): () => void {
  const unsubs = [
    eventBus.subscribe('ReservationCreated',  triggerRefresh),
    eventBus.subscribe('ReservationConfirmed', triggerRefresh),
    eventBus.subscribe('ReservationCancelled', triggerRefresh),
    eventBus.subscribe('InventorySeeded',      triggerRefresh),
  ];

  return () => unsubs.forEach((u) => u());
}
