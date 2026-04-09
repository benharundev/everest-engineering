export const EXPIRY_QUEUE_NAME = 'reservation-expiry';

export interface ExpiryJobData {
  reservationId: string;
}
