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
exports.Inventory = void 0;
const typeorm_1 = require("typeorm");
let Inventory = class Inventory {
    get availableStock() {
        return this.totalStock - this.confirmedSales - this.activeReservations;
    }
    incrementActiveReservations(quantity) {
        this.activeReservations += quantity;
    }
    decrementActiveReservations(quantity) {
        this.activeReservations = Math.max(0, this.activeReservations - quantity);
    }
    confirmSale(quantity) {
        this.decrementActiveReservations(quantity);
        this.confirmedSales += quantity;
    }
};
exports.Inventory = Inventory;
__decorate([
    (0, typeorm_1.PrimaryColumn)('uuid'),
    __metadata("design:type", String)
], Inventory.prototype, "productId", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: '' }),
    __metadata("design:type", String)
], Inventory.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)('int', { default: 0 }),
    __metadata("design:type", Number)
], Inventory.prototype, "totalStock", void 0);
__decorate([
    (0, typeorm_1.Column)('int', { default: 0 }),
    __metadata("design:type", Number)
], Inventory.prototype, "confirmedSales", void 0);
__decorate([
    (0, typeorm_1.Column)('int', { default: 0 }),
    __metadata("design:type", Number)
], Inventory.prototype, "activeReservations", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Inventory.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.VersionColumn)(),
    __metadata("design:type", Number)
], Inventory.prototype, "version", void 0);
exports.Inventory = Inventory = __decorate([
    (0, typeorm_1.Entity)('inventory')
], Inventory);
//# sourceMappingURL=inventory.entity.js.map