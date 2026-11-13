import type { Assignment } from './types';
import { ACTIVE_ASSIGNMENT } from './centerStats';

/** The assignments the live panel shows: still open (not done, not declined), new ones first, then the most recent. */
export function liveAssignments<T extends Pick<Assignment, 'status' | 'createdAtMs'>>(assignments: T[]): T[] {
  return assignments
    .filter((a) => ACTIVE_ASSIGNMENT.includes(a.status))
    .sort((a, b) => Number(b.status === 'notified') - Number(a.status === 'notified') || b.createdAtMs - a.createdAtMs);
}
