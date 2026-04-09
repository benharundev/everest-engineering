import type { IReservationRepository } from '../../domain/interfaces/IReservationRepository';
import type { EventBus } from '../../events/EventBus';
import type { Reservation } from '../../domain/entities/Reservation';
import { ReservationConfirmedEvent } from '../../domain/events';

export class ConfirmReservationUseCase {
  constructor(
    private readonly repo: IReservationRepository,
    private readonly events: EventBus,
  ) {}

  async execute(id: string): Promise<Reservation> {
    const reservation = await this.repo.confirm(id);
    this.events.publish(new ReservationConfirmedEvent(reservation));
    return reservation;
  }
}
