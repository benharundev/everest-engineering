import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { ReservationStatus } from '../value-objects/reservation-status.enum';

@Entity('reservation_status_logs')
export class ReservationStatusLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  reservationId: string;

  @Column({ type: 'enum', enum: ReservationStatus, nullable: true })
  fromStatus: ReservationStatus | null;

  @Column({ type: 'enum', enum: ReservationStatus })
  toStatus: ReservationStatus;

  @CreateDateColumn()
  changedAt: Date;
}
