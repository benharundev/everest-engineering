import type { Reservation } from '../entities/Reservation';
import type { ReservationStatus } from '../value-objects/ReservationStatus';

export interface StatusLog {
  id: string;
  reservationId: string;
  previousStatus: ReservationStatus | null;
  newStatus: ReservationStatus;
  changedAt: string;
  reason?: string;
}

export interface GetReservationsParams {
  status?: ReservationStatus;
  offset?: number;
  limit?: number;
}

export interface PaginatedReservations {
  data: Reservation[];
  total: number;
  offset: number;
  limit: number;
}

/**
 * IReservationRepository — DIP abstraction.
 *
 * Use cases depend on this interface, never on the HTTP implementation.
 * Swap ApiReservationRepository with InMemoryReservationRepository for tests.
 */
export interface IReservationRepository {
  getAll(params: GetReservationsParams): Promise<PaginatedReservations>;
  getById(id: string): Promise<Reservation>;
  create(productId: string, userId: string, quantity: number): Promise<Reservation>;
  confirm(id: string): Promise<Reservation>;
  cancel(id: string): Promise<Reservation>;
  getLogs(id: string): Promise<StatusLog[]>;
}
