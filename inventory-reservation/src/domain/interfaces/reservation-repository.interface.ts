import { EntityManager } from 'typeorm';
import { Reservation } from '../entities/reservation.entity';
import { ReservationStatus } from '../value-objects/reservation-status.enum';

export const RESERVATION_REPOSITORY = Symbol('IReservationRepository');

export interface IReservationRepository {
  findAll(
    status?: ReservationStatus,
    offset?: number,
    limit?: number,
  ): Promise<[Reservation[], number]>;

  findById(id: string, manager?: EntityManager): Promise<Reservation | null>;

  save(reservation: Reservation, manager?: EntityManager): Promise<Reservation>;

  findByProductIdAndStatus(
    productId: string,
    status: ReservationStatus,
  ): Promise<Reservation[]>;
}
