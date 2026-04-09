import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Inventory } from '../../domain/entities/inventory.entity';
import { IInventoryRepository } from '../../domain/interfaces/inventory-repository.interface';

@Injectable()
export class TypeOrmInventoryRepository implements IInventoryRepository {
  constructor(
    @InjectRepository(Inventory)
    private readonly repo: Repository<Inventory>,
    private readonly dataSource: DataSource,
  ) {}

  async findByProductId(
    productId: string,
    manager?: EntityManager,
  ): Promise<Inventory | null> {
    const repo = manager ? manager.getRepository(Inventory) : this.repo;
    return repo.findOne({ where: { productId } });
  }

  /**
   * SELECT FOR UPDATE — pessimistic write lock.
   *
   * Guarantees that two transactions cannot both read, then both write
   * to the same inventory row. The second transaction blocks until the
   * first commits. This is the cross-process safety net.
   */
  async findByProductIdWithLock(
    productId: string,
    manager: EntityManager,
  ): Promise<Inventory | null> {
    return manager
      .getRepository(Inventory)
      .createQueryBuilder('inventory')
      .where('inventory.productId = :productId', { productId })
      .setLock('pessimistic_write')
      .getOne();
  }

  async save(inventory: Inventory, manager?: EntityManager): Promise<Inventory> {
    const repo = manager ? manager.getRepository(Inventory) : this.repo;
    return repo.save(inventory);
  }

  async getAllAvailableStock(): Promise<
    Array<{ productId: string; availableStock: number }>
  > {
    const rows = await this.repo.find();
    return rows.map((row) => ({
      productId: row.productId,
      availableStock: row.availableStock,
    }));
  }
}
