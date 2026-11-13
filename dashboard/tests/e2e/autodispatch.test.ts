/* End-to-end: a crash or a fall from the app reaches the nearest ready ambulance center by itself (Cloud Function
 * onReportCreated on the emulators). Everything else is left for an operator. Run with `npm run test:e2e`. */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { initializeApp as initAdmin } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const db = () => getFirestore();
const made: { col: string; id: string }[] = [];

async function eventually<T>(read: () => Promise<T>, ok: (v: T) => boolean, ms = 15000): Promise<T> {
  const t0 = Date.now();
  let last = await read();
  while (!ok(last) && Date.now() - t0 < ms) {
    await new Promise((r) => setTimeout(r, 300));
    last = await read();
  }
  return last;
}

const center = async (id: string, type: string, status: string, lat: number, lng: number) => {
  await db().collection('centers').doc(id).set({ name: id, type, status, active: true, lat, lng, phone: '', address: '', email: `${id}@e2e.org`, stats: { vehicles: 1, vehiclesReady: 1, staff: 1, crews: 0 } });
  made.push({ col: 'centers', id });
};
const report = async (over: Record<string, unknown>) => {
  const ref = await db().collection('reports').add({
    no: 3001, kind: 'help', type: 'fall', auto: false, state: 'sent', injured: null, trapped: null, people: 1, ops: 'new',
    lat: 38.6748, lng: 39.2225, uid: 'app-user', createdAt: Timestamp.now(), ...over,
  });
  made.push({ col: 'reports', id: ref.id });
  return ref;
};
const assignmentsOf = async (reportId: string) => (await db().collection('assignments').where('reportId', '==', reportId).get()).docs;

beforeAll(async () => {
  initAdmin({ projectId: 'demo-yasamhatti' });
  await center('ad-near', 'ems', 'ready', 38.6712, 39.2158); // Elazığ
  await center('ad-far', 'ems', 'ready', 38.95, 39.55);
  await center('ad-fire', 'fire', 'ready', 38.6748, 39.2225);
});

afterAll(async () => {
  for (const r of made) await db().collection(r.col).doc(r.id).delete();
  for (const c of ['reports', 'assignments']) {
    const left = await db().collection(c).where('reportId', 'in', made.map((m) => m.id).concat('none')).get().catch(() => null);
    await Promise.all((left?.docs ?? []).map((d) => d.ref.delete()));
  }
});

describe('automatic dispatch of a new report', () => {
  it('hands a fall to the nearest ready ambulance center and marks the report dispatched', async () => {
    const ref = await report({ type: 'fall', auto: true });
    const docs = await eventually(() => assignmentsOf(ref.id), (d) => d.length > 0);
    expect(docs.map((d) => d.id)).toEqual([`${ref.id}_ad-near`]);
    const a = docs[0]?.data();
    expect(a).toMatchObject({ centerId: 'ad-near', status: 'notified', seen: false });
    expect(a?.snapshot).toMatchObject({ type: 'fall', kind: 'help', auto: true, lat: 38.6748, lng: 39.2225, no: 3001 });
    expect(a?.snapshot).not.toHaveProperty('deviceId');
    expect(a?.snapshot).not.toHaveProperty('uid');
    const after = await eventually(async () => (await ref.get()).get('ops'), (v) => v === 'dispatched');
    expect(after).toBe('dispatched');
  });

  it('does the same for a car crash', async () => {
    const ref = await report({ type: 'crash' });
    const docs = await eventually(() => assignmentsOf(ref.id), (d) => d.length > 0);
    expect(docs[0]?.get('centerId')).toBe('ad-near');
  });

  it('skips a center that is offline and picks the next one', async () => {
    await db().collection('centers').doc('ad-near').update({ status: 'offline' });
    const ref = await report({ type: 'fall' });
    const docs = await eventually(() => assignmentsOf(ref.id), (d) => d.length > 0);
    expect(docs[0]?.get('centerId')).toBe('ad-far');
    await db().collection('centers').doc('ad-near').update({ status: 'ready' });
  });

  it('leaves quakes, fires and safe reports for an operator', async () => {
    const refs = [await report({ type: 'quake' }), await report({ type: 'fire' }), await report({ kind: 'safe', type: null })];
    await new Promise((r) => setTimeout(r, 3000)); // give the trigger time to (wrongly) act
    for (const ref of refs) {
      expect(await assignmentsOf(ref.id)).toHaveLength(0);
      expect((await ref.get()).get('ops')).toBe('new');
    }
  });
});
