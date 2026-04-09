import { ApiProperty } from '@nestjs/swagger';
import { ReservationStatus } from '../../domain/value-objects/reservation-status.enum';
import { Reservation } from '../../domain/entities/reservation.entity';

export class ReservationResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  productId: string;

  @ApiProperty()
  productName: string;

  @ApiProperty({ format: 'uuid' })
  userId: string;

  @ApiProperty({ minimum: 1 })
  quantity: number;

  @ApiProperty({ enum: ReservationStatus })
  status: ReservationStatus;

  @ApiProperty()
  expiresAt: Date;

  @ApiProperty()
  createdAt: Date;

  static fromEntity(reservation: Reservation): ReservationResponseDto {
    const dto = new ReservationResponseDto();
    dto.id = reservation.id;
    dto.productId = reservation.productId;
    dto.productName = reservation.productName;
    dto.userId = reservation.userId;
    dto.quantity = reservation.quantity;
    dto.status = reservation.status;
    dto.expiresAt = reservation.expiresAt;
    dto.createdAt = reservation.createdAt;
    return dto;
  }
}
