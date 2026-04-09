import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReservationStatusLog } from '../../domain/entities/reservation-status-log.entity';
import { ReservationStatus } from '../../domain/value-objects/reservation-status.enum';
import { ReservationCreatedEvent } from '../../domain/events/reservation-created.event';
import { ReservationConfirmedEvent } from '../../domain/events/reservation-confirmed.event';
import { ReservationCancelledEvent } from '../../domain/events/reservation-cancelled.event';
import { ReservationExpiredEvent } from '../../domain/events/reservation-expired.event';

@Injectable()
export class StatusLogListener {
  constructor(
    @InjectRepository(ReservationStatusLog)
    private readonly repo: Repository<ReservationStatusLog>,
  ) {}

  @OnEvent(ReservationCreatedEvent.name)
  async handleCreated(event: ReservationCreatedEvent): Promise<void> {
    await this.log(event.reservationId, null, ReservationStatus.ACTIVE);
  }

  @OnEvent(ReservationConfirmedEvent.name)
  async handleConfirmed(event: ReservationConfirmedEvent): Promise<void> {
    await this.log(event.reservationId, ReservationStatus.ACTIVE, ReservationStatus.CONFIRMED);
  }

  @OnEvent(ReservationCancelledEvent.name)
  async handleCancelled(event: ReservationCancelledEvent): Promise<void> {
    await this.log(event.reservationId, ReservationStatus.ACTIVE, ReservationStatus.CANCELLED);
  }

  @OnEvent(ReservationExpiredEvent.name)
  async handleExpired(event: ReservationExpiredEvent): Promise<void> {
    await this.log(event.reservationId, ReservationStatus.ACTIVE, ReservationStatus.EXPIRED);
  }

  private async log(
    reservationId: string,
    fromStatus: ReservationStatus | null,
    toStatus: ReservationStatus,
  ): Promise<void> {
    const entry = this.repo.create({ reservationId, fromStatus, toStatus });
    await this.repo.save(entry);
  }
}
