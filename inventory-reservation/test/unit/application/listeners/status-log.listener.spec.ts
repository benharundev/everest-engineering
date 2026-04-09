import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { StatusLogListener } from '../../../../src/application/listeners/status-log.listener';
import { ReservationStatusLog } from '../../../../src/domain/entities/reservation-status-log.entity';
import { ReservationStatus } from '../../../../src/domain/value-objects/reservation-status.enum';
import { ReservationCreatedEvent } from '../../../../src/domain/events/reservation-created.event';
import { ReservationConfirmedEvent } from '../../../../src/domain/events/reservation-confirmed.event';
import { ReservationCancelledEvent } from '../../../../src/domain/events/reservation-cancelled.event';
import { ReservationExpiredEvent } from '../../../../src/domain/events/reservation-expired.event';

const RESERVATION_ID = '11111111-1111-1111-1111-111111111111';
const PRODUCT_ID = '22222222-2222-2222-2222-222222222222';

describe('StatusLogListener', () => {
  let listener: StatusLogListener;
  let repo: { create: jest.Mock; save: jest.Mock };

  beforeEach(async () => {
    const entry = {};
    repo = {
      create: jest.fn().mockReturnValue(entry),
      save: jest.fn().mockResolvedValue(entry),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatusLogListener,
        { provide: getRepositoryToken(ReservationStatusLog), useValue: repo },
      ],
    }).compile();

    listener = module.get(StatusLogListener);
  });

  it('logs null → ACTIVE on reservation created', async () => {
    await listener.handleCreated(new ReservationCreatedEvent(RESERVATION_ID, PRODUCT_ID, 'user', 1, new Date()));

    expect(repo.create).toHaveBeenCalledWith({
      reservationId: RESERVATION_ID,
      fromStatus: null,
      toStatus: ReservationStatus.ACTIVE,
    });
    expect(repo.save).toHaveBeenCalledTimes(1);
  });

  it('logs ACTIVE → CONFIRMED on confirmation', async () => {
    await listener.handleConfirmed(new ReservationConfirmedEvent(RESERVATION_ID, PRODUCT_ID, 'user', 1));

    expect(repo.create).toHaveBeenCalledWith({
      reservationId: RESERVATION_ID,
      fromStatus: ReservationStatus.ACTIVE,
      toStatus: ReservationStatus.CONFIRMED,
    });
  });

  it('logs ACTIVE → CANCELLED on cancellation', async () => {
    await listener.handleCancelled(new ReservationCancelledEvent(RESERVATION_ID, PRODUCT_ID, 1));

    expect(repo.create).toHaveBeenCalledWith({
      reservationId: RESERVATION_ID,
      fromStatus: ReservationStatus.ACTIVE,
      toStatus: ReservationStatus.CANCELLED,
    });
  });

  it('logs ACTIVE → EXPIRED on expiry', async () => {
    await listener.handleExpired(new ReservationExpiredEvent(RESERVATION_ID, PRODUCT_ID, 1));

    expect(repo.create).toHaveBeenCalledWith({
      reservationId: RESERVATION_ID,
      fromStatus: ReservationStatus.ACTIVE,
      toStatus: ReservationStatus.EXPIRED,
    });
  });
});
