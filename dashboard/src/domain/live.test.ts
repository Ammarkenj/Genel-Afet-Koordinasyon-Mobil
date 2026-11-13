import { describe, expect, it } from 'vitest';
import { liveAssignments } from './live';
import type { AssignmentStatus } from './types';

const a = (id: string, status: AssignmentStatus, createdAtMs: number) => ({ id, status, createdAtMs });

describe('liveAssignments', () => {
  it('keeps only open assignments', () => {
    const list = [a('1', 'notified', 5), a('2', 'accepted', 4), a('3', 'enroute', 3), a('4', 'arrived', 2), a('5', 'done', 9), a('6', 'declined', 8)];
    expect(liveAssignments(list).map((x) => x.id).sort()).toEqual(['1', '2', '3', '4']);
  });
  it('puts new ones first, then the most recent', () => {
    const list = [a('old-new', 'notified', 1), a('late', 'enroute', 9), a('early', 'accepted', 3), a('fresh', 'notified', 7)];
    expect(liveAssignments(list).map((x) => x.id)).toEqual(['fresh', 'old-new', 'late', 'early']);
  });
  it('handles an empty list and does not change its input', () => {
    expect(liveAssignments([])).toEqual([]);
    const input = [a('x', 'done', 1), a('y', 'notified', 2)];
    liveAssignments(input);
    expect(input.map((x) => x.id)).toEqual(['x', 'y']);
  });
});
