import type { IInventoryRepository, UpsertInventoryParams } from '../../domain/interfaces/IInventoryRepository';
import type { EventBus } from '../../events/EventBus';
import type { Inventory } from '../../domain/entities/Inventory';
import { InventorySeededEvent } from '../../domain/events';

export class SeedInventoryUseCase {
  constructor(
    private readonly repo: IInventoryRepository,
    private readonly events: EventBus,
  ) {}

  async execute(params: UpsertInventoryParams): Promise<Inventory> {
    const inventory = await this.repo.upsert(params);
    this.events.publish(new InventorySeededEvent(inventory));
    return inventory;
  }

  async getAll(): Promise<Inventory[]> {
    return this.repo.getAll();
  }
}
