import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bull';
import { ExpirySchedulerListener } from '../../../../src/application/listeners/expiry-scheduler.listener';
import { EXPIRY_QUEUE_NAME } from '../../../../src/infrastructure/queue/expiry.queue';
import { ReservationCreatedEvent } from '../../../../src/domain/events/reservation-created.event';
import { RESERVATION_EXPIRY_MS } from '../../../../src/domain/entities/reservation.entity';

const RESERVATION_ID = '11111111-1111-1111-1111-111111111111';
const PRODUCT_ID = '22222222-2222-2222-2222-222222222222';
const USER_ID = '33333333-3333-3333-3333-333333333333';

describe('ExpirySchedulerListener', () => {
  let listener: ExpirySchedulerListener;
  let queue: { add: jest.Mock };

  beforeEach(async () => {
    queue = { add: jest.fn().mockResolvedValue({}) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpirySchedulerListener,
        { provide: getQueueToken(EXPIRY_QUEUE_NAME), useValue: queue },
      ],
    }).compile();

    listener = module.get(ExpirySchedulerListener);
  });

  it('schedules an expiry job with correct delay and options', async () => {
    const event = new ReservationCreatedEvent(RESERVATION_ID, PRODUCT_ID, USER_ID, 1, new Date());
    await listener.handleReservationCreated(event);

    expect(queue.add).toHaveBeenCalledWith(
      'expire',
      { reservationId: RESERVATION_ID },
      expect.objectContaining({
        delay: RESERVATION_EXPIRY_MS,
        jobId: `expiry:${RESERVATION_ID}`,
        attempts: 3,
        removeOnComplete: true,
        removeOnFail: true,
      }),
    );
  });

  it('uses idempotent jobId to prevent duplicate jobs', async () => {
    const event = new ReservationCreatedEvent(RESERVATION_ID, PRODUCT_ID, USER_ID, 1, new Date());
    await listener.handleReservationCreated(event);
    await listener.handleReservationCreated(event);

    // Both calls use the same jobId — BullMQ deduplicates them
    const calls = queue.add.mock.calls;
    expect(calls[0][2].jobId).toBe(calls[1][2].jobId);
  });
});
