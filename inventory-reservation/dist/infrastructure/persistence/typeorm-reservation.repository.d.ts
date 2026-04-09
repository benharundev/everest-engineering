import { EntityManager, Repository } from 'typeorm';
import { Reservation } from '../../domain/entities/reservation.entity';
import { IReservationRepository } from '../../domain/interfaces/reservation-repository.interface';
import { ReservationStatus } from '../../domain/value-objects/reservation-status.enum';
export declare class TypeOrmReservationRepository implements IReservationRepository {
    private readonly repo;
    constructor(repo: Repository<Reservation>);
    findAll(status?: ReservationStatus, offset?: number, limit?: number): Promise<[Reservation[], number]>;
    findById(id: string, manager?: EntityManager): Promise<Reservation | null>;
    save(reservation: Reservation, manager?: EntityManager): Promise<Reservation>;
    findByProductIdAndStatus(productId: string, status: ReservationStatus): Promise<Reservation[]>;
}
