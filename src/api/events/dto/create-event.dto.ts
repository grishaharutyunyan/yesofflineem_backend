import { EventStatus } from '../../../constants/enums/event.enums';
import type {
  EventCoordinates,
  EventDateRange,
  EventHost,
  LocaleStringList,
  LocaleText,
  ScheduleItemLocalized,
} from '../event-i18n.types';

export class CreateEventDto {
  slug: string;
  status?: EventStatus;

  label: LocaleText;
  title: LocaleText;
  dates: EventDateRange;
  location: LocaleText;
  locationDetail: LocaleText;
  shortDescription: LocaleText;
  longDescription: LocaleText;
  includes: LocaleStringList;
  schedule: ScheduleItemLocalized[];
  host: EventHost;
  coordinates: EventCoordinates;

  maxCapacity: number;
  bookedCount?: number;
  price: number;

  cardImageUrl?: string | null;
  galleryImageUrls?: string[] | null;
}
