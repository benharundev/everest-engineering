import type { IReservationRepository } from '../../domain/interfaces/IReservationRepository';
import type { EventBus } from '../../events/EventBus';
import type { Reservation } from '../../domain/entities/Reservation';
import { ReservationCancelledEvent } from '../../domain/events';

export class CancelReservationUseCase {
  constructor(
    private readonly repo: IReservationRepository,
    private readonly events: EventBus,
  ) {}

  async execute(id: string): Promise<Reservation> {
    const reservation = await this.repo.cancel(id);
    this.events.publish(new ReservationCancelledEvent(reservation));
    return reservation;
  }
}
