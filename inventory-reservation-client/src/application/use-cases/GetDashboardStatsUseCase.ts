import type { IReservationRepository } from '../../domain/interfaces/IReservationRepository';
import type { Reservation } from '../../domain/entities/Reservation';

export interface DashboardStats {
  total: number;
  active: number;
  confirmed: number;
  cancelled: number;
  expired: number;
  recent: Reservation[];
}

/**
 * GetDashboardStatsUseCase — fetches all reservations and computes summary stats.
 * SRP: aggregation logic lives here, not scattered across components.
 */
export class GetDashboardStatsUseCase {
  constructor(private readonly repo: IReservationRepository) {}

  async execute(): Promise<DashboardStats> {
    const result = await this.repo.getAll({ limit: 100, offset: 0 });
    const all = result.data;

    const recent = [...all]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 8);

    return {
      total:     result.total,
      active:    all.filter((r) => r.isActive).length,
      confirmed: all.filter((r) => r.isConfirmed).length,
      cancelled: all.filter((r) => r.isCancelled).length,
      expired:   all.filter((r) => r.isExpired).length,
      recent,
    };
  }
}
