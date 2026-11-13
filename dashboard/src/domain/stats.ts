import type { Report } from './types';

export const HOUR_MS = 3_600_000;

/** Reports per hour for the last `hours` hours, oldest first; the last bucket is "the hour that ends now". */
export function hourlyCounts(reports: Pick<Report, 'createdAtMs'>[], now: number, hours = 12): number[] {
  const out = new Array<number>(hours).fill(0);
  for (const r of reports) {
    const age = now - r.createdAtMs;
    if (age < 0 || age >= hours * HOUR_MS) continue;
    const i = hours - 1 - Math.floor(age / HOUR_MS);
    out[i] = (out[i] ?? 0) + 1;
  }
  return out;
}

/** A tidy chart ceiling (multiple of 4, at least 4) so the 4 grid lines carry whole numbers. */
export const chartMax = (counts: number[]): number => Math.max(4, Math.ceil(Math.max(0, ...counts) / 4) * 4);

/** Help calls by incident type, most frequent first. */
export function countByType(reports: Pick<Report, 'kind' | 'type'>[]): [string, number][] {
  const c = new Map<string, number>();
  for (const r of reports) if (r.kind === 'help') c.set(r.type ?? 'other', (c.get(r.type ?? 'other') ?? 0) + 1);
  return [...c.entries()].sort((a, b) => b[1] - a[1]);
}
