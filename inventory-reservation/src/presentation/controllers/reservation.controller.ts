import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ReservationService } from '../../application/services/reservation.service';
import { CreateReservationDto } from '../../application/dto/create-reservation.dto';
import { ReservationResponseDto } from '../../application/dto/reservation-response.dto';
import { GetReservationsQueryDto } from '../../application/dto/get-reservations-query.dto';
import { PaginatedResult } from '../../application/dto/pagination.dto';
import { ReservationStatusLog } from '../../domain/entities/reservation-status-log.entity';

@ApiTags('reservations')
@Controller('reservations')
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Get()
  @ApiOperation({ summary: 'Get all reservations', description: 'Paginated list, optionally filtered by status.' })
  @ApiResponse({ status: 200, description: 'Paginated reservation list' })
  getAll(
    @Query() query: GetReservationsQueryDto,
  ): Promise<PaginatedResult<ReservationResponseDto>> {
    const { status, ...pagination } = query;
    return this.reservationService.getAll(status, pagination);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { ttl: 60_000, limit: 100 } })
  @ApiOperation({ summary: 'Create a reservation', description: 'Holds stock for 2 minutes. Rate-limited to 100/min per IP.' })
  @ApiResponse({ status: 201, type: ReservationResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Out of stock' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  reserve(@Body() dto: CreateReservationDto): Promise<ReservationResponseDto> {
    return this.reservationService.reserve(dto);
  }

  @Post(':id/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm a reservation', description: 'Converts the hold into a permanent sale.' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: ReservationResponseDto })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  @ApiResponse({ status: 400, description: 'Invalid state transition' })
  confirm(@Param('id', ParseUUIDPipe) id: string): Promise<ReservationResponseDto> {
    return this.reservationService.confirm(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a reservation', description: 'Immediately releases the held stock.' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: ReservationResponseDto })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  @ApiResponse({ status: 400, description: 'Invalid state transition' })
  cancel(@Param('id', ParseUUIDPipe) id: string): Promise<ReservationResponseDto> {
    return this.reservationService.cancel(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a reservation by ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: ReservationResponseDto })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  getById(@Param('id', ParseUUIDPipe) id: string): Promise<ReservationResponseDto> {
    return this.reservationService.getById(id);
  }

  @Get(':id/logs')
  @ApiOperation({ summary: 'Get status change history for a reservation' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: [ReservationStatusLog] })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  getStatusLogs(@Param('id', ParseUUIDPipe) id: string): Promise<ReservationStatusLog[]> {
    return this.reservationService.getStatusLogs(id);
  }
}
