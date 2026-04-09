import { ConflictException } from '@nestjs/common';

export class OutOfStockException extends ConflictException {
  constructor(productId: string, requested: number, available: number) {
    super(
      `Insufficient stock for product '${productId}': requested ${requested}, available ${available}`,
    );
  }
}
