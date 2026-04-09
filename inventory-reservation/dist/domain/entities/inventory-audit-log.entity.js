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
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryAuditLog = exports.InventoryAuditAction = void 0;
const typeorm_1 = require("typeorm");
var InventoryAuditAction;
(function (InventoryAuditAction) {
    InventoryAuditAction["RESERVED"] = "RESERVED";
    InventoryAuditAction["RELEASED"] = "RELEASED";
    InventoryAuditAction["CONFIRMED"] = "CONFIRMED";
    InventoryAuditAction["REHYDRATED"] = "REHYDRATED";
})(InventoryAuditAction || (exports.InventoryAuditAction = InventoryAuditAction = {}));
let InventoryAuditLog = class InventoryAuditLog {
};
exports.InventoryAuditLog = InventoryAuditLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], InventoryAuditLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    __metadata("design:type", String)
], InventoryAuditLog.prototype, "productId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: InventoryAuditAction }),
    __metadata("design:type", String)
], InventoryAuditLog.prototype, "action", void 0);
__decorate([
    (0, typeorm_1.Column)('int'),
    __metadata("design:type", Number)
], InventoryAuditLog.prototype, "quantityDelta", void 0);
__decorate([
    (0, typeorm_1.Column)('int'),
    __metadata("design:type", Number)
], InventoryAuditLog.prototype, "stockBefore", void 0);
__decorate([
    (0, typeorm_1.Column)('int'),
    __metadata("design:type", Number)
], InventoryAuditLog.prototype, "stockAfter", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], InventoryAuditLog.prototype, "reservationId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], InventoryAuditLog.prototype, "createdAt", void 0);
exports.InventoryAuditLog = InventoryAuditLog = __decorate([
    (0, typeorm_1.Entity)('inventory_audit_logs')
], InventoryAuditLog);
//# sourceMappingURL=inventory-audit-log.entity.js.map