import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { LocaleText } from '../events/event-i18n.types';

@Entity('videos')
export class VideoEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'jsonb' })
  title: LocaleText;

  @Column({ type: 'jsonb' })
  subtitle: LocaleText;

  @Column()
  url: string;

  @Column({ nullable: true })
  thumbnailUrl: string | null;

  @Column({ type: 'int', default: 0 })
  priority: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}