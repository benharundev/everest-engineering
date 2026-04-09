/**
 * Inventory — domain entity.
 * Encapsulates stock availability formula and business queries.
 */
export class Inventory {
  constructor(
    readonly productId: string,
    readonly name: string,
    readonly totalStock: number,
    readonly confirmedSales: number,
    readonly activeReservations: number,
    readonly updatedAt: Date,
  ) {}

  /** Available = total − confirmed sales − active holds */
  get availableStock(): number {
    return this.totalStock - this.confirmedSales - this.activeReservations;
  }

  get isOutOfStock(): boolean {
    return this.availableStock <= 0;
  }

  get isLowStock(): boolean {
    return this.availableStock > 0 && this.availableStock <= this.totalStock * 0.1;
  }
}
