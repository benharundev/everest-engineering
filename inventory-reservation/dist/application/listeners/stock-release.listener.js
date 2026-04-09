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
var StockReleaseListener_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockReleaseListener = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const typeorm_1 = require("typeorm");
const reservation_cancelled_event_1 = require("../../domain/events/reservation-cancelled.event");
const reservation_expired_event_1 = require("../../domain/events/reservation-expired.event");
const reservation_confirmed_event_1 = require("../../domain/events/reservation-confirmed.event");
const inventory_repository_interface_1 = require("../../domain/interfaces/inventory-repository.interface");
const redis_stock_service_1 = require("../../infrastructure/redis/redis-stock.service");
const circuit_breaker_service_1 = require("../../infrastructure/circuit-breaker/circuit-breaker.service");
let StockReleaseListener = StockReleaseListener_1 = class StockReleaseListener {
    constructor(inventoryRepo, redisStock, circuitBreaker, dataSource) {
        this.inventoryRepo = inventoryRepo;
        this.redisStock = redisStock;
        this.circuitBreaker = circuitBreaker;
        this.dataSource = dataSource;
        this.logger = new common_1.Logger(StockReleaseListener_1.name);
    }
    async handleCancelled(event) {
        await this.releaseStock(event.productId, event.quantity);
        this.logger.log(`Stock released (cancel): product=${event.productId}, qty=${event.quantity}`);
    }
    async handleExpired(event) {
        await this.releaseStock(event.productId, event.quantity);
        this.logger.log(`Stock released (expire): product=${event.productId}, qty=${event.quantity}`);
    }
    async handleConfirmed(event) {
        await this.dataSource.transaction(async (manager) => {
            const inventory = await this.inventoryRepo.findByProductIdWithLock(event.productId, manager);
            if (!inventory) {
                this.logger.warn(`handleConfirmed: inventory not found for product=${event.productId} — skipping`);
                return;
            }
            inventory.confirmSale(event.quantity);
            await this.inventoryRepo.save(inventory, manager);
        });
        this.logger.log(`Stock confirmed as sold: product=${event.productId}, qty=${event.quantity}`);
    }
    async releaseStock(productId, quantity) {
        await this.dataSource.transaction(async (manager) => {
            const inventory = await this.inventoryRepo.findByProductIdWithLock(productId, manager);
            if (!inventory) {
                this.logger.warn(`releaseStock: inventory not found for product=${productId} — skipping DB update`);
                return;
            }
            inventory.decrementActiveReservations(quantity);
            await this.inventoryRepo.save(inventory, manager);
        });
        if (!this.circuitBreaker.isOpen()) {
            try {
                await this.redisStock.increment(productId, quantity);
            }
            catch (err) {
                this.logger.warn(`releaseStock: Redis increment failed for product=${productId}, qty=${quantity} — recording failure: ${err}`);
                this.circuitBreaker.recordFailure();
            }
        }
    }
};
exports.StockReleaseListener = StockReleaseListener;
__decorate([
    (0, event_emitter_1.OnEvent)(reservation_cancelled_event_1.ReservationCancelledEvent.name),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [reservation_cancelled_event_1.ReservationCancelledEvent]),
    __metadata("design:returntype", Promise)
], StockReleaseListener.prototype, "handleCancelled", null);
__decorate([
    (0, event_emitter_1.OnEvent)(reservation_expired_event_1.ReservationExpiredEvent.name),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [reservation_expired_event_1.ReservationExpiredEvent]),
    __metadata("design:returntype", Promise)
], StockReleaseListener.prototype, "handleExpired", null);
__decorate([
    (0, event_emitter_1.OnEvent)(reservation_confirmed_event_1.ReservationConfirmedEvent.name),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [reservation_confirmed_event_1.ReservationConfirmedEvent]),
    __metadata("design:returntype", Promise)
], StockReleaseListener.prototype, "handleConfirmed", null);
exports.StockReleaseListener = StockReleaseListener = StockReleaseListener_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(inventory_repository_interface_1.INVENTORY_REPOSITORY)),
    __metadata("design:paramtypes", [Object, redis_stock_service_1.RedisStockService,
        circuit_breaker_service_1.CircuitBreakerService,
        typeorm_1.DataSource])
], StockReleaseListener);
//# sourceMappingURL=stock-release.listener.js.map