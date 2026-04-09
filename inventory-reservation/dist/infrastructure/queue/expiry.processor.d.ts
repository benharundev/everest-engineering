import { Job } from 'bull';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Repository } from 'typeorm';
import { ExpiryJobData } from './expiry.queue';
import { Reservation } from '../../domain/entities/reservation.entity';
export declare class ExpiryProcessor {
    private readonly reservationRepo;
    private readonly events;
    private readonly logger;
    constructor(reservationRepo: Repository<Reservation>, events: EventEmitter2);
    handleExpiry(job: Job<ExpiryJobData>): Promise<void>;
}
