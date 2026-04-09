import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum InventoryAuditAction {
  RESERVED    = 'RESERVED',     // stock held for a new reservation
  RELEASED    = 'RELEASED',     // stock returned (cancel or expiry)
  CONFIRMED   = 'CONFIRMED',    // active reservation moved to confirmed sales
  REHYDRATED  = 'REHYDRATED',   // Redis counter restored from DB on recovery
}

@Entity('inventory_audit_logs')
export class InventoryAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  productId: string;

  @Column({ type: 'enum', enum: InventoryAuditAction })
  action: InventoryAuditAction;

  @Column('int')
  quantityDelta: number;  // positive = stock increased, negative = stock decreased

  @Column('int')
  stockBefore: number;

  @Column('int')
  stockAfter: number;

  @Column({ type: 'uuid', nullable: true })
  reservationId: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
