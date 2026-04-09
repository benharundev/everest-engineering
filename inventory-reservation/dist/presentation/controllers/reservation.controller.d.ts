import { ReservationService } from '../../application/services/reservation.service';
import { CreateReservationDto } from '../../application/dto/create-reservation.dto';
import { ReservationResponseDto } from '../../application/dto/reservation-response.dto';
import { GetReservationsQueryDto } from '../../application/dto/get-reservations-query.dto';
import { PaginatedResult } from '../../application/dto/pagination.dto';
import { ReservationStatusLog } from '../../domain/entities/reservation-status-log.entity';
export declare class ReservationController {
    private readonly reservationService;
    constructor(reservationService: ReservationService);
    getAll(query: GetReservationsQueryDto): Promise<PaginatedResult<ReservationResponseDto>>;
    reserve(dto: CreateReservationDto): Promise<ReservationResponseDto>;
    confirm(id: string): Promise<ReservationResponseDto>;
    cancel(id: string): Promise<ReservationResponseDto>;
    getById(id: string): Promise<ReservationResponseDto>;
    getStatusLogs(id: string): Promise<ReservationStatusLog[]>;
}
