import type { Inventory } from '../entities/Inventory';

export interface UpsertInventoryParams {
  productId: string;
  name: string;
  totalStock: number;
}

/**
 * IInventoryRepository — DIP abstraction for inventory persistence.
 * ISP: focused interface — only inventory concerns here.
 */
export interface IInventoryRepository {
  getAll(): Promise<Inventory[]>;
  upsert(params: UpsertInventoryParams): Promise<Inventory>;
}
