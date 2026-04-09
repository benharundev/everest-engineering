import { ReservationStatus } from '../value-objects/reservation-status.enum';
export declare class ReservationStatusLog {
    id: string;
    reservationId: string;
    fromStatus: ReservationStatus | null;
    toStatus: ReservationStatus;
    changedAt: Date;
}
