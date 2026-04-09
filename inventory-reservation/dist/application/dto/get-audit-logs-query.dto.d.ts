import { PaginationDto } from './pagination.dto';
import { InventoryAuditAction } from '../../domain/entities/inventory-audit-log.entity';
export declare class GetAuditLogsQueryDto extends PaginationDto {
    action?: InventoryAuditAction;
}
