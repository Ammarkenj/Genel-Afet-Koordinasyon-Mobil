import { describe, expect, it } from 'vitest';
import { HOUR_MS, chartMax, countByType, hourlyCounts } from './stats';

const NOW = 1_700_000_000_000;
const at = (minAgo: number) => ({ createdAtMs: NOW - minAgo * 60_000 });

describe('hourlyCounts', () => {
  it('buckets by hour ending now, oldest first', () => {
    const r = [at(1), at(59), at(61), at(125), at(11 * 60 + 59), at(12 * 60), at(-5)];
    const c = hourlyCounts(r, NOW);
    expect(c).toHaveLength(12);
    expect(c[11]).toBe(2); // 1 and 59 minutes ago
    expect(c[10]).toBe(1); // 61 minutes ago
    expect(c[9]).toBe(1); // 125 minutes ago
    expect(c[0]).toBe(1); // 11h59m ago
    expect(c.reduce((a, b) => a + b, 0)).toBe(5); // 12h ago and future reports are excluded
  });
  it('handles an empty list', () => {
    expect(hourlyCounts([], NOW).every((n) => n === 0)).toBe(true);
    expect(HOUR_MS).toBe(3_600_000);
  });
});

describe('chartMax', () => {
  it('rounds up to a multiple of 4 with a floor of 4', () => {
    expect(chartMax([0, 0])).toBe(4);
    expect(chartMax([3])).toBe(4);
    expect(chartMax([5])).toBe(8);
    expect(chartMax([31])).toBe(32);
  });
});

describe('countByType', () => {
  it('counts help calls only, most frequent first', () => {
    const res = countByType([
      { kind: 'help', type: 'quake' }, { kind: 'help', type: 'quake' }, { kind: 'help', type: 'fire' },
      { kind: 'safe', type: null }, { kind: 'help', type: null },
    ]);
    expect(res).toEqual([['quake', 2], ['fire', 1], ['other', 1]]);
  });
});
