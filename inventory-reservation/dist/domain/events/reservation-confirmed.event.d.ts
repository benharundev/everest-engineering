export declare class ReservationConfirmedEvent {
    readonly reservationId: string;
    readonly productId: string;
    readonly userId: string;
    readonly quantity: number;
    constructor(reservationId: string, productId: string, userId: string, quantity: number);
}
