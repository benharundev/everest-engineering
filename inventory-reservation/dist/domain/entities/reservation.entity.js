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
var Reservation_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Reservation = exports.RESERVATION_EXPIRY_MS = void 0;
const typeorm_1 = require("typeorm");
const uuid_1 = require("uuid");
const reservation_status_enum_1 = require("../value-objects/reservation-status.enum");
const invalid_state_exception_1 = require("../exceptions/invalid-state.exception");
const reservation_created_event_1 = require("../events/reservation-created.event");
const reservation_confirmed_event_1 = require("../events/reservation-confirmed.event");
const reservation_cancelled_event_1 = require("../events/reservation-cancelled.event");
const reservation_expired_event_1 = require("../events/reservation-expired.event");
exports.RESERVATION_EXPIRY_MS = 2 * 60 * 1000;
let Reservation = Reservation_1 = class Reservation {
    constructor() {
        this._domainEvents = [];
    }
    get domainEvents() {
        return this._domainEvents;
    }
    clearDomainEvents() {
        this._domainEvents = [];
    }
    static create(productId, productName, userId, quantity) {
        const reservation = new Reservation_1();
        reservation.id = (0, uuid_1.v4)();
        reservation.productId = productId;
        reservation.productName = productName;
        reservation.userId = userId;
        reservation.quantity = quantity;
        reservation.status = reservation_status_enum_1.ReservationStatus.ACTIVE;
        reservation.expiresAt = new Date(Date.now() + exports.RESERVATION_EXPIRY_MS);
        reservation._domainEvents = [
            new reservation_created_event_1.ReservationCreatedEvent(reservation.id, productId, userId, quantity, reservation.expiresAt),
        ];
        return reservation;
    }
    confirm() {
        if (this.status !== reservation_status_enum_1.ReservationStatus.ACTIVE) {
            throw new invalid_state_exception_1.InvalidStateException(this.status, 'confirm');
        }
        this.status = reservation_status_enum_1.ReservationStatus.CONFIRMED;
        this._domainEvents.push(new reservation_confirmed_event_1.ReservationConfirmedEvent(this.id, this.productId, this.userId, this.quantity));
    }
    cancel() {
        if (this.status !== reservation_status_enum_1.ReservationStatus.ACTIVE) {
            throw new invalid_state_exception_1.InvalidStateException(this.status, 'cancel');
        }
        this.status = reservation_status_enum_1.ReservationStatus.CANCELLED;
        this._domainEvents.push(new reservation_cancelled_event_1.ReservationCancelledEvent(this.id, this.productId, this.quantity));
    }
    expire() {
        if (this.status !== reservation_status_enum_1.ReservationStatus.ACTIVE) {
            throw new invalid_state_exception_1.InvalidStateException(this.status, 'expire');
        }
        this.status = reservation_status_enum_1.ReservationStatus.EXPIRED;
        this._domainEvents.push(new reservation_expired_event_1.ReservationExpiredEvent(this.id, this.productId, this.quantity));
    }
};
exports.Reservation = Reservation;
__decorate([
    (0, typeorm_1.PrimaryColumn)('uuid'),
    __metadata("design:type", String)
], Reservation.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    __metadata("design:type", String)
], Reservation.prototype, "productId", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: '' }),
    __metadata("design:type", String)
], Reservation.prototype, "productName", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    __metadata("design:type", String)
], Reservation.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)('int'),
    __metadata("design:type", Number)
], Reservation.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: reservation_status_enum_1.ReservationStatus, default: reservation_status_enum_1.ReservationStatus.ACTIVE }),
    __metadata("design:type", String)
], Reservation.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Date)
], Reservation.prototype, "expiresAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Reservation.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Reservation.prototype, "updatedAt", void 0);
exports.Reservation = Reservation = Reservation_1 = __decorate([
    (0, typeorm_1.Entity)('reservations')
], Reservation);
//# sourceMappingURL=reservation.entity.js.map