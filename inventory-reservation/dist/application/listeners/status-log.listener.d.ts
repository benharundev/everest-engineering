import { Repository } from 'typeorm';
import { ReservationStatusLog } from '../../domain/entities/reservation-status-log.entity';
import { ReservationCreatedEvent } from '../../domain/events/reservation-created.event';
import { ReservationConfirmedEvent } from '../../domain/events/reservation-confirmed.event';
import { ReservationCancelledEvent } from '../../domain/events/reservation-cancelled.event';
import { ReservationExpiredEvent } from '../../domain/events/reservation-expired.event';
export declare class StatusLogListener {
    private readonly repo;
    constructor(repo: Repository<ReservationStatusLog>);
    handleCreated(event: ReservationCreatedEvent): Promise<void>;
    handleConfirmed(event: ReservationConfirmedEvent): Promise<void>;
    handleCancelled(event: ReservationCancelledEvent): Promise<void>;
    handleExpired(event: ReservationExpiredEvent): Promise<void>;
    private log;
}
