"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const class_validator_1 = require("class-validator");
const inventory_audit_log_entity_1 = require("../../domain/entities/inventory-audit-log.entity");
const inventory_entity_1 = require("../../domain/entities/inventory.entity");
const get_audit_logs_query_dto_1 = require("../../application/dto/get-audit-logs-query.dto");
const redis_stock_service_1 = require("../../infrastructure/redis/redis-stock.service");
class UpsertInventoryDto {
}
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], UpsertInventoryDto.prototype, "productId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpsertInventoryDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpsertInventoryDto.prototype, "totalStock", void 0);
let InventoryController = class InventoryController {
    constructor(auditLogRepo, inventoryRepo, redisStock) {
        this.auditLogRepo = auditLogRepo;
        this.inventoryRepo = inventoryRepo;
        this.redisStock = redisStock;
    }
    async upsertInventory(dto) {
        const existing = await this.inventoryRepo.findOne({
            where: { productId: dto.productId },
        });
        const inventory = existing ?? this.inventoryRepo.create({ productId: dto.productId });
        inventory.name = dto.name;
        inventory.totalStock = dto.totalStock;
        const saved = await this.inventoryRepo.save(inventory);
        await this.redisStock.setStock(dto.productId, saved.availableStock);
        return saved;
    }
    async listInventory() {
        return this.inventoryRepo.find({ order: { updatedAt: 'DESC' } });
    }
    async getAuditLogs(productId, query) {
        const { action, offset = 0, limit = 20 } = query;
        const [data, total] = await this.auditLogRepo.findAndCount({
            where: { productId, ...(action !== undefined ? { action } : {}) },
            order: { createdAt: 'ASC' },
            skip: offset,
            take: limit,
        });
        return { data, total, offset, limit };
    }
};
exports.InventoryController = InventoryController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create or update a product inventory record' }),
    (0, swagger_1.ApiBody)({ type: UpsertInventoryDto }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Inventory upserted' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UpsertInventoryDto]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "upsertInventory", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all inventory records' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'All inventory' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "listInventory", null);
__decorate([
    (0, common_1.Get)(':productId/audit-logs'),
    (0, swagger_1.ApiOperation)({ summary: 'Get inventory audit log for a product' }),
    (0, swagger_1.ApiParam)({ name: 'productId', format: 'uuid' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Paginated inventory audit log' }),
    __param(0, (0, common_1.Param)('productId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, get_audit_logs_query_dto_1.GetAuditLogsQueryDto]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getAuditLogs", null);
exports.InventoryController = InventoryController = __decorate([
    (0, swagger_1.ApiTags)('inventory'),
    (0, common_1.Controller)('inventory'),
    __param(0, (0, typeorm_1.InjectRepository)(inventory_audit_log_entity_1.InventoryAuditLog)),
    __param(1, (0, typeorm_1.InjectRepository)(inventory_entity_1.Inventory)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        redis_stock_service_1.RedisStockService])
], InventoryController);
//# sourceMappingURL=inventory.controller.js.map