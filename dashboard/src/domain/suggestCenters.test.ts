import { describe, expect, it } from 'vitest';
import { distanceKm, etaMinutes, isLat, isLng, parseCoord } from './geo';
import { isPriorityReport, neededTypes, suggestCenters, type NeedInput } from './suggestCenters';
import type { CenterStatus, CenterType, ServiceCenter } from './types';

const center = (id: string, type: CenterType, lat: number, lng: number, status: CenterStatus = 'ready', active = true): ServiceCenter => ({
  id, type, lat, lng, status, active, name: id, stats: { vehicles: 2, vehiclesReady: 2, staff: 0, crews: 0 }, phone: '', address: '', email: `${id}@x.org`,
});
const report = (o: Partial<NeedInput>): NeedInput => ({ lat: 41.0, lng: 29.0, type: 'other', injured: null, trapped: null, ...o });

const centers: ServiceCenter[] = [
  center('ems-near', 'ems', 41.01, 29.0),
  center('ems-far', 'ems', 41.1, 29.1),
  center('ems-busy-nearest', 'ems', 41.001, 29.0, 'busy'),
  center('fire-near', 'fire', 41.02, 29.0),
  center('fire-busy', 'fire', 41.005, 29.0, 'busy'),
  center('rescue', 'rescue', 41.03, 29.02),
  center('sar', 'sar', 41.04, 29.03),
  center('off', 'rescue', 41.0001, 29.0, 'offline'),
  center('disabled', 'sar', 41.0002, 29.0, 'ready', false),
];
const ids = (r: NeedInput, o = {}) => suggestCenters(r, centers, o).map((s) => s.center.id);

describe('geo', () => {
  it('computes haversine distance', () => {
    expect(distanceKm({ lat: 41, lng: 29 }, { lat: 41, lng: 29 })).toBe(0);
    expect(distanceKm({ lat: 41, lng: 29 }, { lat: 42, lng: 29 })).toBeCloseTo(111.2, 0);
  });
  it('gives a minimum eta of 2 minutes', () => {
    expect(etaMinutes(0)).toBe(2);
    expect(etaMinutes(7)).toBe(11);
  });
  it('validates coordinates', () => {
    expect(isLat(90) && isLat(-90) && !isLat(90.1) && !isLat(NaN)).toBe(true);
    expect(isLng(180) && isLng(-180) && !isLng(181)).toBe(true);
    expect(parseCoord(' 41,5 ')).toBe(41.5);
    expect(parseCoord('')).toBeNaN();
    expect(parseCoord('abc')).toBeNaN();
  });
});

describe('neededTypes', () => {
  it('covers each incident type', () => {
    expect(neededTypes(report({ type: 'fall' })).map((n) => n.type)).toEqual(['ems']);
    expect(neededTypes(report({ type: 'crash' })).map((n) => n.type)).toEqual(['ems', 'fire', 'rescue']);
    expect(neededTypes(report({ type: 'fire' })).map((n) => n.type)).toEqual(['fire']);
    expect(neededTypes(report({ type: 'quake' })).map((n) => n.type)).toEqual(['rescue', 'sar']);
    expect(neededTypes(report({ type: 'other' }))).toEqual([]);
  });
  it('injured adds an ambulance, trapped changes the quake reason', () => {
    expect(neededTypes(report({ type: 'fire', injured: true })).map((n) => n.type)).toEqual(['fire', 'ems']);
    expect(neededTypes(report({ type: 'quake', trapped: true }))[0]?.reason).toBe('trapped');
    expect(neededTypes(report({ type: 'crash', injured: true })).filter((n) => n.type === 'ems')).toHaveLength(1);
  });
  it('flags auto-detected falls as priority', () => {
    expect(isPriorityReport(report({ type: 'fall', auto: true, kind: 'help' }))).toBe(true);
    expect(isPriorityReport(report({ type: 'fall', auto: false, kind: 'help' }))).toBe(false);
    expect(isPriorityReport(report({ type: 'quake', auto: true, kind: 'help' }))).toBe(false);
  });
});

