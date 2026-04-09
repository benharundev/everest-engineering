import { DataSource } from 'typeorm';
import { ReservationCancelledEvent } from '../../domain/events/reservation-cancelled.event';
import { ReservationExpiredEvent } from '../../domain/events/reservation-expired.event';
import { ReservationConfirmedEvent } from '../../domain/events/reservation-confirmed.event';
import { IInventoryRepository } from '../../domain/interfaces/inventory-repository.interface';
import { RedisStockService } from '../../infrastructure/redis/redis-stock.service';
import { CircuitBreakerService } from '../../infrastructure/circuit-breaker/circuit-breaker.service';
export declare class StockReleaseListener {
    private readonly inventoryRepo;
    private readonly redisStock;
    private readonly circuitBreaker;
    private readonly dataSource;
    private readonly logger;
    constructor(inventoryRepo: IInventoryRepository, redisStock: RedisStockService, circuitBreaker: CircuitBreakerService, dataSource: DataSource);
    handleCancelled(event: ReservationCancelledEvent): Promise<void>;
    handleExpired(event: ReservationExpiredEvent): Promise<void>;
    handleConfirmed(event: ReservationConfirmedEvent): Promise<void>;
    private releaseStock;
}
