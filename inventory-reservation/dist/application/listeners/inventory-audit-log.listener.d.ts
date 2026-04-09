import { Repository } from 'typeorm';
import { InventoryAuditLog } from '../../domain/entities/inventory-audit-log.entity';
import { IInventoryRepository } from '../../domain/interfaces/inventory-repository.interface';
import { ReservationCreatedEvent } from '../../domain/events/reservation-created.event';
import { ReservationCancelledEvent } from '../../domain/events/reservation-cancelled.event';
import { ReservationExpiredEvent } from '../../domain/events/reservation-expired.event';
import { ReservationConfirmedEvent } from '../../domain/events/reservation-confirmed.event';
export declare class InventoryAuditLogListener {
    private readonly repo;
    private readonly inventoryRepo;
    private readonly logger;
    constructor(repo: Repository<InventoryAuditLog>, inventoryRepo: IInventoryRepository);
    handleCreated(event: ReservationCreatedEvent): Promise<void>;
    handleCancelled(event: ReservationCancelledEvent): Promise<void>;
    handleExpired(event: ReservationExpiredEvent): Promise<void>;
    handleConfirmed(event: ReservationConfirmedEvent): Promise<void>;
    private log;
}
