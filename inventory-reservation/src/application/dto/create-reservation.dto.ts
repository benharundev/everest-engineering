import { IsUUID, IsInt, Min, Max, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReservationDto {
  @ApiProperty({ description: 'Product UUID to reserve stock for', format: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ description: 'User UUID making the reservation', format: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Number of units to reserve', minimum: 1, maximum: 100, example: 1 })
  @IsInt()
  @Min(1)
  @Max(100)
  quantity: number;
}
