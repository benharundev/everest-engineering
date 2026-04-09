import { ReservationStatus } from '../../domain/value-objects/reservation-status.enum';
import { Reservation } from '../../domain/entities/reservation.entity';
export declare class ReservationResponseDto {
    id: string;
    productId: string;
    productName: string;
    userId: string;
    quantity: number;
    status: ReservationStatus;
    expiresAt: Date;
    createdAt: Date;
    static fromEntity(reservation: Reservation): ReservationResponseDto;
}
