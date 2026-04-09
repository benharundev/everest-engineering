import { Processor, Process } from '@nestjs/bull';
import { Logger, NotFoundException } from '@nestjs/common';
import { Job } from 'bull';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EXPIRY_QUEUE_NAME, ExpiryJobData } from './expiry.queue';
import { Reservation } from '../../domain/entities/reservation.entity';
import { InvalidStateException } from '../../domain/exceptions/invalid-state.exception';

/**
 * BullMQ Processor — fires when a 2-minute delayed job matures.
 *
 * Responsibilities:
 *   1. Fetch the reservation
 *   2. Call .expire() — state machine enforces it must be ACTIVE
 *   3. Persist the new EXPIRED status
 *   4. Domain events are dispatched → StockReleaseListener releases stock
 */
@Processor(EXPIRY_QUEUE_NAME)
export class ExpiryProcessor {
  private readonly logger = new Logger(ExpiryProcessor.name);

  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepo: Repository<Reservation>,
    private readonly events: EventEmitter2,
  ) {}

  @Process('expire')
  async handleExpiry(job: Job<ExpiryJobData>): Promise<void> {
    const { reservationId } = job.data;

    const reservation = await this.reservationRepo.findOne({
      where: { id: reservationId },
    });

    if (!reservation) {
      this.logger.warn(`Expiry job: reservation ${reservationId} not found — skipping`);
      return;
    }

    try {
      reservation.expire();
    } catch (err) {
      if (err instanceof InvalidStateException) {
        // Already confirmed or cancelled — this is expected and fine
        this.logger.debug(
          `Expiry job: reservation ${reservationId} already in terminal state (${reservation.status}) — skipping`,
        );
        return;
      }
      throw err;
    }

    await this.reservationRepo.save(reservation);

    for (const event of reservation.domainEvents) {
      await this.events.emitAsync(event.constructor.name, event);
    }
    reservation.clearDomainEvents();

    this.logger.log(`Reservation ${reservationId} expired — stock released`);
  }
}
