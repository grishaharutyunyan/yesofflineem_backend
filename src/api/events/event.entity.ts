import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EventStatus } from '../../constants/enums/event.enums';
import type {
  EventCoordinates,
  EventDateRange,
  EventHost,
  LocaleStringList,
  LocaleText,
  ScheduleItemLocalized,
} from './event-i18n.types';

@Entity('events')
export class EventEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'varchar', length: 16, default: EventStatus.DRAFT })
  status: EventStatus;

  @Column({ type: 'jsonb' })
  label: LocaleText;

  @Column({ type: 'jsonb' })
  title: LocaleText;

  @Column({ type: 'jsonb' })
  dates: EventDateRange;

  @Column({ type: 'jsonb' })
  location: LocaleText;

  @Column({ type: 'jsonb' })
  locationDetail: LocaleText;

  @Column({ type: 'jsonb' })
  shortDescription: LocaleText;

  @Column({ type: 'jsonb' })
  longDescription: LocaleText;

  @Column({ type: 'jsonb' })
  includes: LocaleStringList;

  @Column({ type: 'jsonb', nullable: true })
  schedule: ScheduleItemLocalized[] | null;

  @Column({ type: 'jsonb' })
  host: EventHost;

  @Column({ type: 'jsonb' })
  coordinates: EventCoordinates;

  @Column({ type: 'int' })
  maxCapacity: number;

  @Column({ type: 'int', default: 0 })
  bookedCount: number;

  @Column({ type: 'int', default: 0 })
  price: number;

  @Column({ nullable: true })
  cardImageUrl: string | null;

  @Column({ type: 'jsonb', nullable: true })
  galleryImageUrls: string[] | null;

  @Column({ type: 'jsonb', nullable: true })
  ctaLabel: LocaleText | null;

  @Column({ type: 'jsonb', nullable: true })
  hostSectionTitle: LocaleText | null;

  @Column({ type: 'jsonb', nullable: true })
  goodToKnowTitle: LocaleText | null;

  @Column({ type: 'jsonb', nullable: true })
  goodToKnowText: LocaleText | null;

  @Column({ type: 'jsonb', nullable: true })
  goodToKnowTextTitle: LocaleText | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
