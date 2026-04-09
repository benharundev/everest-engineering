import { ReservationStatus } from '../value-objects/reservation-status.enum';
export declare const RESERVATION_EXPIRY_MS: number;
export declare class Reservation {
    id: string;
    productId: string;
    productName: string;
    userId: string;
    quantity: number;
    status: ReservationStatus;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
    private _domainEvents;
    get domainEvents(): readonly object[];
    clearDomainEvents(): void;
    static create(productId: string, productName: string, userId: string, quantity: number): Reservation;
    confirm(): void;
    cancel(): void;
    expire(): void;
}
