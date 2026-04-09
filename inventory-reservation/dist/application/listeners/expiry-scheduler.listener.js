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
var ExpirySchedulerListener_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpirySchedulerListener = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const bull_1 = require("@nestjs/bull");
const reservation_created_event_1 = require("../../domain/events/reservation-created.event");
const expiry_queue_1 = require("../../infrastructure/queue/expiry.queue");
const reservation_entity_1 = require("../../domain/entities/reservation.entity");
let ExpirySchedulerListener = ExpirySchedulerListener_1 = class ExpirySchedulerListener {
    constructor(expiryQueue) {
        this.expiryQueue = expiryQueue;
        this.logger = new common_1.Logger(ExpirySchedulerListener_1.name);
    }
    async handleReservationCreated(event) {
        await this.expiryQueue.add('expire', { reservationId: event.reservationId }, {
            delay: reservation_entity_1.RESERVATION_EXPIRY_MS,
            jobId: `expiry:${event.reservationId}`,
            attempts: 3,
            backoff: { type: 'exponential', delay: 1_000 },
            removeOnComplete: true,
            removeOnFail: true,
        });
        this.logger.debug(`Expiry job scheduled for reservation ${event.reservationId} in ${reservation_entity_1.RESERVATION_EXPIRY_MS}ms`);
    }
};
exports.ExpirySchedulerListener = ExpirySchedulerListener;
__decorate([
    (0, event_emitter_1.OnEvent)(reservation_created_event_1.ReservationCreatedEvent.name),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [reservation_created_event_1.ReservationCreatedEvent]),
    __metadata("design:returntype", Promise)
], ExpirySchedulerListener.prototype, "handleReservationCreated", null);
exports.ExpirySchedulerListener = ExpirySchedulerListener = ExpirySchedulerListener_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, bull_1.InjectQueue)(expiry_queue_1.EXPIRY_QUEUE_NAME)),
    __metadata("design:paramtypes", [Object])
], ExpirySchedulerListener);
//# sourceMappingURL=expiry-scheduler.listener.js.map