import {
  Entity,
  Column,
  PrimaryColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';

/**
 * Inventory aggregate — single source of truth for stock levels.
 *
 * Available = totalStock − confirmedSales − activeReservations
 *
 * The formula subtracts both confirmed sales (permanently gone) and
 * active reservations (temporarily held), so stock is never oversold
 * even when users are mid-reservation.
 */
@Entity('inventory')
export class Inventory {
  @PrimaryColumn('uuid')
  productId: string;

  @Column({ default: '' })
  name: string;

  @Column('int', { default: 0 })
  totalStock: number;

  @Column('int', { default: 0 })
  confirmedSales: number;

  @Column('int', { default: 0 })
  activeReservations: number;

  @UpdateDateColumn()
  updatedAt: Date;

  @VersionColumn()
  version: number;

  get availableStock(): number {
    return this.totalStock - this.confirmedSales - this.activeReservations;
  }

  incrementActiveReservations(quantity: number): void {
    this.activeReservations += quantity;
  }

  decrementActiveReservations(quantity: number): void {
    this.activeReservations = Math.max(0, this.activeReservations - quantity);
  }

  confirmSale(quantity: number): void {
    this.decrementActiveReservations(quantity);
    this.confirmedSales += quantity;
  }
}
