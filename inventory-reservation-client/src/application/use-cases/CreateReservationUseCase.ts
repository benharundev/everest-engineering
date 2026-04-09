import type { IReservationRepository } from '../../domain/interfaces/IReservationRepository';
import type { INameStore } from '../../domain/interfaces/INameStore';
import type { EventBus } from '../../events/EventBus';
import type { Reservation } from '../../domain/entities/Reservation';
import { ReservationCreatedEvent } from '../../domain/events';
import { uuid4 } from '../utils/uuid';

/**
 * CreateReservationUseCase — SRP: handles one use case only.
 *
 * 1. Generates a UUID for the new user
 * 2. Persists the name mapping (so UUID → name is resolvable at display time)
 * 3. Calls the repository to create the reservation
 * 4. Publishes a domain event (EDA: side-effects handled by listeners, not here)
 */
export class CreateReservationUseCase {
  constructor(
    private readonly repo: IReservationRepository,    // DIP: interface
    private readonly nameStore: INameStore,            // DIP: interface
    private readonly events: EventBus,
  ) {}

  async execute(customerName: string, productId: string, quantity: number): Promise<Reservation> {
    const userId = uuid4();
    this.nameStore.save(userId, customerName);

    const reservation = await this.repo.create(productId, userId, quantity);

    // EDA: publish — callers don't know who reacts
    this.events.publish(new ReservationCreatedEvent(reservation, customerName));

    return reservation;
  }
}
