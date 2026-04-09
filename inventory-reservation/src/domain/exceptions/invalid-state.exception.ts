import { BadRequestException } from '@nestjs/common';

export class InvalidStateException extends BadRequestException {
  constructor(currentStatus: string, attemptedAction: string) {
    super(
      `Cannot perform '${attemptedAction}' on a reservation in '${currentStatus}' status`,
    );
  }
}
