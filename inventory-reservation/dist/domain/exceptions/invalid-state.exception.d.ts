import { BadRequestException } from '@nestjs/common';
export declare class InvalidStateException extends BadRequestException {
    constructor(currentStatus: string, attemptedAction: string);
}
