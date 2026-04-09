import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DataSource } from 'typeorm';
import { CreateReservationDto } from '../dto/create-reservation.dto';
import { ReservationResponseDto } from '../dto/reservation-response.dto';
import { PaginationDto, PaginatedResult } from '../dto/pagination.dto';
import { Reservation } from '../../domain/entities/reservation.entity';
import { IInventoryRepository, INVENTORY_REPOSITORY } from '../../domain/interfaces/inventory-repository.interface';
import { IReservationRepository, RESERVATION_REPOSITORY } from '../../domain/interfaces/reservation-repository.interface';
import { ReservationStatus } from '../../domain/value-objects/reservation-status.enum';
import { ReservationStatusLog } from '../../domain/entities/reservation-status-log.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OutOfStockException } from '../../domain/exceptions/out-of-stock.exception';
import { RedisStockService } from '../../infrastructure/redis/redis-stock.service';
import { CircuitBreakerService } from '../../infrastructure/circuit-breaker/circuit-breaker.service';
import { MutexService } from '../../infrastructure/mutex/mutex.service';

/**
 * ReservationService — core orchestration layer.
 *
 * Routing strategy:
 *   Circuit CLOSED → Redis Lua Script (primary, sub-ms, atomic)
 *   Circuit OPEN   → In-Memory Mutex + SELECT FOR UPDATE (fallback, still safe)
 *
 * The circuit breaker prevents hammering a dead Redis on every request.
 * The fallback path ensures the flash sale continues even during Redis downtime.
 */
@Injectable()
export class ReservationService {
  private readonly logger = new Logger(ReservationService.name);

  constructor(
    @Inject(INVENTORY_REPOSITORY)
    private readonly inventoryRepo: IInventoryRepository,
    @Inject(RESERVATION_REPOSITORY)
    private readonly reservationRepo: IReservationRepository,
    private readonly redisStock: RedisStockService,
    private readonly circuitBreaker: CircuitBreakerService,
    private readonly mutex: MutexService,
    private readonly events: EventEmitter2,
    private readonly dataSource: DataSource,
    @InjectRepository(ReservationStatusLog)
    private readonly statusLogRepo: Repository<ReservationStatusLog>,
  ) {}

  // ── Reserve ────────────────────────────────────────────────────────────────

  async reserve(dto: CreateReservationDto): Promise<ReservationResponseDto> {
    const { productId, userId, quantity } = dto;

    if (this.circuitBreaker.isOpen()) {
      this.logger.warn(`Circuit open — using DB fallback for product ${productId}`);
      return this.reserveWithFallback(productId, userId, quantity);
    }

    try {
      return await this.reserveWithRedis(productId, userId, quantity);
    } catch (err) {
      // If it's an OutOfStockException, don't record a circuit failure
      if (err instanceof OutOfStockException) throw err;

      this.logger.warn(`Redis reserve failed — recording failure and using fallback: ${err}`);
      this.circuitBreaker.recordFailure();
      return this.reserveWithFallback(productId, userId, quantity);
    }
  }

  /**
   * Primary path: Redis Lua atomic check-and-decrement.
   * Fast, handles thousands of concurrent requests per second.
   */
  private async reserveWithRedis(
    productId: string,
    userId: string,
    quantity: number,
  ): Promise<ReservationResponseDto> {
    const success = await this.redisStock.atomicDecrement(productId, quantity);

    if (!success) {
      const inventory = await this.inventoryRepo.findByProductId(productId);
      const available = inventory?.availableStock ?? 0;
      throw new OutOfStockException(productId, quantity, available);
    }

    this.circuitBreaker.recordSuccess();

    // Persist reservation + update DB activeReservations in one transaction
    const reservation = await this.dataSource.transaction(async (manager) => {
      const inv = await this.inventoryRepo.findByProductIdWithLock(productId, manager);
      if (!inv) {
        // Rollback the Redis decrement before throwing
        await this.redisStock.increment(productId, quantity);
        throw new NotFoundException(`Product ${productId} not found`);
      }

      inv.incrementActiveReservations(quantity);
      await this.inventoryRepo.save(inv, manager);

      const res = Reservation.create(productId, inv.name, userId, quantity);
      return this.reservationRepo.save(res, manager);
    });

    await this.dispatchEvents(reservation);
    return ReservationResponseDto.fromEntity(reservation);
  }

