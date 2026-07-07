import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { OrderStatus } from '../../constants/enums/order.enums';
import type { LocaleText } from '../events/event-i18n.types';

@Entity('orders')
export class OrderEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column()
  orderNumber: string;

  @Column({ type: 'int' })
  eventId: number;

  @Column()
  eventSlug: string;

  @Column({ type: 'jsonb' })
  eventTitle: LocaleText;

  @Column()
  firstName: string;

  @Column({ nullable: true })
  lastName: string | null;

  @Column()
  email: string;

  @Column({ nullable: true })
  phone: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'int' })
  guests: number;

  @Column({ type: 'int' })
  amount: number;

  @Column({ type: 'varchar', length: 3 })
  currency: string;

  @Column({ type: 'varchar', length: 16, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({ nullable: true })
  epgOrderId: string | null;

  @Column({ type: 'varchar', length: 1024, nullable: true })
  epgFormUrl: string | null;

  @Column({ nullable: true })
  panMasked: string | null;

  @Column({ nullable: true })
  actionCode: string | null;

  @Column({ nullable: true })
  actionCodeDescription: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  paymentDate: Date | null;

  @Column({ type: 'boolean', default: false })
  capacityApplied: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
