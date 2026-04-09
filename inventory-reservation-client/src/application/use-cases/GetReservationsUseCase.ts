import type { IReservationRepository, GetReservationsParams, PaginatedReservations, StatusLog } from '../../domain/interfaces/IReservationRepository';

/**
 * GetReservationsUseCase — SRP: query only, no mutations, no events.
 */
export class GetReservationsUseCase {
  constructor(private readonly repo: IReservationRepository) {}

  async execute(params: GetReservationsParams): Promise<PaginatedReservations> {
    return this.repo.getAll(params);
  }

  async getLogs(id: string): Promise<StatusLog[]> {
    return this.repo.getLogs(id);
  }
}
