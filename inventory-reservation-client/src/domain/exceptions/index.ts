/**
 * OutOfStockError — thrown when reservation quantity exceeds available stock.
 * Maps to HTTP 409 from the backend.
 */
export class OutOfStockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OutOfStockError';
  }
}

/**
 * InvalidStateError — thrown when a state transition is not permitted.
 * e.g. confirming an already CONFIRMED reservation.
 * Maps to HTTP 409 from the backend.
 */
export class InvalidStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidStateError';
  }
}

/**
 * NotFoundError — thrown when a reservation or product does not exist.
 * Maps to HTTP 404 from the backend.
 */
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}
