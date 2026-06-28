import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsArray,
  IsObject,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EventStatus } from '../../../constants/enums/event.enums';
import type {
  EventCoordinates,
  EventDateRange,
  EventHost,
  LocaleStringList,
  LocaleText,
  ScheduleItemLocalized,
} from '../event-i18n.types';

export class ScheduleItemLocalizedDto {
  @IsString()
  time: string;

  @IsObject()
  label: LocaleText;

  @IsObject()
  sub: LocaleText;
}

export class CreateEventDto {
  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @IsObject()
  label: LocaleText;

  @IsObject()
  title: LocaleText;

  @IsObject()
  dates: EventDateRange;

  @IsObject()
  location: LocaleText;

  @IsObject()
  locationDetail: LocaleText;

  @IsObject()
  shortDescription: LocaleText;

  @IsObject()
  longDescription: LocaleText;

  @IsObject()
  includes: LocaleStringList;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleItemLocalizedDto)
  schedule: ScheduleItemLocalizedDto[];

  @IsObject()
  host: EventHost;

  @IsObject()
  coordinates: EventCoordinates;

  @IsNumber()
  @Min(0)
  maxCapacity: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bookedCount?: number;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsString()
  cardImageUrl?: string | null;

  @IsOptional()
  @IsArray()
  galleryImageUrls?: string[] | null;

  @IsOptional()
  @IsObject()
  ctaLabel?: LocaleText | null;

  @IsOptional()
  @IsObject()
  hostSectionTitle?: LocaleText | null;

  @IsOptional()
  @IsObject()
  goodToKnowTitle?: LocaleText | null;

  @IsOptional()
  @IsObject()
  goodToKnowText?: LocaleText | null;

  @IsOptional()
  @IsObject()
  goodToKnowTextTitle?: LocaleText | null;
}