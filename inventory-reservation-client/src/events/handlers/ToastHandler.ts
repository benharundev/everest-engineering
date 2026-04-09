import { eventBus } from '../EventBus';
import type {
  ReservationCreatedEvent,
  ReservationConfirmedEvent,
  ReservationCancelledEvent,
  InventorySeededEvent,
} from '../../domain/events';

type ToastFn = (message: string, type?: 'success' | 'error' | 'info') => void;

/**
 * ToastHandler — subscribes to domain events and shows toast notifications.
 *
 * EDA: reacts to events without being coupled to use cases.
 * SRP: only shows toasts — nothing else.
 * OCP: add a new event toast by adding a new subscribe() call here,
 *      never by editing the use case.
 */
export function registerToastHandler(toast: ToastFn): () => void {
  const unsubs = [
    eventBus.subscribe<ReservationCreatedEvent>('ReservationCreated', (e) => {
      toast(`Reserved ${e.reservation.quantity} unit(s) for ${e.customerName}`, 'success');
    }),
    eventBus.subscribe<ReservationConfirmedEvent>('ReservationConfirmed', () => {
      toast('Reservation confirmed.', 'success');
    }),
    eventBus.subscribe<ReservationCancelledEvent>('ReservationCancelled', () => {
      toast('Reservation cancelled.', 'info');
    }),
    eventBus.subscribe<InventorySeededEvent>('InventorySeeded', (e) => {
      toast(`Seeded "${e.inventory.name}" — ${e.inventory.availableStock} units available.`, 'success');
    }),
  ];

  return () => unsubs.forEach((u) => u());
}
