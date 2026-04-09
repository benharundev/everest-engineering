"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReservationExpiredEvent = void 0;
class ReservationExpiredEvent {
    constructor(reservationId, productId, quantity) {
        this.reservationId = reservationId;
        this.productId = productId;
        this.quantity = quantity;
    }
}
exports.ReservationExpiredEvent = ReservationExpiredEvent;
//# sourceMappingURL=reservation-expired.event.js.map