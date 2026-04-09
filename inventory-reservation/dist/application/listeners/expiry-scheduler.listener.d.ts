import { Queue } from 'bull';
import { ReservationCreatedEvent } from '../../domain/events/reservation-created.event';
import { ExpiryJobData } from '../../infrastructure/queue/expiry.queue';
export declare class ExpirySchedulerListener {
    private readonly expiryQueue;
    private readonly logger;
    constructor(expiryQueue: Queue<ExpiryJobData>);
    handleReservationCreated(event: ReservationCreatedEvent): Promise<void>;
}
