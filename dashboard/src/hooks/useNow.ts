import { useEffect, useState } from 'react';

/** Current time, refreshed on an interval so "5 min ago" labels stay correct without new data. */
export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

/** Whole minutes between a past instant and now (never negative). */
export const minutesAgo = (pastMs: number, now: number): number => Math.max(0, Math.floor((now - pastMs) / 60_000));
