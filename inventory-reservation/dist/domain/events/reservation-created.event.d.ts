export declare class ReservationCreatedEvent {
    readonly reservationId: string;
    readonly productId: string;
    readonly userId: string;
    readonly quantity: number;
    readonly expiresAt: Date;
    constructor(reservationId: string, productId: string, userId: string, quantity: number, expiresAt: Date);
}
