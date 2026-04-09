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
exports.ReservationController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const throttler_1 = require("@nestjs/throttler");
const reservation_service_1 = require("../../application/services/reservation.service");
const create_reservation_dto_1 = require("../../application/dto/create-reservation.dto");
const reservation_response_dto_1 = require("../../application/dto/reservation-response.dto");
const get_reservations_query_dto_1 = require("../../application/dto/get-reservations-query.dto");
const reservation_status_log_entity_1 = require("../../domain/entities/reservation-status-log.entity");
let ReservationController = class ReservationController {
    constructor(reservationService) {
        this.reservationService = reservationService;
    }
    getAll(query) {
        const { status, ...pagination } = query;
        return this.reservationService.getAll(status, pagination);
    }
    reserve(dto) {
        return this.reservationService.reserve(dto);
    }
    confirm(id) {
        return this.reservationService.confirm(id);
    }
    cancel(id) {
        return this.reservationService.cancel(id);
    }
    getById(id) {
        return this.reservationService.getById(id);
    }
    getStatusLogs(id) {
        return this.reservationService.getStatusLogs(id);
    }
};
exports.ReservationController = ReservationController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all reservations', description: 'Paginated list, optionally filtered by status.' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Paginated reservation list' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [get_reservations_query_dto_1.GetReservationsQueryDto]),
    __metadata("design:returntype", Promise)
], ReservationController.prototype, "getAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, throttler_1.Throttle)({ default: { ttl: 60_000, limit: 100 } }),
    (0, swagger_1.ApiOperation)({ summary: 'Create a reservation', description: 'Holds stock for 2 minutes. Rate-limited to 100/min per IP.' }),
    (0, swagger_1.ApiResponse)({ status: 201, type: reservation_response_dto_1.ReservationResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Validation error' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Out of stock' }),
    (0, swagger_1.ApiResponse)({ status: 429, description: 'Too many requests' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_reservation_dto_1.CreateReservationDto]),
    __metadata("design:returntype", Promise)
], ReservationController.prototype, "reserve", null);
__decorate([
    (0, common_1.Post)(':id/confirm'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Confirm a reservation', description: 'Converts the hold into a permanent sale.' }),
    (0, swagger_1.ApiParam)({ name: 'id', format: 'uuid' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: reservation_response_dto_1.ReservationResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Reservation not found' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid state transition' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReservationController.prototype, "confirm", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel a reservation', description: 'Immediately releases the held stock.' }),
    (0, swagger_1.ApiParam)({ name: 'id', format: 'uuid' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: reservation_response_dto_1.ReservationResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Reservation not found' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid state transition' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReservationController.prototype, "cancel", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a reservation by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', format: 'uuid' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: reservation_response_dto_1.ReservationResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Reservation not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReservationController.prototype, "getById", null);
__decorate([
    (0, common_1.Get)(':id/logs'),
    (0, swagger_1.ApiOperation)({ summary: 'Get status change history for a reservation' }),
    (0, swagger_1.ApiParam)({ name: 'id', format: 'uuid' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: [reservation_status_log_entity_1.ReservationStatusLog] }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Reservation not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReservationController.prototype, "getStatusLogs", null);
exports.ReservationController = ReservationController = __decorate([
    (0, swagger_1.ApiTags)('reservations'),
    (0, common_1.Controller)('reservations'),
    __metadata("design:paramtypes", [reservation_service_1.ReservationService])
], ReservationController);
//# sourceMappingURL=reservation.controller.js.map