  /**
   * Fallback path: In-Memory Mutex + SELECT FOR UPDATE.
   *
   * Layer 2 (Mutex): serialises concurrent requests within this process.
   * Layer 3 (SELECT FOR UPDATE): cross-process row lock in PostgreSQL.
   * Together they guarantee no overselling even when Redis is unavailable.
   */
  private async reserveWithFallback(
    productId: string,
    userId: string,
    quantity: number,
  ): Promise<ReservationResponseDto> {
    return this.mutex.runExclusive(productId, async () => {
      const reservation = await this.dataSource.transaction(async (manager) => {
        const inventory = await this.inventoryRepo.findByProductIdWithLock(
          productId,
          manager,
        );

        if (!inventory) {
          throw new NotFoundException(`Product ${productId} not found`);
        }

        if (inventory.availableStock < quantity) {
          throw new OutOfStockException(productId, quantity, inventory.availableStock);
        }

        inventory.incrementActiveReservations(quantity);
        await this.inventoryRepo.save(inventory, manager);

        const res = Reservation.create(productId, inventory.name, userId, quantity);
        return this.reservationRepo.save(res, manager);
      });

      await this.dispatchEvents(reservation);
      return ReservationResponseDto.fromEntity(reservation);
    });
  }

  // ── Confirm ────────────────────────────────────────────────────────────────

  async confirm(reservationId: string): Promise<ReservationResponseDto> {
    const reservation = await this.reservationRepo.findById(reservationId);

    if (!reservation) {
      throw new NotFoundException(`Reservation ${reservationId} not found`);
    }

    reservation.confirm(); // throws InvalidStateException if not ACTIVE
    await this.reservationRepo.save(reservation);

    await this.dispatchEvents(reservation);
    return ReservationResponseDto.fromEntity(reservation);
  }

  // ── Cancel ─────────────────────────────────────────────────────────────────

  async cancel(reservationId: string): Promise<ReservationResponseDto> {
    const reservation = await this.reservationRepo.findById(reservationId);

    if (!reservation) {
      throw new NotFoundException(`Reservation ${reservationId} not found`);
    }

    reservation.cancel(); // throws InvalidStateException if not ACTIVE
    await this.reservationRepo.save(reservation);

    await this.dispatchEvents(reservation);
    return ReservationResponseDto.fromEntity(reservation);
  }

  // ── Get All (paginated) ────────────────────────────────────────────────────

  async getAll(
    status?: ReservationStatus,
    pagination: PaginationDto = new PaginationDto(),
  ): Promise<PaginatedResult<ReservationResponseDto>> {
    const [reservations, total] = await this.reservationRepo.findAll(
      status,
      pagination.offset,
      pagination.limit,
    );
    return {
      data: reservations.map(ReservationResponseDto.fromEntity),
      total,
      offset: pagination.offset,
      limit: pagination.limit,
    };
  }

  // ── Get ────────────────────────────────────────────────────────────────────

  async getById(reservationId: string): Promise<ReservationResponseDto> {
    const reservation = await this.reservationRepo.findById(reservationId);

    if (!reservation) {
      throw new NotFoundException(`Reservation ${reservationId} not found`);
    }

    return ReservationResponseDto.fromEntity(reservation);
  }

  // ── Status Logs ────────────────────────────────────────────────────────────

  async getStatusLogs(reservationId: string): Promise<ReservationStatusLog[]> {
    const reservation = await this.reservationRepo.findById(reservationId);
    if (!reservation) {
      throw new NotFoundException(`Reservation ${reservationId} not found`);
    }
    return this.statusLogRepo.find({
      where: { reservationId },
      order: { changedAt: 'ASC' },
    });
  }

  // ── Redis Recovery ─────────────────────────────────────────────────────────

  /**
   * Called when Redis recovers — rehydrates counters from DB before re-enabling
   * the primary path. Stale Redis data must never be re-used.
   */
  async onRedisRecovery(): Promise<void> {
    this.logger.log('Redis recovered — rehydrating stock counters from DB');

    const stocks = await this.inventoryRepo.getAllAvailableStock();

    for (const { productId, availableStock } of stocks) {
      await this.redisStock.setStock(productId, availableStock);
    }

    this.circuitBreaker.reset();
    this.logger.log(`Rehydrated ${stocks.length} product(s) — circuit reset to CLOSED`);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private async dispatchEvents(reservation: Reservation): Promise<void> {
    for (const event of reservation.domainEvents) {
      await this.events.emitAsync(event.constructor.name, event);
    }
    reservation.clearDomainEvents();
  }
}
