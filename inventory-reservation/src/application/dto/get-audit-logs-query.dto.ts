import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from './pagination.dto';
import { InventoryAuditAction } from '../../domain/entities/inventory-audit-log.entity';

export class GetAuditLogsQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: InventoryAuditAction, description: 'Filter by audit action' })
  @IsOptional()
  @IsEnum(InventoryAuditAction)
  action?: InventoryAuditAction;
}
