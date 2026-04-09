export class ReservationCancelledEvent {
  constructor(
    public readonly reservationId: string,
    public readonly productId: string,
    public readonly quantity: number,
  ) {}
}
