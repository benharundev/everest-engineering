import { Injectable, Inject, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryAuditLog, InventoryAuditAction } from '../../domain/entities/inventory-audit-log.entity';
import { IInventoryRepository, INVENTORY_REPOSITORY } from '../../domain/interfaces/inventory-repository.interface';
import { ReservationCreatedEvent } from '../../domain/events/reservation-created.event';
import { ReservationCancelledEvent } from '../../domain/events/reservation-cancelled.event';
import { ReservationExpiredEvent } from '../../domain/events/reservation-expired.event';
import { ReservationConfirmedEvent } from '../../domain/events/reservation-confirmed.event';

@Injectable()
export class InventoryAuditLogListener {
  private readonly logger = new Logger(InventoryAuditLogListener.name);

  constructor(
    @InjectRepository(InventoryAuditLog)
    private readonly repo: Repository<InventoryAuditLog>,
    @Inject(INVENTORY_REPOSITORY)
    private readonly inventoryRepo: IInventoryRepository,
  ) {}

  @OnEvent(ReservationCreatedEvent.name)
  async handleCreated(event: ReservationCreatedEvent): Promise<void> {
    const inv = await this.inventoryRepo.findByProductId(event.productId);
    if (!inv) {
      this.logger.warn(`handleCreated: inventory not found for product=${event.productId}`);
      return;
    }
    const stockAfter = inv.availableStock;
    await this.log({
      productId: event.productId,
      action: InventoryAuditAction.RESERVED,
      quantityDelta: -event.quantity,
      stockBefore: stockAfter + event.quantity,
      stockAfter,
      reservationId: event.reservationId,
    });
  }

  @OnEvent(ReservationCancelledEvent.name)
  async handleCancelled(event: ReservationCancelledEvent): Promise<void> {
    const inv = await this.inventoryRepo.findByProductId(event.productId);
    if (!inv) {
      this.logger.warn(`handleCancelled: inventory not found for product=${event.productId}`);
      return;
    }
    const stockAfter = inv.availableStock;
    await this.log({
      productId: event.productId,
      action: InventoryAuditAction.RELEASED,
      quantityDelta: +event.quantity,
      stockBefore: stockAfter - event.quantity,
      stockAfter,
      reservationId: event.reservationId,
    });
  }

  @OnEvent(ReservationExpiredEvent.name)
  async handleExpired(event: ReservationExpiredEvent): Promise<void> {
    const inv = await this.inventoryRepo.findByProductId(event.productId);
    if (!inv) {
      this.logger.warn(`handleExpired: inventory not found for product=${event.productId}`);
      return;
    }
    const stockAfter = inv.availableStock;
    await this.log({
      productId: event.productId,
      action: InventoryAuditAction.RELEASED,
      quantityDelta: +event.quantity,
      stockBefore: stockAfter - event.quantity,
      stockAfter,
      reservationId: event.reservationId,
    });
  }

  @OnEvent(ReservationConfirmedEvent.name)
  async handleConfirmed(event: ReservationConfirmedEvent): Promise<void> {
    const inv = await this.inventoryRepo.findByProductId(event.productId);
    if (!inv) {
      this.logger.warn(`handleConfirmed: inventory not found for product=${event.productId}`);
      return;
    }
    await this.log({
      productId: event.productId,
      action: InventoryAuditAction.CONFIRMED,
      quantityDelta: 0, // available stock unchanged; confirmedSales incremented internally
      stockBefore: inv.availableStock,
      stockAfter: inv.availableStock,
      reservationId: event.reservationId,
    });
  }

  private async log(data: Omit<InventoryAuditLog, 'id' | 'createdAt'>): Promise<void> {
    await this.repo.save(this.repo.create(data));
  }
}
