"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReservationCreatedEvent = void 0;
class ReservationCreatedEvent {
    constructor(reservationId, productId, userId, quantity, expiresAt) {
        this.reservationId = reservationId;
        this.productId = productId;
        this.userId = userId;
        this.quantity = quantity;
        this.expiresAt = expiresAt;
    }
}
exports.ReservationCreatedEvent = ReservationCreatedEvent;
//# sourceMappingURL=reservation-created.event.js.map