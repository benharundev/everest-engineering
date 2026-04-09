import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, NotFoundException } from '@nestjs/common';
import * as request from 'supertest';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ReservationController } from '../../../src/presentation/controllers/reservation.controller';
import { ReservationService } from '../../../src/application/services/reservation.service';
import { ReservationStatus } from '../../../src/domain/value-objects/reservation-status.enum';
import { OutOfStockException } from '../../../src/domain/exceptions/out-of-stock.exception';
import { InvalidStateException } from '../../../src/domain/exceptions/invalid-state.exception';

const PRODUCT_ID = '11111111-1111-1111-8111-111111111111';
const USER_ID = '22222222-2222-2222-8222-222222222222';
const RESERVATION_ID = '33333333-3333-3333-8333-333333333333';

const mockReservation = {
  id: RESERVATION_ID,
  productId: PRODUCT_ID,
  productName: 'Test Product',
  userId: USER_ID,
  quantity: 1,
  status: ReservationStatus.ACTIVE,
  expiresAt: new Date(Date.now() + 120_000),
  createdAt: new Date(),
};

describe('ReservationController (HTTP)', () => {
  let app: INestApplication;
  let service: jest.Mocked<ReservationService>;

  beforeEach(async () => {
    service = {
      reserve: jest.fn(),
      confirm: jest.fn(),
      cancel: jest.fn(),
      getAll: jest.fn(),
      getById: jest.fn(),
      getStatusLogs: jest.fn(),
      onRedisRecovery: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReservationController],
      providers: [{ provide: ReservationService, useValue: service }],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
  });

  afterEach(() => app.close());

  // ── POST /reservations ──────────────────────────────────────────────────────

  describe('POST /reservations', () => {
    it('returns 201 with the created reservation', async () => {
      service.reserve.mockResolvedValue(mockReservation as any);

      const res = await request(app.getHttpServer())
        .post('/reservations')
        .send({ productId: PRODUCT_ID, userId: USER_ID, quantity: 1 });

      expect(res.status).toBe(201);
      expect(res.body.id).toBe(RESERVATION_ID);
      expect(res.body.status).toBe(ReservationStatus.ACTIVE);
    });

    it('returns 400 when body is invalid (missing userId)', async () => {
      const res = await request(app.getHttpServer())
        .post('/reservations')
        .send({ productId: PRODUCT_ID, quantity: 1 });

      expect(res.status).toBe(400);
    });

    it('returns 400 when quantity is 0', async () => {
      const res = await request(app.getHttpServer())
        .post('/reservations')
        .send({ productId: PRODUCT_ID, userId: USER_ID, quantity: 0 });

      expect(res.status).toBe(400);
    });

    it('returns 400 when quantity exceeds 100', async () => {
      const res = await request(app.getHttpServer())
        .post('/reservations')
        .send({ productId: PRODUCT_ID, userId: USER_ID, quantity: 101 });

      expect(res.status).toBe(400);
    });

    it('returns 400 when productId is not a UUID', async () => {
      const res = await request(app.getHttpServer())
        .post('/reservations')
        .send({ productId: 'not-a-uuid', userId: USER_ID, quantity: 1 });

      expect(res.status).toBe(400);
    });

    it('returns 409 when out of stock', async () => {
      service.reserve.mockRejectedValue(new OutOfStockException(PRODUCT_ID, 1, 0));

      const res = await request(app.getHttpServer())
        .post('/reservations')
        .send({ productId: PRODUCT_ID, userId: USER_ID, quantity: 1 });

      expect(res.status).toBe(409);
    });
  });

  // ── POST /reservations/:id/confirm ──────────────────────────────────────────

  describe('POST /reservations/:id/confirm', () => {
    it('returns 200 on success', async () => {
      service.confirm.mockResolvedValue({
        ...mockReservation,
        status: ReservationStatus.CONFIRMED,
      } as any);

      const res = await request(app.getHttpServer())
        .post(`/reservations/${RESERVATION_ID}/confirm`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(ReservationStatus.CONFIRMED);
    });

    it('returns 404 when reservation not found', async () => {
      service.confirm.mockRejectedValue(new NotFoundException('Not found'));

      const res = await request(app.getHttpServer())
        .post(`/reservations/${RESERVATION_ID}/confirm`);

      expect(res.status).toBe(404);
    });

    it('returns 400 on invalid state transition', async () => {
      service.confirm.mockRejectedValue(
        new InvalidStateException('CONFIRMED', 'confirm'),
      );

      const res = await request(app.getHttpServer())
        .post(`/reservations/${RESERVATION_ID}/confirm`);

      expect(res.status).toBe(400);
    });

    it('returns 400 when id is not a valid UUID', async () => {
      const res = await request(app.getHttpServer())
        .post('/reservations/not-a-uuid/confirm');

      expect(res.status).toBe(400);
    });
  });

  // ── DELETE /reservations/:id ────────────────────────────────────────────────

  describe('DELETE /reservations/:id', () => {
    it('returns 200 on successful cancel', async () => {
      service.cancel.mockResolvedValue({
        ...mockReservation,
        status: ReservationStatus.CANCELLED,
      } as any);

      const res = await request(app.getHttpServer())
        .delete(`/reservations/${RESERVATION_ID}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(ReservationStatus.CANCELLED);
    });

    it('returns 404 when reservation not found', async () => {
      service.cancel.mockRejectedValue(new NotFoundException('Not found'));

      const res = await request(app.getHttpServer())
        .delete(`/reservations/${RESERVATION_ID}`);

      expect(res.status).toBe(404);
    });

    it('returns 400 on invalid state transition (already confirmed)', async () => {
      service.cancel.mockRejectedValue(
        new InvalidStateException('CONFIRMED', 'cancel'),
      );

      const res = await request(app.getHttpServer())
        .delete(`/reservations/${RESERVATION_ID}`);

      expect(res.status).toBe(400);
    });
  });

  // ── GET /reservations ───────────────────────────────────────────────────────

  describe('GET /reservations', () => {
    it('returns paginated result', async () => {
      service.getAll.mockResolvedValue({
        data: [mockReservation as any],
        total: 1,
        offset: 0,
        limit: 20,
      });

      const res = await request(app.getHttpServer()).get('/reservations');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.total).toBe(1);
    });

    it('passes status filter to service', async () => {
      service.getAll.mockResolvedValue({ data: [], total: 0, offset: 0, limit: 20 });

      await request(app.getHttpServer())
        .get(`/reservations?status=${ReservationStatus.ACTIVE}`);

      expect(service.getAll).toHaveBeenCalledWith(
        ReservationStatus.ACTIVE,
        expect.objectContaining({ offset: 0, limit: 20 }),
      );
    });

    it('returns 400 for invalid status value', async () => {
      const res = await request(app.getHttpServer())
        .get('/reservations?status=INVALID_STATUS');

      expect(res.status).toBe(400);
    });
  });

  // ── GET /reservations/:id ───────────────────────────────────────────────────

  describe('GET /reservations/:id', () => {
    it('returns 200 when found', async () => {
      service.getById.mockResolvedValue(mockReservation as any);

      const res = await request(app.getHttpServer())
        .get(`/reservations/${RESERVATION_ID}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(RESERVATION_ID);
    });

    it('returns 404 when not found', async () => {
      service.getById.mockRejectedValue(new NotFoundException('Not found'));

      const res = await request(app.getHttpServer())
        .get(`/reservations/${RESERVATION_ID}`);

      expect(res.status).toBe(404);
    });
  });
});
