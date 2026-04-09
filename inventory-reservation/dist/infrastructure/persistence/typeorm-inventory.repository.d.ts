import { DataSource, EntityManager, Repository } from 'typeorm';
import { Inventory } from '../../domain/entities/inventory.entity';
import { IInventoryRepository } from '../../domain/interfaces/inventory-repository.interface';
export declare class TypeOrmInventoryRepository implements IInventoryRepository {
    private readonly repo;
    private readonly dataSource;
    constructor(repo: Repository<Inventory>, dataSource: DataSource);
    findByProductId(productId: string, manager?: EntityManager): Promise<Inventory | null>;
    findByProductIdWithLock(productId: string, manager: EntityManager): Promise<Inventory | null>;
    save(inventory: Inventory, manager?: EntityManager): Promise<Inventory>;
    getAllAvailableStock(): Promise<Array<{
        productId: string;
        availableStock: number;
    }>>;
}
