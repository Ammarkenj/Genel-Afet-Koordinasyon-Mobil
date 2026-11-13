import { distanceKm, etaMinutes } from './geo';
import type { CenterType, IncidentType, LatLng, ServiceCenter } from './types';

/** Why a center type is suggested. Each value maps to an i18n key `why.<reason>`. */
export type SuggestReason = 'fall' | 'crash' | 'fire' | 'trapped' | 'quake' | 'injured' | 'any';

export interface NeedInput extends LatLng {
  type: IncidentType | null;
  injured: boolean | null;
  trapped: boolean | null;
  auto?: boolean;
  kind?: 'help' | 'safe';
}

export interface Suggestion {
  center: ServiceCenter;
  type: CenterType;
  reason: SuggestReason;
  km: number;
  etaMin: number;
  /** Busy, or ready on paper but with no free vehicle (then noFreeVehicle is also true). */
  busy: boolean;
  noFreeVehicle: boolean;
  /** Vehicles that can still go out / ready vehicles in total; null when vehicle data was not provided. */
  freeVehicles: number | null;
  readyVehicles: number | null;
}

export interface SuggestOptions {
  max?: number;
  /** Free vehicles per center. When given, a "ready" center with none free is treated as busy. */
  freeVehicles?: (c: ServiceCenter) => number;
  /** Center ids that already have this report. */
  skip?: Iterable<string>;
}

/** Center types a report needs, most important first.
 *  fall -> ambulance first (an auto-detected fall may mean loss of consciousness);
 *  crash -> ambulance, fire, rescue; fire -> fire; quake -> rescue then search and rescue (trapped raises rescue);
 *  injured people add an ambulance to any type. An "other" report has no fixed need (nearest center of any type). */
export function neededTypes(r: NeedInput): { type: CenterType; reason: SuggestReason }[] {
  const out: { type: CenterType; reason: SuggestReason }[] = [];
  const add = (type: CenterType, reason: SuggestReason) => {
    if (!out.some((o) => o.type === type)) out.push({ type, reason });
  };
  if (r.type === 'fall') add('ems', 'fall');
  else if (r.type === 'crash') {
    add('ems', 'crash');
    add('fire', 'crash');
    add('rescue', 'crash');
  } else if (r.type === 'fire') add('fire', 'fire');
  else if (r.type === 'quake') {
    const reason: SuggestReason = r.trapped ? 'trapped' : 'quake';
    add('rescue', reason);
    add('sar', reason);
  }
  if (r.injured) add('ems', 'injured');
  return out;
}

/** An automatically detected fall: the person may be unconscious, so the ambulance is the top priority. */
export const isPriorityReport = (r: NeedInput): boolean => r.kind === 'help' && r.type === 'fall' && !!r.auto;

const usable = (c: ServiceCenter) => c.active && c.status !== 'offline';

/** Ready centers without a free vehicle cannot take the job now: they are suggested like busy ones (last, with a note). */
const effectiveStatus = (c: ServiceCenter, free?: (c: ServiceCenter) => number): 'ready' | 'busy' => (c.status === 'ready' && free && free(c) <= 0 ? 'busy' : (c.status as 'ready' | 'busy'));

/** Up to `max` suggestions: the nearest ready center for each needed type, busy ones only when no ready one exists
 *  and always listed last. Offline or disabled centers are never suggested. */
export function suggestCenters(report: NeedInput, centers: ServiceCenter[], opts: SuggestOptions = {}): Suggestion[] {
  const max = opts.max ?? 3;
  const skip = new Set(opts.skip ?? []);
  const pool = centers.filter((c) => usable(c) && !skip.has(c.id));
  const dist = (c: ServiceCenter) => distanceKm(report, c);
  const byDistance = (a: ServiceCenter, b: ServiceCenter) => dist(a) - dist(b);

  const free = opts.freeVehicles;
  const eff = (c: ServiceCenter) => effectiveStatus(c, free);
  const best = (list: ServiceCenter[]): ServiceCenter | undefined =>
    list.filter((c) => eff(c) === 'ready').sort(byDistance)[0] ?? list.filter((c) => eff(c) === 'busy').sort(byDistance)[0];

  const picked: { center: ServiceCenter; reason: SuggestReason }[] = [];
  const needs = neededTypes(report);
  if (needs.length === 0) {
    pool
      .slice()
      .sort((a, b) => Number(eff(a) === 'busy') - Number(eff(b) === 'busy') || byDistance(a, b))
      .slice(0, max)
      .forEach((center) => picked.push({ center, reason: 'any' }));
  } else {
    for (const n of needs) {
      const center = best(pool.filter((c) => c.type === n.type));
      if (center && !picked.some((p) => p.center.id === center.id)) picked.push({ center, reason: n.reason });
    }
  }
  return picked
    .map((p, order) => {
      const km = dist(p.center);
      const s: Suggestion = {
        center: p.center,
        type: p.center.type,
        reason: p.reason,
        km: Math.round(km * 10) / 10,
        etaMin: etaMinutes(km),
        busy: eff(p.center) === 'busy',
        noFreeVehicle: p.center.status === 'ready' && !!free && free(p.center) <= 0,
        freeVehicles: free ? free(p.center) : null,
        readyVehicles: free ? p.center.stats.vehiclesReady : null,
      };
      return { s, order };
    })
    .sort((a, b) => Number(a.s.busy) - Number(b.s.busy) || a.order - b.order)
    .slice(0, max)
    .map((x) => x.s);
}
