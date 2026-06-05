/** Multilingual text stored as JSON. `en` and `hy` are required; `ru` is optional (falls back to `en`). */
export interface LocaleText {
  en: string;
  hy: string;
  ru?: string;
}

export interface LocaleStringList {
  en: string[];
  hy: string[];
  ru?: string[];
}

export interface EventDateRange {
  start: string; // 'YYYY-MM-DD' or 'YYYY-MM-DD HH:mm'
  end: string;   // 'YYYY-MM-DD' or 'YYYY-MM-DD HH:mm'
}

export interface EventHost {
  name: LocaleText;
  role: LocaleText;
  imageUrl: string | null;
}

export interface EventCoordinates {
  lat: number;
  lng: number;
  address: LocaleText;
}

export interface ScheduleItemLocalized {
  time: string;
  label: LocaleText;
  sub: LocaleText;
}

export type LangCode = 'en' | 'hy' | 'ru';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Safely read a locale string from JSON; falls back to English. */
export function pickLocaleText(
  value: LocaleText | null | undefined,
  lang: LangCode = 'en',
): string {
  if (!isRecord(value)) return '';
  const en = typeof value.en === 'string' ? value.en : '';
  const hy = typeof value.hy === 'string' ? value.hy : '';
  const ru = typeof value.ru === 'string' ? value.ru : '';
  if (lang === 'hy' && hy.trim()) return hy;
  if (lang === 'ru' && ru.trim()) return ru;
  return en;
}

export function pickLocaleList(
  value: LocaleStringList | null | undefined,
  lang: LangCode = 'en',
): string[] {
  if (!isRecord(value)) return [];
  const en = Array.isArray(value.en) ? value.en.filter((x) => typeof x === 'string') : [];
  const hy = Array.isArray(value.hy) ? value.hy.filter((x) => typeof x === 'string') : [];
  const ru = Array.isArray((value as LocaleStringList).ru) ? ((value as LocaleStringList).ru ?? []).filter((x) => typeof x === 'string') : [];
  if (lang === 'hy' && hy.length) return hy;
  if (lang === 'ru' && ru.length) return ru;
  return en;
}

export function pickScheduleForLang(
  schedule: ScheduleItemLocalized[] | null | undefined,
  lang: LangCode = 'en',
): { time: string; label: string; sub: string }[] {
  if (!Array.isArray(schedule)) return [];
  return schedule.map((item) => ({
    time: typeof item?.time === 'string' ? item.time : '',
    label: pickLocaleText(item?.label, lang),
    sub: pickLocaleText(item?.sub, lang),
  }));
}

export function spotsLeft(maxCapacity: number, bookedCount: number): number {
  return Math.max(0, maxCapacity - bookedCount);
}

export function formatAmd(price: number): string {
  if (price === 0) return '0';
  return price.toLocaleString('en-US');
}
