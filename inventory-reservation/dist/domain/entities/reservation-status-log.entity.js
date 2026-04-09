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
exports.ReservationStatusLog = void 0;
const typeorm_1 = require("typeorm");
const reservation_status_enum_1 = require("../value-objects/reservation-status.enum");
let ReservationStatusLog = class ReservationStatusLog {
};
exports.ReservationStatusLog = ReservationStatusLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ReservationStatusLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    __metadata("design:type", String)
], ReservationStatusLog.prototype, "reservationId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: reservation_status_enum_1.ReservationStatus, nullable: true }),
    __metadata("design:type", Object)
], ReservationStatusLog.prototype, "fromStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: reservation_status_enum_1.ReservationStatus }),
    __metadata("design:type", String)
], ReservationStatusLog.prototype, "toStatus", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ReservationStatusLog.prototype, "changedAt", void 0);
exports.ReservationStatusLog = ReservationStatusLog = __decorate([
    (0, typeorm_1.Entity)('reservation_status_logs')
], ReservationStatusLog);
//# sourceMappingURL=reservation-status-log.entity.js.map