import type { Assignment, AssignmentStatus } from './types';

const DAY_MS = 86_400_000;
const MIN_MS = 60_000;

export const ACTIVE_ASSIGNMENT: AssignmentStatus[] = ['notified', 'accepted', 'enroute', 'arrived'];

/** Start of the local day containing `ms`. `tzOffsetMin` is `Date#getTimezoneOffset()` (minutes, west positive). */
export function startOfDay(ms: number, tzOffsetMin = new Date(ms).getTimezoneOffset()): number {
  const local = ms - tzOffsetMin * MIN_MS;
  return Math.floor(local / DAY_MS) * DAY_MS + tzOffsetMin * MIN_MS;
}

export interface CenterStatsView {
  active: number;
  receivedToday: number;
  doneToday: number;
  /** Average minutes from assignment to "accepted" (null when there is no data). */
  avgAcceptMin: number | null;
  /** Average minutes from assignment to "arrived". */
  avgArriveMin: number | null;
  /** Assignments created per day for the last `days` days, oldest first (the last one is today). */
  perDay: number[];
  /** Count per incident type, most frequent first. */
  byType: [string, number][];
}

const avg = (xs: number[]): number | null => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null);

export function centerStats(assignments: Assignment[], now: number, days = 7, tzOffsetMin?: number): CenterStatsView {
  const today = startOfDay(now, tzOffsetMin);
  const first = today - (days - 1) * DAY_MS;
  const perDay = new Array<number>(days).fill(0);
  const types = new Map<string, number>();
  const accept: number[] = [];
  const arrive: number[] = [];
  let active = 0;
  let receivedToday = 0;
  let doneToday = 0;

  for (const a of assignments) {
    if (ACTIVE_ASSIGNMENT.includes(a.status)) active++;
    if (a.createdAtMs >= today) receivedToday++;
    if (a.doneAtMs !== null && a.doneAtMs >= today) doneToday++;
    if (a.createdAtMs >= first && a.createdAtMs < today + DAY_MS) {
      const i = Math.floor((startOfDay(a.createdAtMs, tzOffsetMin) - first) / DAY_MS);
      if (i >= 0 && i < days) perDay[i] = (perDay[i] ?? 0) + 1;
      const key = a.snapshot.type ?? 'other';
      types.set(key, (types.get(key) ?? 0) + 1);
      if (a.acceptedAtMs !== null) accept.push(Math.max(0, (a.acceptedAtMs - a.createdAtMs) / MIN_MS));
      if (a.arrivedAtMs !== null) arrive.push(Math.max(0, (a.arrivedAtMs - a.createdAtMs) / MIN_MS));
    }
  }
  return {
    active, receivedToday, doneToday,
    avgAcceptMin: avg(accept), avgArriveMin: avg(arrive),
    perDay,
    byType: [...types.entries()].sort((a, b) => b[1] - a[1]),
  };
}
