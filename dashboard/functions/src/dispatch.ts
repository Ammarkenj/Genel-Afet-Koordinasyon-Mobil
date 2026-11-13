/** Automatic dispatch of a new report. Pure and dependency-free so it can be tested without Firebase.
 *
 *  Only the cases where the right service is certain are automatic: a car crash or a sudden fall goes to the nearest
 *  ambulance (EMS) center. Everything else (quake, fire, other, "I am safe") stays with the operations room.
 *  The same rule is shown to admins as the "ambulance first" suggestion in src/domain/suggestCenters.ts. */
import { distanceKm } from './notify';

export interface DispatchReport {
  kind?: unknown;
  type?: unknown;
  lat?: unknown;
  lng?: unknown;
}

export interface DispatchCenter {
  id: string;
  type?: unknown;
  status?: unknown;
  active?: unknown;
  lat?: unknown;
  lng?: unknown;
}

/** The center type that receives the report automatically, or null when an operator must decide. */
export function autoDispatchType(r: DispatchReport): 'ems' | null {
  return r.kind === 'help' && (r.type === 'crash' || r.type === 'fall') ? 'ems' : null;
}

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** The nearest ready center of the needed type; a busy one only when none is ready. Offline and disabled centers
 *  are never chosen. Returns null when the report has no position or no center qualifies. */
export function pickCenter(r: DispatchReport, centers: DispatchCenter[]): DispatchCenter | null {
  const type = autoDispatchType(r);
  if (!type || !isNum(r.lat) || !isNum(r.lng)) return null;
  const from = { lat: r.lat, lng: r.lng };
  const usable = centers
    .filter((c) => c.type === type && c.active !== false && (c.status === 'ready' || c.status === 'busy') && isNum(c.lat) && isNum(c.lng))
    .map((c) => ({ c, km: distanceKm(from, { lat: c.lat as number, lng: c.lng as number }), busy: c.status === 'busy' }))
    .sort((a, b) => Number(a.busy) - Number(b.busy) || a.km - b.km);
  return usable[0]?.c ?? null;
}
