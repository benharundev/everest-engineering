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
var InventoryAuditLogListener_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryAuditLogListener = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const inventory_audit_log_entity_1 = require("../../domain/entities/inventory-audit-log.entity");
const inventory_repository_interface_1 = require("../../domain/interfaces/inventory-repository.interface");
const reservation_created_event_1 = require("../../domain/events/reservation-created.event");
const reservation_cancelled_event_1 = require("../../domain/events/reservation-cancelled.event");
const reservation_expired_event_1 = require("../../domain/events/reservation-expired.event");
const reservation_confirmed_event_1 = require("../../domain/events/reservation-confirmed.event");
let InventoryAuditLogListener = InventoryAuditLogListener_1 = class InventoryAuditLogListener {
    constructor(repo, inventoryRepo) {
        this.repo = repo;
        this.inventoryRepo = inventoryRepo;
        this.logger = new common_1.Logger(InventoryAuditLogListener_1.name);
    }
    async handleCreated(event) {
        const inv = await this.inventoryRepo.findByProductId(event.productId);
        if (!inv) {
            this.logger.warn(`handleCreated: inventory not found for product=${event.productId}`);
            return;
        }
        const stockAfter = inv.availableStock;
        await this.log({
            productId: event.productId,
            action: inventory_audit_log_entity_1.InventoryAuditAction.RESERVED,
            quantityDelta: -event.quantity,
            stockBefore: stockAfter + event.quantity,
            stockAfter,
            reservationId: event.reservationId,
        });
    }
    async handleCancelled(event) {
        const inv = await this.inventoryRepo.findByProductId(event.productId);
        if (!inv) {
            this.logger.warn(`handleCancelled: inventory not found for product=${event.productId}`);
            return;
        }
        const stockAfter = inv.availableStock;
        await this.log({
            productId: event.productId,
            action: inventory_audit_log_entity_1.InventoryAuditAction.RELEASED,
            quantityDelta: +event.quantity,
            stockBefore: stockAfter - event.quantity,
            stockAfter,
            reservationId: event.reservationId,
        });
    }
    async handleExpired(event) {
        const inv = await this.inventoryRepo.findByProductId(event.productId);
        if (!inv) {
            this.logger.warn(`handleExpired: inventory not found for product=${event.productId}`);
            return;
        }
        const stockAfter = inv.availableStock;
        await this.log({
            productId: event.productId,
            action: inventory_audit_log_entity_1.InventoryAuditAction.RELEASED,
            quantityDelta: +event.quantity,
            stockBefore: stockAfter - event.quantity,
            stockAfter,
            reservationId: event.reservationId,
        });
    }
    async handleConfirmed(event) {
        const inv = await this.inventoryRepo.findByProductId(event.productId);
        if (!inv) {
            this.logger.warn(`handleConfirmed: inventory not found for product=${event.productId}`);
            return;
        }
        await this.log({
            productId: event.productId,
            action: inventory_audit_log_entity_1.InventoryAuditAction.CONFIRMED,
            quantityDelta: 0,
            stockBefore: inv.availableStock,
            stockAfter: inv.availableStock,
            reservationId: event.reservationId,
        });
    }
    async log(data) {
        await this.repo.save(this.repo.create(data));
    }
};
exports.InventoryAuditLogListener = InventoryAuditLogListener;
__decorate([
    (0, event_emitter_1.OnEvent)(reservation_created_event_1.ReservationCreatedEvent.name),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [reservation_created_event_1.ReservationCreatedEvent]),
    __metadata("design:returntype", Promise)
], InventoryAuditLogListener.prototype, "handleCreated", null);
__decorate([
    (0, event_emitter_1.OnEvent)(reservation_cancelled_event_1.ReservationCancelledEvent.name),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [reservation_cancelled_event_1.ReservationCancelledEvent]),
    __metadata("design:returntype", Promise)
], InventoryAuditLogListener.prototype, "handleCancelled", null);
__decorate([
    (0, event_emitter_1.OnEvent)(reservation_expired_event_1.ReservationExpiredEvent.name),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [reservation_expired_event_1.ReservationExpiredEvent]),
    __metadata("design:returntype", Promise)
], InventoryAuditLogListener.prototype, "handleExpired", null);
__decorate([
    (0, event_emitter_1.OnEvent)(reservation_confirmed_event_1.ReservationConfirmedEvent.name),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [reservation_confirmed_event_1.ReservationConfirmedEvent]),
    __metadata("design:returntype", Promise)
], InventoryAuditLogListener.prototype, "handleConfirmed", null);
exports.InventoryAuditLogListener = InventoryAuditLogListener = InventoryAuditLogListener_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(inventory_audit_log_entity_1.InventoryAuditLog)),
    __param(1, (0, common_1.Inject)(inventory_repository_interface_1.INVENTORY_REPOSITORY)),
    __metadata("design:paramtypes", [typeorm_2.Repository, Object])
], InventoryAuditLogListener);
//# sourceMappingURL=inventory-audit-log.listener.js.map