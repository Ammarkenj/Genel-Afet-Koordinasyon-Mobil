import { describe, expect, it } from 'vitest';
import { buildPush, distanceKm, formatPassword, isPriority, normalizeLang, parseCenterRequest } from './notify';

const snap = { type: 'quake', kind: 'help', auto: false, district: 'Kadıköy', lat: 41.0, lng: 29.0 };
const center = { lat: 41.0, lng: 29.0 };

describe('buildPush', () => {
  it('builds Turkish text with distance and a link to the assignment', () => {
    const p = buildPush('tr', 'r1_c1', { ...snap, lat: 41.045, lng: 29.0 }, center);
    expect(p.title).toBe('Yeni bildirim · Deprem');
    expect(p.body).toBe('Kadıköy · 5.0 km');
    expect(p.url).toBe('/center/assignments/r1_c1');
    expect(p.tag).toBe('r1_c1');
    expect(p.dir).toBe('ltr');
  });
  it('builds Arabic text, right-to-left', () => {
    const p = buildPush('ar', 'a', snap, center);
    expect(p.title).toBe('بلاغ جديد · هزة أرضية');
    expect(p.body).toContain('كم');
    expect(p.dir).toBe('rtl');
  });
  it('marks an automatically detected fall as top priority in the title', () => {
    const fall = { ...snap, type: 'fall', auto: true };
    expect(isPriority(fall)).toBe(true);
    expect(buildPush('tr', 'a', fall, center).title).toContain('ÇOK YÜKSEK ÖNCELİK');
    expect(buildPush('ar', 'a', fall, center).title).toContain('أولوية قصوى');
    expect(isPriority({ ...fall, auto: false })).toBe(false);
  });
  it('falls back for an unknown incident type', () => {
    expect(buildPush('tr', 'a', { ...snap, type: 'meteor' }, center).title).toContain('Diğer');
    expect(buildPush('tr', 'a', { ...snap, type: null }, center).title).toContain('Diğer');
  });
});

describe('helpers', () => {
  it('computes distances', () => {
    expect(distanceKm(center, center)).toBe(0);
    expect(distanceKm({ lat: 41, lng: 29 }, { lat: 42, lng: 29 })).toBeCloseTo(111.2, 0);
  });
  it('normalizes the language', () => {
    expect(normalizeLang('ar')).toBe('ar');
    expect(normalizeLang('fr')).toBe('tr');
    expect(normalizeLang(undefined)).toBe('tr');
  });
  it('formats the temporary password in three groups', () => {
    expect(formatPassword('abcdefghijkl'.split(''))).toBe('abcd-efgh-ijkl');
  });
});

describe('parseCenterRequest', () => {
  const ok = { name: ' Kadıköy 112 ', email: ' A@B.ORG ', type: 'ems', status: 'ready', phone: '+90', address: 'x', lat: 41, lng: 29 };
  it('accepts a valid request and cleans it', () => {
    const r = parseCenterRequest(ok);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.name).toBe('Kadıköy 112');
      expect(r.value.email).toBe('a@b.org');
    }
  });
  it.each([
    ['empty name', { name: '  ' }],
    ['bad email', { email: 'nope' }],
    ['bad type', { type: 'police' }],
    ['bad status', { status: 'asleep' }],
    ['latitude out of range', { lat: 91 }],
    ['longitude out of range', { lng: -181 }],
    ['missing latitude', { lat: undefined }],
  ])('rejects %s', (_label, patch) => {
    expect(parseCenterRequest({ ...ok, ...patch }).ok).toBe(false);
  });
  it('rejects non-object input', () => {
    expect(parseCenterRequest(null).ok).toBe(false);
    expect(parseCenterRequest('x').ok).toBe(false);
  });
});
