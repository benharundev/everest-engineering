import { Injectable, Logger, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DataSource } from 'typeorm';
import { ReservationCancelledEvent } from '../../domain/events/reservation-cancelled.event';
import { ReservationExpiredEvent } from '../../domain/events/reservation-expired.event';
import { ReservationConfirmedEvent } from '../../domain/events/reservation-confirmed.event';
import { IInventoryRepository, INVENTORY_REPOSITORY } from '../../domain/interfaces/inventory-repository.interface';
import { RedisStockService } from '../../infrastructure/redis/redis-stock.service';
import { CircuitBreakerService } from '../../infrastructure/circuit-breaker/circuit-breaker.service';

/**
 * Handles all stock level adjustments triggered by reservation lifecycle events.
 *
 * Each listener is independent — this class owns the "release stock" concern.
 * ReservationService never calls stock methods directly after the initial reserve.
 */
@Injectable()
export class StockReleaseListener {
  private readonly logger = new Logger(StockReleaseListener.name);

  constructor(
    @Inject(INVENTORY_REPOSITORY)
    private readonly inventoryRepo: IInventoryRepository,
    private readonly redisStock: RedisStockService,
    private readonly circuitBreaker: CircuitBreakerService,
    private readonly dataSource: DataSource,
  ) {}

  @OnEvent(ReservationCancelledEvent.name)
  async handleCancelled(event: ReservationCancelledEvent): Promise<void> {
    await this.releaseStock(event.productId, event.quantity);
    this.logger.log(
      `Stock released (cancel): product=${event.productId}, qty=${event.quantity}`,
    );
  }

  @OnEvent(ReservationExpiredEvent.name)
  async handleExpired(event: ReservationExpiredEvent): Promise<void> {
    await this.releaseStock(event.productId, event.quantity);
    this.logger.log(
      `Stock released (expire): product=${event.productId}, qty=${event.quantity}`,
    );
  }

  @OnEvent(ReservationConfirmedEvent.name)
  async handleConfirmed(event: ReservationConfirmedEvent): Promise<void> {
    // On confirmation: move stock from activeReservations → confirmedSales
    await this.dataSource.transaction(async (manager) => {
      const inventory = await this.inventoryRepo.findByProductIdWithLock(
        event.productId,
        manager,
      );
      if (!inventory) {
        this.logger.warn(
          `handleConfirmed: inventory not found for product=${event.productId} — skipping`,
        );
        return;
      }

      inventory.confirmSale(event.quantity);
      await this.inventoryRepo.save(inventory, manager);
    });

    this.logger.log(
      `Stock confirmed as sold: product=${event.productId}, qty=${event.quantity}`,
    );
  }

  private async releaseStock(productId: string, quantity: number): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const inventory = await this.inventoryRepo.findByProductIdWithLock(productId, manager);
      if (!inventory) {
        this.logger.warn(
          `releaseStock: inventory not found for product=${productId} — skipping DB update`,
        );
        return;
      }

      inventory.decrementActiveReservations(quantity);
      await this.inventoryRepo.save(inventory, manager);
    });

    // Also update Redis counter if circuit is healthy
    if (!this.circuitBreaker.isOpen()) {
      try {
        await this.redisStock.increment(productId, quantity);
      } catch (err) {
        this.logger.warn(
          `releaseStock: Redis increment failed for product=${productId}, qty=${quantity} — recording failure: ${err}`,
        );
        this.circuitBreaker.recordFailure();
      }
    }
  }
}
