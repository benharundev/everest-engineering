import { IsInt, IsOptional, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class PaginationDto {
  @ApiPropertyOptional({ minimum: 0, default: 0, description: 'Number of items to skip' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  offset: number = 0;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20, description: 'Max items to return' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit: number = 20;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  offset: number;
  limit: number;
}
