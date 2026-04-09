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
var ExpiryProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpiryProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const expiry_queue_1 = require("./expiry.queue");
const reservation_entity_1 = require("../../domain/entities/reservation.entity");
const invalid_state_exception_1 = require("../../domain/exceptions/invalid-state.exception");
let ExpiryProcessor = ExpiryProcessor_1 = class ExpiryProcessor {
    constructor(reservationRepo, events) {
        this.reservationRepo = reservationRepo;
        this.events = events;
        this.logger = new common_1.Logger(ExpiryProcessor_1.name);
    }
    async handleExpiry(job) {
        const { reservationId } = job.data;
        const reservation = await this.reservationRepo.findOne({
            where: { id: reservationId },
        });
        if (!reservation) {
            this.logger.warn(`Expiry job: reservation ${reservationId} not found — skipping`);
            return;
        }
        try {
            reservation.expire();
        }
        catch (err) {
            if (err instanceof invalid_state_exception_1.InvalidStateException) {
                this.logger.debug(`Expiry job: reservation ${reservationId} already in terminal state (${reservation.status}) — skipping`);
                return;
            }
            throw err;
        }
        await this.reservationRepo.save(reservation);
        for (const event of reservation.domainEvents) {
            await this.events.emitAsync(event.constructor.name, event);
        }
        reservation.clearDomainEvents();
        this.logger.log(`Reservation ${reservationId} expired — stock released`);
    }
};
exports.ExpiryProcessor = ExpiryProcessor;
__decorate([
    (0, bull_1.Process)('expire'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ExpiryProcessor.prototype, "handleExpiry", null);
exports.ExpiryProcessor = ExpiryProcessor = ExpiryProcessor_1 = __decorate([
    (0, bull_1.Processor)(expiry_queue_1.EXPIRY_QUEUE_NAME),
    __param(0, (0, typeorm_1.InjectRepository)(reservation_entity_1.Reservation)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        event_emitter_1.EventEmitter2])
], ExpiryProcessor);
//# sourceMappingURL=expiry.processor.js.map