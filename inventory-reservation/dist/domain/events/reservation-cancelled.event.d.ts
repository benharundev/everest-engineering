export declare class ReservationCancelledEvent {
    readonly reservationId: string;
    readonly productId: string;
    readonly quantity: number;
    constructor(reservationId: string, productId: string, quantity: number);
}
