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
exports.ReservationResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const reservation_status_enum_1 = require("../../domain/value-objects/reservation-status.enum");
class ReservationResponseDto {
    static fromEntity(reservation) {
        const dto = new ReservationResponseDto();
        dto.id = reservation.id;
        dto.productId = reservation.productId;
        dto.productName = reservation.productName;
        dto.userId = reservation.userId;
        dto.quantity = reservation.quantity;
        dto.status = reservation.status;
        dto.expiresAt = reservation.expiresAt;
        dto.createdAt = reservation.createdAt;
        return dto;
    }
}
exports.ReservationResponseDto = ReservationResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ format: 'uuid' }),
    __metadata("design:type", String)
], ReservationResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ format: 'uuid' }),
    __metadata("design:type", String)
], ReservationResponseDto.prototype, "productId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ReservationResponseDto.prototype, "productName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ format: 'uuid' }),
    __metadata("design:type", String)
], ReservationResponseDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ minimum: 1 }),
    __metadata("design:type", Number)
], ReservationResponseDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: reservation_status_enum_1.ReservationStatus }),
    __metadata("design:type", String)
], ReservationResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], ReservationResponseDto.prototype, "expiresAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], ReservationResponseDto.prototype, "createdAt", void 0);
//# sourceMappingURL=reservation-response.dto.js.map