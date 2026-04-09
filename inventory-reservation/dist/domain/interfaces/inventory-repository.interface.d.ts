import { EntityManager } from 'typeorm';
import { Inventory } from '../entities/inventory.entity';
export declare const INVENTORY_REPOSITORY: unique symbol;
export interface IInventoryRepository {
    findByProductId(productId: string, manager?: EntityManager): Promise<Inventory | null>;
    findByProductIdWithLock(productId: string, manager: EntityManager): Promise<Inventory | null>;
    save(inventory: Inventory, manager?: EntityManager): Promise<Inventory>;
    getAllAvailableStock(): Promise<Array<{
        productId: string;
        availableStock: number;
    }>>;
}
