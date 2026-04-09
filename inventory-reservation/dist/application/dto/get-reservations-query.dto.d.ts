import { PaginationDto } from './pagination.dto';
import { ReservationStatus } from '../../domain/value-objects/reservation-status.enum';
export declare class GetReservationsQueryDto extends PaginationDto {
    status?: ReservationStatus;
}
