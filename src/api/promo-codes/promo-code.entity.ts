import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('promo_codes')
export class PromoCodeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  // Stored uppercase; lookups normalize the input the same way.
  @Column({ type: 'varchar', length: 32, unique: true })
  code: string;

  // null = valid for every event.
  @Column({ type: 'int', nullable: true })
  eventId: number | null;

  @Column({ type: 'int' })
  discountPercent: number;

  // null = unlimited.
  @Column({ type: 'int', nullable: true })
  maxUses: number | null;

  // Incremented when an order using the code becomes PAID.
  @Column({ type: 'int', default: 0 })
  usedCount: number;

  @Column({ type: 'timestamptz', nullable: true })
  validFrom: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  validUntil: Date | null;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}