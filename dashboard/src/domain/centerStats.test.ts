import { describe, expect, it } from 'vitest';
import { centerStats, startOfDay } from './centerStats';
import type { Assignment, AssignmentStatus } from './types';

const MIN = 60_000;
const DAY = 86_400_000;
const TZ = 0; // deterministic: UTC days
const NOW = Date.UTC(2026, 10, 2, 15, 0, 0); // 2026-11-02 15:00 UTC
const TODAY = startOfDay(NOW, TZ);

const a = (over: Partial<Assignment> & { createdAtMs: number }): Assignment => ({
  id: 'x', reportId: 'r', centerId: 'c1', status: 'notified', updatedAtMs: 0, seen: true, crew: { vehicles: [], staff: [], teams: [] },
  acceptedAtMs: null, enrouteAtMs: null, arrivedAtMs: null, doneAtMs: null,
  snapshot: { no: 1, kind: 'help', type: 'quake', auto: false, injured: null, trapped: null, people: 1, district: 'x', lat: 0, lng: 0 },
  ...over,
});
const st = (status: AssignmentStatus) => status;

describe('startOfDay', () => {
  it('rounds down to midnight in the given zone', () => {
    expect(startOfDay(NOW, 0)).toBe(Date.UTC(2026, 10, 2));
    expect(startOfDay(NOW, -180)).toBe(Date.UTC(2026, 10, 2) - 180 * MIN); // UTC+3: local day starts at 21:00 UTC the day before
  });
});

describe('centerStats', () => {
  it('handles no data', () => {
    const s = centerStats([], NOW, 7, TZ);
    expect(s).toMatchObject({ active: 0, receivedToday: 0, doneToday: 0, avgAcceptMin: null, avgArriveMin: null, byType: [] });
    expect(s.perDay).toEqual([0, 0, 0, 0, 0, 0, 0]);
  });

  it('counts active, received today and done today', () => {
    const s = centerStats([
      a({ createdAtMs: NOW - 10 * MIN, status: st('notified') }),
      a({ createdAtMs: NOW - 60 * MIN, status: st('enroute') }),
      a({ createdAtMs: NOW - 120 * MIN, status: st('done'), doneAtMs: NOW - 30 * MIN }),
      a({ createdAtMs: TODAY - 5 * MIN, status: st('done'), doneAtMs: TODAY + 5 * MIN }), // created yesterday, finished today
      a({ createdAtMs: NOW - 20 * MIN, status: st('declined') }),
    ], NOW, 7, TZ);
    expect(s.active).toBe(2);
    expect(s.receivedToday).toBe(4);
    expect(s.doneToday).toBe(2);
  });

  it('puts assignments in the right day bucket, today last', () => {
    const s = centerStats([
      a({ createdAtMs: NOW - MIN }),
      a({ createdAtMs: NOW - 2 * MIN }),
      a({ createdAtMs: TODAY - DAY + 3600_000 }), // yesterday
      a({ createdAtMs: TODAY - 6 * DAY + 3600_000 }), // 6 days ago = first bucket
      a({ createdAtMs: TODAY - 7 * DAY + 3600_000 }), // 7 days ago: outside the window
    ], NOW, 7, TZ);
    expect(s.perDay).toEqual([1, 0, 0, 0, 0, 1, 2]);
  });

  it('averages response times in minutes, rounded to one decimal', () => {
    const t = NOW - 60 * MIN;
    const s = centerStats([
      a({ createdAtMs: t, acceptedAtMs: t + 2 * MIN, arrivedAtMs: t + 12 * MIN }),
      a({ createdAtMs: t, acceptedAtMs: t + 3 * MIN, arrivedAtMs: t + 15 * MIN }),
      a({ createdAtMs: t }), // no timings: ignored
    ], NOW, 7, TZ);
    expect(s.avgAcceptMin).toBe(2.5);
    expect(s.avgArriveMin).toBe(13.5);
  });

  it('never reports a negative time (clock skew)', () => {
    const s = centerStats([a({ createdAtMs: NOW - MIN, acceptedAtMs: NOW - 2 * MIN })], NOW, 7, TZ);
    expect(s.avgAcceptMin).toBe(0);
  });

  it('counts incident types, most frequent first, with a fallback for a missing type', () => {
    const quake = (n: number) => Array.from({ length: n }, () => a({ createdAtMs: NOW - MIN }));
    const fire = a({ createdAtMs: NOW - MIN, snapshot: { ...a({ createdAtMs: 0 }).snapshot, type: 'fire' } });
    const none = a({ createdAtMs: NOW - MIN, snapshot: { ...a({ createdAtMs: 0 }).snapshot, type: null } });
    expect(centerStats([...quake(3), fire, none], NOW, 7, TZ).byType).toEqual([['quake', 3], ['fire', 1], ['other', 1]]);
  });
});
