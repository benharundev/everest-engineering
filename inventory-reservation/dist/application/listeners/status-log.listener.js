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
exports.StatusLogListener = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const reservation_status_log_entity_1 = require("../../domain/entities/reservation-status-log.entity");
const reservation_status_enum_1 = require("../../domain/value-objects/reservation-status.enum");
const reservation_created_event_1 = require("../../domain/events/reservation-created.event");
const reservation_confirmed_event_1 = require("../../domain/events/reservation-confirmed.event");
const reservation_cancelled_event_1 = require("../../domain/events/reservation-cancelled.event");
const reservation_expired_event_1 = require("../../domain/events/reservation-expired.event");
let StatusLogListener = class StatusLogListener {
    constructor(repo) {
        this.repo = repo;
    }
    async handleCreated(event) {
        await this.log(event.reservationId, null, reservation_status_enum_1.ReservationStatus.ACTIVE);
    }
    async handleConfirmed(event) {
        await this.log(event.reservationId, reservation_status_enum_1.ReservationStatus.ACTIVE, reservation_status_enum_1.ReservationStatus.CONFIRMED);
    }
    async handleCancelled(event) {
        await this.log(event.reservationId, reservation_status_enum_1.ReservationStatus.ACTIVE, reservation_status_enum_1.ReservationStatus.CANCELLED);
    }
    async handleExpired(event) {
        await this.log(event.reservationId, reservation_status_enum_1.ReservationStatus.ACTIVE, reservation_status_enum_1.ReservationStatus.EXPIRED);
    }
    async log(reservationId, fromStatus, toStatus) {
        const entry = this.repo.create({ reservationId, fromStatus, toStatus });
        await this.repo.save(entry);
    }
};
exports.StatusLogListener = StatusLogListener;
__decorate([
    (0, event_emitter_1.OnEvent)(reservation_created_event_1.ReservationCreatedEvent.name),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [reservation_created_event_1.ReservationCreatedEvent]),
    __metadata("design:returntype", Promise)
], StatusLogListener.prototype, "handleCreated", null);
__decorate([
    (0, event_emitter_1.OnEvent)(reservation_confirmed_event_1.ReservationConfirmedEvent.name),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [reservation_confirmed_event_1.ReservationConfirmedEvent]),
    __metadata("design:returntype", Promise)
], StatusLogListener.prototype, "handleConfirmed", null);
__decorate([
    (0, event_emitter_1.OnEvent)(reservation_cancelled_event_1.ReservationCancelledEvent.name),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [reservation_cancelled_event_1.ReservationCancelledEvent]),
    __metadata("design:returntype", Promise)
], StatusLogListener.prototype, "handleCancelled", null);
__decorate([
    (0, event_emitter_1.OnEvent)(reservation_expired_event_1.ReservationExpiredEvent.name),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [reservation_expired_event_1.ReservationExpiredEvent]),
    __metadata("design:returntype", Promise)
], StatusLogListener.prototype, "handleExpired", null);
exports.StatusLogListener = StatusLogListener = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(reservation_status_log_entity_1.ReservationStatusLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], StatusLogListener);
//# sourceMappingURL=status-log.listener.js.map