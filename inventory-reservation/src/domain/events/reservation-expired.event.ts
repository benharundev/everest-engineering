export class ReservationExpiredEvent {
  constructor(
    public readonly reservationId: string,
    public readonly productId: string,
    public readonly quantity: number,
  ) {}
}
