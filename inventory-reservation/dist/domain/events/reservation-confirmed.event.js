"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReservationConfirmedEvent = void 0;
class ReservationConfirmedEvent {
    constructor(reservationId, productId, userId, quantity) {
        this.reservationId = reservationId;
        this.productId = productId;
        this.userId = userId;
        this.quantity = quantity;
    }
}
exports.ReservationConfirmedEvent = ReservationConfirmedEvent;
//# sourceMappingURL=reservation-confirmed.event.js.map