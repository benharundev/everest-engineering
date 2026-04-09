import { Body, Controller, Get, Param, Post, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse, ApiBody } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IsString, IsInt, Min, IsNotEmpty, IsUUID } from 'class-validator';
import { InventoryAuditLog } from '../../domain/entities/inventory-audit-log.entity';
import { Inventory } from '../../domain/entities/inventory.entity';
import { GetAuditLogsQueryDto } from '../../application/dto/get-audit-logs-query.dto';
import { PaginatedResult } from '../../application/dto/pagination.dto';
import { RedisStockService } from '../../infrastructure/redis/redis-stock.service';

class UpsertInventoryDto {
  @IsUUID()
  productId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @Min(0)
  totalStock: number;
}

@ApiTags('inventory')
@Controller('inventory')
export class InventoryController {
  constructor(
    @InjectRepository(InventoryAuditLog)
    private readonly auditLogRepo: Repository<InventoryAuditLog>,
    @InjectRepository(Inventory)
    private readonly inventoryRepo: Repository<Inventory>,
    private readonly redisStock: RedisStockService,
  ) {}

  /**
   * Upsert an inventory record and prime the Redis stock counter.
   * Use this to seed products before making reservations.
   * If the product already exists, totalStock is updated and Redis is synced.
   */
  @Post()
  @ApiOperation({ summary: 'Create or update a product inventory record' })
  @ApiBody({ type: UpsertInventoryDto })
  @ApiResponse({ status: 201, description: 'Inventory upserted' })
  async upsertInventory(@Body() dto: UpsertInventoryDto): Promise<Inventory> {
    const existing = await this.inventoryRepo.findOne({
      where: { productId: dto.productId },
    });

    const inventory = existing ?? this.inventoryRepo.create({ productId: dto.productId });
    inventory.name = dto.name;
    inventory.totalStock = dto.totalStock;

    const saved = await this.inventoryRepo.save(inventory);

    // Sync Redis so the primary path sees the correct available stock
    await this.redisStock.setStock(dto.productId, saved.availableStock);

    return saved;
  }

  @Get()
  @ApiOperation({ summary: 'List all inventory records' })
  @ApiResponse({ status: 200, description: 'All inventory' })
  async listInventory(): Promise<Inventory[]> {
    return this.inventoryRepo.find({ order: { updatedAt: 'DESC' } });
  }

  @Get(':productId/audit-logs')
  @ApiOperation({ summary: 'Get inventory audit log for a product' })
  @ApiParam({ name: 'productId', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Paginated inventory audit log' })
  async getAuditLogs(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Query() query: GetAuditLogsQueryDto,
  ): Promise<PaginatedResult<InventoryAuditLog>> {
    const { action, offset = 0, limit = 20 } = query;
    const [data, total] = await this.auditLogRepo.findAndCount({
      where: { productId, ...(action !== undefined ? { action } : {}) },
      order: { createdAt: 'ASC' },
      skip: offset,
      take: limit,
    });
    return { data, total, offset, limit };
  }
}
