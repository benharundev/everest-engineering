import { HttpClient } from './http/HttpClient';
import { ApiReservationRepository } from './repositories/ApiReservationRepository';
import { ApiInventoryRepository } from './repositories/ApiInventoryRepository';
import { LocalStorageNameStore } from './stores/LocalStorageNameStore';
import { eventBus } from '../events/EventBus';

import { CreateReservationUseCase }  from '../application/use-cases/CreateReservationUseCase';
import { ConfirmReservationUseCase } from '../application/use-cases/ConfirmReservationUseCase';
import { CancelReservationUseCase }  from '../application/use-cases/CancelReservationUseCase';
import { GetReservationsUseCase }    from '../application/use-cases/GetReservationsUseCase';
import { GetDashboardStatsUseCase }  from '../application/use-cases/GetDashboardStatsUseCase';
import { SeedInventoryUseCase }      from '../application/use-cases/SeedInventoryUseCase';
import { SimulationService }         from '../application/services/SimulationService';

/**
 * DI Container — the ONLY place that knows which concrete class
 * implements which interface. Everything else depends on abstractions.
 *
 * DIP: wires interface tokens to implementations.
 * SRP: wiring is its only responsibility.
 *
 * To swap PostgreSQL → MongoDB: change ApiReservationRepository here.
 * Nothing else in the codebase changes.
 */

// ── Infrastructure ────────────────────────────────────────────────────────────

const httpClient = new HttpClient(
  () => localStorage.getItem('api_base') ?? 'http://localhost:3000'
);

const reservationRepo = new ApiReservationRepository(httpClient);
const inventoryRepo   = new ApiInventoryRepository(httpClient);
const nameStore       = new LocalStorageNameStore();

// ── Use Cases ─────────────────────────────────────────────────────────────────

export const container = {
  createReservation:    new CreateReservationUseCase(reservationRepo, nameStore, eventBus),
  confirmReservation:   new ConfirmReservationUseCase(reservationRepo, eventBus),
  cancelReservation:    new CancelReservationUseCase(reservationRepo, eventBus),
  getReservations:      new GetReservationsUseCase(reservationRepo),
  getDashboardStats:    new GetDashboardStatsUseCase(reservationRepo),
  seedInventory:        new SeedInventoryUseCase(inventoryRepo, eventBus),
  simulation:           new SimulationService(reservationRepo, nameStore),

  // Expose nameStore for display resolution in components
  nameStore,
};

// Health check helper — used by AppContext
export function checkHealth(): Promise<boolean> {
  return httpClient
    .request('GET', '/reservations?limit=1')
    .then((r) => r.ok || r.status < 500)
    .catch(() => false);
}
