import { describe, expect, it } from 'vitest';
import { autoDispatchType, pickCenter } from './dispatch';

const ems = (id: string, lat: number, lng: number, over: Record<string, unknown> = {}) => ({ id, type: 'ems', status: 'ready', active: true, lat, lng, ...over });
const report = (over: Record<string, unknown> = {}) => ({ kind: 'help', type: 'fall', lat: 38.6748, lng: 39.2225, ...over });

describe('autoDispatchType', () => {
  it('sends a crash or a fall to the ambulance and nothing else', () => {
    expect(autoDispatchType(report({ type: 'fall' }))).toBe('ems');
    expect(autoDispatchType(report({ type: 'crash' }))).toBe('ems');
    for (const type of ['quake', 'fire', 'other', null]) expect(autoDispatchType(report({ type }))).toBeNull();
    expect(autoDispatchType(report({ kind: 'safe', type: null }))).toBeNull();
  });
});

describe('pickCenter', () => {
  it('picks the nearest ready ambulance center', () => {
    const near = ems('near', 38.6712, 39.2158);
    const far = ems('far', 38.9, 39.5);
    expect(pickCenter(report(), [far, near])?.id).toBe('near');
  });
  it('prefers a ready center over a nearer busy one, and uses a busy one when none is ready', () => {
    const busyNear = ems('busyNear', 38.675, 39.2225, { status: 'busy' });
    const readyFar = ems('readyFar', 38.9, 39.5);
    expect(pickCenter(report(), [busyNear, readyFar])?.id).toBe('readyFar');
    expect(pickCenter(report(), [busyNear])?.id).toBe('busyNear');
  });
  it('never picks offline, disabled or other-type centers', () => {
    const list = [ems('off', 38.6748, 39.2225, { status: 'offline' }), ems('disabled', 38.6748, 39.2225, { active: false }), { ...ems('fire', 38.6748, 39.2225), type: 'fire' }];
    expect(pickCenter(report(), list)).toBeNull();
  });
  it('returns null for reports that are not automatic or have no position', () => {
    const c = [ems('c', 38.67, 39.22)];
    expect(pickCenter(report({ type: 'quake' }), c)).toBeNull();
    expect(pickCenter(report({ lat: undefined }), c)).toBeNull();
    expect(pickCenter(report(), [])).toBeNull();
  });
});
