import { describe, expect, it } from 'vitest';
import { ALL_DAYS, WEEKDAYS, dayName, daysOf, isEveryDay, isWeekdaysOnly, isoDay, normalizeDays, toggleDay, worksToday } from './workdays';

// 2026-11-02 is a Monday; 2026-11-08 is a Sunday (local time, so the test does not depend on the time zone)
const MON = new Date(2026, 10, 2, 12, 0).getTime();
const SUN = new Date(2026, 10, 8, 12, 0).getTime();

describe('isoDay', () => {
  it('numbers Monday 1 to Sunday 7', () => {
    expect(isoDay(MON)).toBe(1);
    expect(isoDay(SUN)).toBe(7);
    expect(isoDay(new Date(2026, 10, 4, 9, 0).getTime())).toBe(3); // Wednesday
  });
});

describe('normalizeDays', () => {
  it('keeps whole numbers 1..7, removes duplicates and sorts', () => {
    expect(normalizeDays([5, 1, 3, 3, 7])).toEqual([1, 3, 5, 7]);
  });
  it('drops anything invalid', () => {
    expect(normalizeDays([0, 8, -1, 2.5, '3', null, 2])).toEqual([2]);
    expect(normalizeDays('mon')).toEqual([]);
    expect(normalizeDays(undefined)).toEqual([]);
  });
});

describe('daysOf (stored value)', () => {
  it('treats a record without a schedule as working every day', () => {
    expect(daysOf(undefined)).toEqual(ALL_DAYS);
    expect(daysOf(null)).toEqual(ALL_DAYS);
  });
  it('keeps an explicit schedule, including an empty one', () => {
    expect(daysOf([1, 2])).toEqual([1, 2]);
    expect(daysOf([])).toEqual([]);
  });
});

describe('worksToday and toggling', () => {
  it('knows whether today is a working day', () => {
    expect(worksToday([1, 2, 3, 4, 5], MON)).toBe(true);
    expect(worksToday([1, 2, 3, 4, 5], SUN)).toBe(false);
    expect(worksToday([], MON)).toBe(false);
  });
  it('toggles a day on and off, keeping the list sorted', () => {
    expect(toggleDay([1, 3], 2)).toEqual([1, 2, 3]);
    expect(toggleDay([1, 2, 3], 2)).toEqual([1, 3]);
    expect(toggleDay([], 7)).toEqual([7]);
  });
  it('recognises the two presets', () => {
    expect(isEveryDay(ALL_DAYS)).toBe(true);
    expect(isEveryDay(WEEKDAYS)).toBe(false);
    expect(isWeekdaysOnly(WEEKDAYS)).toBe(true);
    expect(isWeekdaysOnly([1, 2, 3, 4, 5, 6])).toBe(false);
  });
});

describe('dayName', () => {
  it('gives weekday names in the language asked for', () => {
    expect(dayName(1, 'en', 'long')).toBe('Monday');
    expect(dayName(7, 'en', 'long')).toBe('Sunday');
    expect(dayName(1, 'tr', 'long')).toBe('Pazartesi');
    expect(dayName(1, 'ar', 'long')).toMatch(/[؀-ۿ]/); // Arabic script
  });
});
