import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InventoryAuditLogListener } from '../../../../src/application/listeners/inventory-audit-log.listener';
import { InventoryAuditLog, InventoryAuditAction } from '../../../../src/domain/entities/inventory-audit-log.entity';
import { INVENTORY_REPOSITORY } from '../../../../src/domain/interfaces/inventory-repository.interface';
import { Inventory } from '../../../../src/domain/entities/inventory.entity';
import { ReservationCreatedEvent } from '../../../../src/domain/events/reservation-created.event';
import { ReservationCancelledEvent } from '../../../../src/domain/events/reservation-cancelled.event';
import { ReservationExpiredEvent } from '../../../../src/domain/events/reservation-expired.event';
import { ReservationConfirmedEvent } from '../../../../src/domain/events/reservation-confirmed.event';

const PRODUCT_ID = '11111111-1111-1111-1111-111111111111';
const RESERVATION_ID = '22222222-2222-2222-2222-222222222222';

function makeInventory(total: number, active: number, confirmed = 0): Inventory {
  const inv = new Inventory();
  inv.productId = PRODUCT_ID;
  inv.totalStock = total;
  inv.activeReservations = active;
  inv.confirmedSales = confirmed;
  return inv;
}

describe('InventoryAuditLogListener', () => {
  let listener: InventoryAuditLogListener;
  let repo: { create: jest.Mock; save: jest.Mock };
  let inventoryRepo: any;

  beforeEach(async () => {
    const logEntry = {};
    repo = {
      create: jest.fn().mockReturnValue(logEntry),
      save: jest.fn().mockResolvedValue(logEntry),
    };

    inventoryRepo = {
      findByProductId: jest.fn().mockResolvedValue(makeInventory(10, 1)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryAuditLogListener,
        { provide: getRepositoryToken(InventoryAuditLog), useValue: repo },
        { provide: INVENTORY_REPOSITORY, useValue: inventoryRepo },
      ],
    }).compile();

    listener = module.get(InventoryAuditLogListener);
  });

  it('logs RESERVED action on reservation created', async () => {
    await listener.handleCreated(new ReservationCreatedEvent(RESERVATION_ID, PRODUCT_ID, 'user', 1, new Date()));

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        action: InventoryAuditAction.RESERVED,
        quantityDelta: -1,
        reservationId: RESERVATION_ID,
        productId: PRODUCT_ID,
      }),
    );
    expect(repo.save).toHaveBeenCalled();
  });

  it('logs RELEASED action on cancellation', async () => {
    await listener.handleCancelled(new ReservationCancelledEvent(RESERVATION_ID, PRODUCT_ID, 2));

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        action: InventoryAuditAction.RELEASED,
        quantityDelta: 2,
        reservationId: RESERVATION_ID,
      }),
    );
  });

  it('logs RELEASED action on expiry', async () => {
    await listener.handleExpired(new ReservationExpiredEvent(RESERVATION_ID, PRODUCT_ID, 1));

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        action: InventoryAuditAction.RELEASED,
        quantityDelta: 1,
      }),
    );
  });

  it('logs CONFIRMED action on confirmation', async () => {
    await listener.handleConfirmed(new ReservationConfirmedEvent(RESERVATION_ID, PRODUCT_ID, 'user', 1));

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        action: InventoryAuditAction.CONFIRMED,
        quantityDelta: 0,
      }),
    );
  });

  it('skips gracefully when inventory not found', async () => {
    inventoryRepo.findByProductId.mockResolvedValue(null);

    await expect(
      listener.handleCreated(new ReservationCreatedEvent(RESERVATION_ID, PRODUCT_ID, 'user', 1, new Date())),
    ).resolves.not.toThrow();

    expect(repo.save).not.toHaveBeenCalled();
  });
});
