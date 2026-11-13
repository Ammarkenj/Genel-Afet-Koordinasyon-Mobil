/** Working days use ISO numbering: 1 = Monday ... 7 = Sunday. */
export type IsoDay = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const ALL_DAYS: IsoDay[] = [1, 2, 3, 4, 5, 6, 7];
export const WEEKDAYS: IsoDay[] = [1, 2, 3, 4, 5];

/** Today (or the day of `ms`) as 1..7, Monday first, in the device's local time. */
export function isoDay(ms: number): IsoDay {
  const d = new Date(ms).getDay(); // 0 = Sunday
  return (d === 0 ? 7 : d) as IsoDay;
}

/** Cleans stored or typed days: whole numbers 1..7, no duplicates, sorted. Anything else is dropped. */
export function normalizeDays(v: unknown): IsoDay[] {
  if (!Array.isArray(v)) return [];
  const set = new Set<number>();
  for (const x of v) if (typeof x === 'number' && Number.isInteger(x) && x >= 1 && x <= 7) set.add(x);
  return [...set].sort((a, b) => a - b) as IsoDay[];
}

/** A record saved before schedules existed (no field) works every day; an explicit empty list means no day. */
export function daysOf(stored: unknown): IsoDay[] {
  return Array.isArray(stored) ? normalizeDays(stored) : ALL_DAYS;
}

export const worksOn = (days: readonly number[], day: IsoDay): boolean => days.includes(day);
export const worksToday = (days: readonly number[], now: number): boolean => worksOn(days, isoDay(now));

export const toggleDay = (days: readonly number[], day: IsoDay): IsoDay[] =>
  normalizeDays(days.includes(day) ? days.filter((d) => d !== day) : [...days, day]);

export const isEveryDay = (days: readonly number[]): boolean => normalizeDays(days).length === 7;
export const isWeekdaysOnly = (days: readonly number[]): boolean => {
  const n = normalizeDays(days);
  return n.length === 5 && WEEKDAYS.every((d) => n.includes(d));
};

/** Name of a weekday in the given language ("short" = Pzt / الاثنين). Jan 1 2024 was a Monday. */
export function dayName(day: IsoDay, lang: string, style: 'short' | 'long' = 'short'): string {
  return new Intl.DateTimeFormat(lang, { weekday: style }).format(new Date(2024, 0, day));
}
