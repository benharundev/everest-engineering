import { EntityManager } from 'typeorm';
import { Inventory } from '../entities/inventory.entity';

export const INVENTORY_REPOSITORY = Symbol('IInventoryRepository');

export interface IInventoryRepository {
  /**
   * Find inventory by productId.
   * Optionally accepts an EntityManager for transactional operations.
   */
  findByProductId(productId: string, manager?: EntityManager): Promise<Inventory | null>;

  /**
   * Find inventory with a pessimistic write lock (SELECT FOR UPDATE).
   * Must be called inside a transaction.
   */
  findByProductIdWithLock(productId: string, manager: EntityManager): Promise<Inventory | null>;

  save(inventory: Inventory, manager?: EntityManager): Promise<Inventory>;

  /**
   * Rehydrate Redis stock counter from DB — called on circuit breaker recovery.
   * Returns a map of productId → availableStock for all products.
   */
  getAllAvailableStock(): Promise<Array<{ productId: string; availableStock: number }>>;
}
