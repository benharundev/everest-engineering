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
exports.TypeOrmInventoryRepository = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const inventory_entity_1 = require("../../domain/entities/inventory.entity");
let TypeOrmInventoryRepository = class TypeOrmInventoryRepository {
    constructor(repo, dataSource) {
        this.repo = repo;
        this.dataSource = dataSource;
    }
    async findByProductId(productId, manager) {
        const repo = manager ? manager.getRepository(inventory_entity_1.Inventory) : this.repo;
        return repo.findOne({ where: { productId } });
    }
    async findByProductIdWithLock(productId, manager) {
        return manager
            .getRepository(inventory_entity_1.Inventory)
            .createQueryBuilder('inventory')
            .where('inventory.productId = :productId', { productId })
            .setLock('pessimistic_write')
            .getOne();
    }
    async save(inventory, manager) {
        const repo = manager ? manager.getRepository(inventory_entity_1.Inventory) : this.repo;
        return repo.save(inventory);
    }
    async getAllAvailableStock() {
        const rows = await this.repo.find();
        return rows.map((row) => ({
            productId: row.productId,
            availableStock: row.availableStock,
        }));
    }
};
exports.TypeOrmInventoryRepository = TypeOrmInventoryRepository;
exports.TypeOrmInventoryRepository = TypeOrmInventoryRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(inventory_entity_1.Inventory)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.DataSource])
], TypeOrmInventoryRepository);
//# sourceMappingURL=typeorm-inventory.repository.js.map