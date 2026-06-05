import { IsArray, IsEnum, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';
import { EventStatus } from '../../../constants/enums/event.enums';
import type {
  EventCoordinates,
  EventDateRange,
  EventHost,
  LocaleStringList,
  LocaleText,
  ScheduleItemLocalized,
} from '../event-i18n.types';

export class UpdateEventDto {
  @IsOptional() @IsString()
  slug?: string;

  @IsOptional() @IsEnum(EventStatus)
  status?: EventStatus;

  @IsOptional() @IsObject()
  label?: LocaleText;

  @IsOptional() @IsObject()
  title?: LocaleText;

  @IsOptional() @IsObject()
  dates?: EventDateRange;

  @IsOptional() @IsObject()
  location?: LocaleText;

  @IsOptional() @IsObject()
  locationDetail?: LocaleText;

  @IsOptional() @IsObject()
  shortDescription?: LocaleText;

  @IsOptional() @IsObject()
  longDescription?: LocaleText;

  @IsOptional() @IsObject()
  includes?: LocaleStringList;

  @IsOptional() @IsArray()
  schedule?: ScheduleItemLocalized[];

  @IsOptional() @IsObject()
  host?: EventHost;

  @IsOptional() @IsObject()
  coordinates?: EventCoordinates;

  @IsOptional() @IsNumber()
  maxCapacity?: number;

  @IsOptional() @IsNumber()
  bookedCount?: number;

  @IsOptional() @IsNumber()
  price?: number;

  @IsOptional() @IsString()
  cardImageUrl?: string | null;

  @IsOptional() @IsArray()
  galleryImageUrls?: string[] | null;
}