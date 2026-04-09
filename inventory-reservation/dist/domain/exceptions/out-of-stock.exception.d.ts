import { ConflictException } from '@nestjs/common';
export declare class OutOfStockException extends ConflictException {
    constructor(productId: string, requested: number, available: number);
}
