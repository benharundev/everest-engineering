import { Repository } from 'typeorm';
import { InventoryAuditLog } from '../../domain/entities/inventory-audit-log.entity';
import { Inventory } from '../../domain/entities/inventory.entity';
import { GetAuditLogsQueryDto } from '../../application/dto/get-audit-logs-query.dto';
import { PaginatedResult } from '../../application/dto/pagination.dto';
import { RedisStockService } from '../../infrastructure/redis/redis-stock.service';
declare class UpsertInventoryDto {
    productId: string;
    name: string;
    totalStock: number;
}
export declare class InventoryController {
    private readonly auditLogRepo;
    private readonly inventoryRepo;
    private readonly redisStock;
    constructor(auditLogRepo: Repository<InventoryAuditLog>, inventoryRepo: Repository<Inventory>, redisStock: RedisStockService);
    upsertInventory(dto: UpsertInventoryDto): Promise<Inventory>;
    listInventory(): Promise<Inventory[]>;
    getAuditLogs(productId: string, query: GetAuditLogsQueryDto): Promise<PaginatedResult<InventoryAuditLog>>;
}
export {};
