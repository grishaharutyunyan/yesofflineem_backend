import type { EventEntity } from './event.entity';
import {
  formatAmd,
  pickLocaleList,
  pickLocaleText,
  spotsLeft,
  type LangCode,
} from './event-i18n.types';

export interface EventSummary {
  slug: string;
  label: string;
  title: string;
  date: string;
  dateLong: string;
  location: string;
  locationFull: string;
  shortDescription: string;
  longDescription: string;
  includes: string[];
  host: string;
  hostRole: string;
  spotsLeft: number;
  maxCapacity: number;
  priceLabel: string;
  priceAmd: number;
}

export function eventSummaryForLang(e: EventEntity, lang: LangCode = 'en'): EventSummary {
  const left = spotsLeft(e.maxCapacity, e.bookedCount);
  return {
    slug: e.slug,
    label: pickLocaleText(e.label, lang),
    title: pickLocaleText(e.title, lang),
    date: e.dates.start,
    dateLong: `${e.dates.start} – ${e.dates.end}`,
    location: pickLocaleText(e.location, lang),
    locationFull: pickLocaleText(e.locationDetail, lang),
    shortDescription: pickLocaleText(e.shortDescription, lang),
    longDescription: pickLocaleText(e.longDescription, lang),
    includes: pickLocaleList(e.includes, lang),
    host: pickLocaleText(e.host?.name, lang),
    hostRole: pickLocaleText(e.host?.role, lang),
    spotsLeft: left,
    maxCapacity: e.maxCapacity,
    priceLabel: e.price === 0 ? 'Free' : `${formatAmd(e.price)} AMD`,
    priceAmd: e.price,
  };
}

/** Kept for backward compatibility with tool handler. */
export function eventSummaryEn(e: EventEntity): EventSummary {
  return eventSummaryForLang(e, 'en');
}
