export class ReservationConfirmedEvent {
  constructor(
    public readonly reservationId: string,
    public readonly productId: string,
    public readonly userId: string,
    public readonly quantity: number,
  ) {}
}
