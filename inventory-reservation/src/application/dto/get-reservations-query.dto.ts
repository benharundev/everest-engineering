import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from './pagination.dto';
import { ReservationStatus } from '../../domain/value-objects/reservation-status.enum';

export class GetReservationsQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: ReservationStatus, description: 'Filter by reservation status' })
  @IsOptional()
  @IsEnum(ReservationStatus)
  status?: ReservationStatus;
}
