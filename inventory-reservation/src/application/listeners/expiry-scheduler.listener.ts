import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ReservationCreatedEvent } from '../../domain/events/reservation-created.event';
import { EXPIRY_QUEUE_NAME, ExpiryJobData } from '../../infrastructure/queue/expiry.queue';
import { RESERVATION_EXPIRY_MS } from '../../domain/entities/reservation.entity';

/**
 * Schedules a delayed BullMQ job to expire a reservation after 2 minutes.
 *
 * Decoupled from ReservationService — the service just emits an event
 * and has no knowledge of timing or queue mechanics.
 */
@Injectable()
export class ExpirySchedulerListener {
  private readonly logger = new Logger(ExpirySchedulerListener.name);

  constructor(
    @InjectQueue(EXPIRY_QUEUE_NAME)
    private readonly expiryQueue: Queue<ExpiryJobData>,
  ) {}

  @OnEvent(ReservationCreatedEvent.name)
  async handleReservationCreated(event: ReservationCreatedEvent): Promise<void> {
    await this.expiryQueue.add(
      'expire',
      { reservationId: event.reservationId },
      {
        delay: RESERVATION_EXPIRY_MS,
        jobId: `expiry:${event.reservationId}`, // Idempotent — no duplicate jobs
        attempts: 3,
        backoff: { type: 'exponential', delay: 1_000 },
        removeOnComplete: true,
        removeOnFail: true, // Remove after exhausting retries to avoid memory leak
      },
    );

    this.logger.debug(
      `Expiry job scheduled for reservation ${event.reservationId} in ${RESERVATION_EXPIRY_MS}ms`,
    );
  }
}