describe('suggestCenters', () => {
  it('fall suggests the nearest READY ambulance, not a nearer busy one', () => {
    expect(ids(report({ type: 'fall' }))).toEqual(['ems-near']);
  });
  it('crash suggests ambulance, fire and rescue', () => {
    expect(ids(report({ type: 'crash' }))).toEqual(['ems-near', 'fire-near', 'rescue']);
  });
  it('quake with trapped and injured suggests rescue, search and rescue, ambulance (capped at 3)', () => {
    expect(ids(report({ type: 'quake', trapped: true, injured: true }))).toEqual(['rescue', 'sar', 'ems-near']);
  });
  it('never suggests offline or disabled centers', () => {
    const all = suggestCenters(report({ type: 'quake', trapped: true }), centers, { max: 10 }).map((s) => s.center.id);
    expect(all).not.toContain('off');
    expect(all).not.toContain('disabled');
  });
  it('suggests a busy center only when no ready one exists, flagged and last', () => {
    const onlyBusy = centers.filter((c) => c.id !== 'fire-near');
    const res = suggestCenters(report({ type: 'fire' }), onlyBusy);
    expect(res).toHaveLength(1);
    expect(res[0]?.center.id).toBe('fire-busy');
    expect(res[0]?.busy).toBe(true);
    const mixed = suggestCenters(report({ type: 'crash' }), onlyBusy.filter((c) => c.id !== 'ems-near' && c.id !== 'ems-far'));
    // ready rescue first; the busy ambulance and busy fire station follow, flagged
    expect(mixed.map((s) => s.busy)).toEqual([false, true, true]);
    expect(mixed[0]?.center.id).toBe('rescue');
  });
  it('"other" returns the nearest 3 usable centers of any type', () => {
    const res = suggestCenters(report({ type: 'other' }), centers);
    expect(res).toHaveLength(3);
    expect(res.every((s) => s.reason === 'any')).toBe(true);
  });
  it('skips centers that already have the report', () => {
    expect(ids(report({ type: 'fall' }), { skip: ['ems-near'] })).toEqual(['ems-far']);
  });
  it('rounds distance to 0.1 km and gives an eta', () => {
    const [s] = suggestCenters(report({ type: 'fall' }), centers);
    expect(s?.km).toBeCloseTo(1.1, 1);
    expect(s?.etaMin).toBeGreaterThanOrEqual(2);
  });
  it('treats a ready center with no free vehicle as busy: another ready center wins', () => {
    const free = (c: ServiceCenter) => (c.id === 'ems-near' ? 0 : 2);
    const res = suggestCenters(report({ type: 'fall' }), centers, { freeVehicles: free });
    expect(res.map((s) => s.center.id)).toEqual(['ems-far']);
    expect(res[0]).toMatchObject({ busy: false, noFreeVehicle: false, freeVehicles: 2, readyVehicles: 2 });
  });
  it('still suggests it, last and flagged, when no other center can take the job', () => {
    const only = centers.filter((c) => c.type !== 'ems' || c.id === 'ems-near');
    const res = suggestCenters(report({ type: 'crash' }), only, { freeVehicles: (c) => (c.id === 'ems-near' ? 0 : 1) });
    expect(res.map((s) => s.center.id)).toEqual(['fire-near', 'rescue', 'ems-near']);
    expect(res[2]).toMatchObject({ busy: true, noFreeVehicle: true, freeVehicles: 0 });
  });
  it('leaves vehicle fields null when no vehicle data is given', () => {
    const [s] = suggestCenters(report({ type: 'fall' }), centers);
    expect(s).toMatchObject({ freeVehicles: null, readyVehicles: null, noFreeVehicle: false });
  });
  it('returns nothing when there is no center', () => {
    expect(suggestCenters(report({ type: 'fire' }), [])).toEqual([]);
  });
});
