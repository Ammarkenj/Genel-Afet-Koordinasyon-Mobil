import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';

/** Security-rules tests. Run with `npm run test:rules` (starts the Firestore emulator). */
let env: RulesTestEnvironment;

const snapshot = (over: Record<string, unknown> = {}) => ({
  no: 1048, kind: 'help', type: 'quake', auto: false, injured: true, trapped: true, people: 4, district: 'Kadıköy', lat: 40.99, lng: 29.03, ...over,
});
const newReport = (over: Record<string, unknown> = {}) => ({
  kind: 'help', type: 'quake', auto: false, state: 'sent', injured: null, trapped: null, people: 2, lat: 41.0, lng: 29.0, district: 'Fatih', createdAt: serverTimestamp(), ...over,
});
const newAssignment = (over: Record<string, unknown> = {}) => ({
  reportId: 'r1', centerId: 'c1', status: 'notified', seen: false, snapshot: snapshot(), createdAt: serverTimestamp(), updatedAt: serverTimestamp(), ...over,
});

const STAMPS: Record<string, string> = { accepted: 'acceptedAt', enroute: 'enrouteAt', arrived: 'arrivedAt', done: 'doneAt' };
/** The matching server-time stamp a center must write with a step. */
const stamp = (status: string) => (STAMPS[status] ? { [STAMPS[status]]: serverTimestamp() } : {});
const admin = () => env.authenticatedContext('admin-uid', { role: 'admin' }).firestore();
const center = (id = 'c1') => env.authenticatedContext(`${id}-uid`, { role: 'center', centerId: id }).firestore();
const anon = () => env.authenticatedContext('anon-uid', {}).firestore();
const guest = () => env.unauthenticatedContext().firestore();

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-yasamhatti',
    firestore: { rules: readFileSync(resolve(__dirname, '../../firestore.rules'), 'utf8'), host: '127.0.0.1', port: 8080 },
  });
});
afterAll(async () => env.cleanup());

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    const base = { name: 'Center', type: 'ems', status: 'ready', stats: { vehicles: 2, vehiclesReady: 2, staff: 3, crews: 1 }, phone: '+90', address: 'x', email: 'c@x.org', active: true, authUid: 'u', lat: 41, lng: 29 };
    await setDoc(doc(db, 'centers/c1'), { ...base, name: 'Center 1' });
    await setDoc(doc(db, 'centers/c2'), { ...base, name: 'Center 2' });
    await setDoc(doc(db, 'reports/r1'), { ...newReport(), no: 1048, ops: 'new', createdAt: new Date() });
    await setDoc(doc(db, 'assignments/r1_c1'), { ...newAssignment(), createdAt: new Date(), updatedAt: new Date() });
    await setDoc(doc(db, 'assignments/r1_c2'), { ...newAssignment({ centerId: 'c2' }), createdAt: new Date(), updatedAt: new Date() });
    await setDoc(doc(db, 'needs/n1'), { need: 'aid', urgency: 2, district: 'Fatih', lat: 41, lng: 29 });
    await setDoc(doc(db, 'assemblyAreas/a1'), { number: 1, name: 'Park', capacity: 100, occupied: 0, lat: 41, lng: 29 });
    await setDoc(doc(db, 'tasks/t1'), { need: 'aid', state: 'sent', done: false });
  });
});

describe('reports', () => {
  it('lets a signed-in app user (anonymous auth) create a well-formed report', async () => {
    await assertSucceeds(setDoc(doc(anon(), 'reports/new1'), newReport()));
  });
  it('rejects an unauthenticated create', async () => {
    await assertFails(setDoc(doc(guest(), 'reports/new1'), newReport()));
  });
  it('rejects malformed reports', async () => {
    const db = anon();
    await assertFails(setDoc(doc(db, 'reports/b1'), newReport({ ops: 'dispatched' })));
    await assertFails(setDoc(doc(db, 'reports/b2'), newReport({ lat: 95 })));
    await assertFails(setDoc(doc(db, 'reports/b3'), newReport({ lng: -181 })));
    await assertFails(setDoc(doc(db, 'reports/b4'), newReport({ kind: 'spam' })));
    await assertFails(setDoc(doc(db, 'reports/b5'), newReport({ type: 'meteor' })));
    await assertFails(setDoc(doc(db, 'reports/b6'), newReport({ people: 0 })));
    await assertFails(setDoc(doc(db, 'reports/b7'), newReport({ people: 100000 })));
    await assertFails(setDoc(doc(db, 'reports/b8'), newReport({ extra: 'field' })));
    await assertFails(setDoc(doc(db, 'reports/b9'), newReport({ createdAt: new Date(0) })));
  });
  it('does not let a center or an admin act as the app', async () => {
    await assertFails(setDoc(doc(center(), 'reports/c'), newReport()));
    await assertFails(setDoc(doc(admin(), 'reports/a'), newReport()));
  });
  it('is readable only by admins', async () => {
    await assertSucceeds(getDoc(doc(admin(), 'reports/r1')));
    await assertFails(getDoc(doc(anon(), 'reports/r1')));
    await assertFails(getDoc(doc(center(), 'reports/r1')));
    await assertFails(getDoc(doc(guest(), 'reports/r1')));
  });
  it('lets admins change only the operational status', async () => {
    await assertSucceeds(updateDoc(doc(admin(), 'reports/r1'), { ops: 'dispatched', updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(admin(), 'reports/r1'), { ops: 'nonsense' }));
    await assertFails(updateDoc(doc(admin(), 'reports/r1'), { lat: 10 }));
    await assertFails(updateDoc(doc(anon(), 'reports/r1'), { ops: 'resolved' }));
    await assertFails(updateDoc(doc(center(), 'reports/r1'), { ops: 'resolved' }));
  });
});

describe('reports made by the app (owner edits)', () => {
  /** Exactly what the Flutter app writes (FirestoreReportsRepository). */
  const clean = (o: Record<string, unknown>) => Object.fromEntries(Object.entries(o).filter(([k]) => k !== 'district'));
  const appReport = (over: Record<string, unknown> = {}) =>
    clean(newReport({ no: 12345, type: null, state: 'sent', deviceId: 'anon-uid', uid: 'anon-uid', ops: 'new', ...over }));
  const other = () => env.authenticatedContext('other-uid', {}).firestore();
  const mark = async (ops: string) =>
    env.withSecurityRulesDisabled(async (ctx) => setDoc(doc(ctx.firestore(), 'reports/mine'), { ...appReport(), createdAt: new Date(), ops }));

  it('accepts the exact payload the app sends, and rejects someone else\'s uid', async () => {
    await assertSucceeds(setDoc(doc(anon(), 'reports/app1'), appReport()));
    await assertFails(setDoc(doc(anon(), 'reports/app2'), appReport({ uid: 'other-uid' })));
  });
  it('lets the owner fill in the details while the report is new', async () => {
    await mark('new');
    await assertSucceeds(updateDoc(doc(anon(), 'reports/mine'), { injured: true }));
    await assertSucceeds(updateDoc(doc(anon(), 'reports/mine'), { trapped: false, people: 3 }));
    await assertSucceeds(updateDoc(doc(anon(), 'reports/mine'), { injured: null }));
  });
  it('rejects owner edits of anything else, bad values, other users and reports the operators touched', async () => {
    await mark('new');
    await assertFails(updateDoc(doc(anon(), 'reports/mine'), { ops: 'resolved' }));
    await assertFails(updateDoc(doc(anon(), 'reports/mine'), { lat: 10 }));
    await assertFails(updateDoc(doc(anon(), 'reports/mine'), { uid: 'other-uid' }));
    await assertFails(updateDoc(doc(anon(), 'reports/mine'), { people: 0 }));
    await assertFails(updateDoc(doc(anon(), 'reports/mine'), { injured: 'yes' }));
    await assertFails(updateDoc(doc(other(), 'reports/mine'), { injured: true }));
    await assertFails(updateDoc(doc(anon(), 'reports/r1'), { injured: true })); // r1 has no uid
    await mark('dispatched');
    await assertFails(updateDoc(doc(anon(), 'reports/mine'), { injured: true }));
  });
  it('lets the owner take the report back only while it is new', async () => {
    await mark('new');
    await assertFails(deleteDoc(doc(other(), 'reports/mine')));
    await assertSucceeds(deleteDoc(doc(anon(), 'reports/mine')));
    await mark('dispatched');
    await assertFails(deleteDoc(doc(anon(), 'reports/mine')));
    await assertFails(deleteDoc(doc(anon(), 'reports/r1')));
  });
  it('does not let a center act as the owner', async () => {
    await mark('new');
    await assertFails(updateDoc(doc(center(), 'reports/mine'), { injured: true }));
    await assertFails(deleteDoc(doc(center(), 'reports/mine')));
  });
});

describe('centers', () => {
  it('lets a center read only its own document', async () => {
    await assertSucceeds(getDoc(doc(center('c1'), 'centers/c1')));
    await assertFails(getDoc(doc(center('c1'), 'centers/c2')));
    await assertSucceeds(getDoc(doc(admin(), 'centers/c2')));
    await assertFails(getDoc(doc(anon(), 'centers/c1')));
    await assertFails(getDocs(collection(center('c1'), 'centers')));
  });
  it('is never created or deleted from a client (Cloud Functions only)', async () => {
    const data = { name: 'N', type: 'fire', status: 'ready', phone: '', address: '', lat: 1, lng: 1 };
    await assertFails(setDoc(doc(admin(), 'centers/new'), data));
    await assertFails(deleteDoc(doc(admin(), 'centers/c1')));
  });
  it('lets an admin edit descriptive fields but not account fields', async () => {
    const db = admin();
    await assertSucceeds(updateDoc(doc(db, 'centers/c1'), { name: 'Renamed', phone: '+90 1', lat: 41.1, lng: 29.1, updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(db, 'centers/c1'), { active: false }));
    await assertFails(updateDoc(doc(db, 'centers/c1'), { email: 'evil@x.org' }));
    await assertFails(updateDoc(doc(db, 'centers/c1'), { authUid: 'someone-else' }));
    await assertFails(updateDoc(doc(db, 'centers/c1'), { lat: 200 }));
    await assertFails(updateDoc(doc(db, 'centers/c1'), { type: 'police' }));
    await assertFails(updateDoc(doc(db, 'centers/c1'), { stats: { vehicles: 99, vehiclesReady: 99, staff: 0, crews: 0 } })); // counts come from Cloud Functions only
  });
  it('lets a center change only its own availability', async () => {
    await assertSucceeds(updateDoc(doc(center('c1'), 'centers/c1'), { status: 'busy', updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(center('c1'), 'centers/c1'), { status: 'asleep', updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(center('c1'), 'centers/c1'), { name: 'Hacked', updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(center('c1'), 'centers/c1'), { status: 'busy', active: false, updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(center('c1'), 'centers/c2'), { status: 'busy', updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(anon(), 'centers/c1'), { status: 'busy', updatedAt: serverTimestamp() }));
  });
  it('lets a center register only its own push tokens', async () => {
    const token = 'x'.repeat(40);
    const ok = { token, lang: 'tr', updatedAt: serverTimestamp() };
    await assertSucceeds(setDoc(doc(center('c1'), 'centers/c1/devices/d1'), ok));
    await assertFails(setDoc(doc(center('c1'), 'centers/c2/devices/d1'), ok));
    await assertFails(setDoc(doc(center('c1'), 'centers/c1/devices/d2'), { ...ok, extra: 1 }));
    await assertFails(setDoc(doc(center('c1'), 'centers/c1/devices/d3'), { ...ok, lang: 'xx' }));
    await assertFails(setDoc(doc(center('c1'), 'centers/c1/devices/d4'), { ...ok, token: 'short' }));
    await assertFails(setDoc(doc(anon(), 'centers/c1/devices/d5'), ok));
    await assertFails(getDoc(doc(center('c1'), 'centers/c1/devices/d1')));
  });
});

describe('assignments', () => {
  it('lets an admin create a well-formed assignment with the deterministic id', async () => {
    await assertSucceeds(setDoc(doc(admin(), 'assignments/r9_c1'), newAssignment({ reportId: 'r9' })));
  });
  it('rejects bad assignments', async () => {
    const db = admin();
    await assertFails(setDoc(doc(db, 'assignments/wrong-id'), newAssignment({ reportId: 'r9' })));
    await assertFails(setDoc(doc(db, 'assignments/r9_c1'), newAssignment({ reportId: 'r9', status: 'accepted' })));
    await assertFails(setDoc(doc(db, 'assignments/r9_c1'), newAssignment({ reportId: 'r9', seen: true })));
    await assertFails(setDoc(doc(db, 'assignments/r9_c1'), newAssignment({ reportId: 'r9', snapshot: snapshot({ deviceId: 'leak' }) })));
    await assertFails(setDoc(doc(db, 'assignments/r9_c1'), newAssignment({ reportId: 'r9', snapshot: snapshot({ lat: 999 }) })));
    await assertFails(setDoc(doc(anon(), 'assignments/r9_c1'), newAssignment({ reportId: 'r9' })));
    await assertFails(setDoc(doc(center('c1'), 'assignments/r9_c1'), newAssignment({ reportId: 'r9' })));
  });
  it('shows a center only its own assignments', async () => {
    await assertSucceeds(getDoc(doc(center('c1'), 'assignments/r1_c1')));
    await assertFails(getDoc(doc(center('c1'), 'assignments/r1_c2')));
    await assertSucceeds(getDocs(query(collection(center('c1'), 'assignments'), where('centerId', '==', 'c1'))));
    await assertFails(getDocs(query(collection(center('c1'), 'assignments'), where('centerId', '==', 'c2'))));
    await assertFails(getDocs(collection(center('c1'), 'assignments')));
    await assertSucceeds(getDocs(collection(admin(), 'assignments')));
    await assertFails(getDoc(doc(anon(), 'assignments/r1_c1')));
    await assertFails(getDoc(doc(guest(), 'assignments/r1_c1')));
  });
  it('follows the status flow notified > accepted > enroute > arrived > done', async () => {
    const ref = (c = center('c1')) => doc(c, 'assignments/r1_c1');
    const step = (status: string) => updateDoc(ref(), { status, updatedAt: serverTimestamp(), ...stamp(status) });
    await assertFails(step('arrived')); // cannot skip ahead
    await assertFails(step('done'));
    await assertSucceeds(step('accepted'));
    await assertFails(step('declined')); // declining is only possible from "notified"
    await assertFails(step('arrived'));
    await assertSucceeds(step('enroute'));
    await assertSucceeds(step('arrived'));
    await assertFails(step('enroute')); // no going back
    await assertSucceeds(step('done'));
    await assertFails(step('notified'));
    await assertFails(step('accepted'));
  });
  it('lets a center decline from "notified"', async () => {
    await assertSucceeds(updateDoc(doc(center('c1'), 'assignments/r1_c1'), { status: 'declined', updatedAt: serverTimestamp() }));
  });
  it('stops a center changing anything but status, seen and updatedAt', async () => {
    const ref = doc(center('c1'), 'assignments/r1_c1');
    await assertFails(updateDoc(ref, { centerId: 'c2', updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(ref, { snapshot: snapshot({ people: 99 }), updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(ref, { reportId: 'other', updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(ref, { status: 'accepted' })); // updatedAt must be the server time
    await assertFails(updateDoc(ref, { status: 'accepted', updatedAt: new Date(0) }));
  });
  it("stops a center touching another center's assignment", async () => {
    await assertFails(updateDoc(doc(center('c1'), 'assignments/r1_c2'), { status: 'accepted', updatedAt: serverTimestamp() }));
  });
  it('lets a center mark an assignment seen, never unseen', async () => {
    await assertSucceeds(updateDoc(doc(center('c1'), 'assignments/r1_c1'), { seen: true, updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(center('c1'), 'assignments/r1_c1'), { seen: false, updatedAt: serverTimestamp() }));
  });
  it('does not let a center create or delete assignments', async () => {
    await assertFails(deleteDoc(doc(center('c1'), 'assignments/r1_c1')));
    await assertSucceeds(deleteDoc(doc(admin(), 'assignments/r1_c1')));
  });
});

describe('staff and vehicles', () => {
  const staff = (over: Record<string, unknown> = {}) => ({ name: 'Ayşe Demir', role: 'paramedic', phone: '+90 555 000 00 00', note: '', status: 'on_duty', workDays: [1, 2, 3, 4, 5], createdAt: serverTimestamp(), updatedAt: serverTimestamp(), ...over });
  const vehicle = (over: Record<string, unknown> = {}) => ({ code: '34 AMB 112', kind: 'ambulance', seats: 4, status: 'ready', createdAt: serverTimestamp(), updatedAt: serverTimestamp(), ...over });

  it('lets a center manage only its own staff', async () => {
    await assertSucceeds(setDoc(doc(center('c1'), 'centers/c1/staff/s1'), staff()));
    await assertFails(setDoc(doc(center('c1'), 'centers/c2/staff/s1'), staff()));
    await assertFails(setDoc(doc(anon(), 'centers/c1/staff/s2'), staff()));
    await assertFails(setDoc(doc(admin(), 'centers/c1/staff/s3'), staff())); // admins read, they do not edit a center's team
    await assertFails(setDoc(doc(guest(), 'centers/c1/staff/s4'), staff()));
  });
  it('validates staff fields', async () => {
    const db = center('c1');
    await assertFails(setDoc(doc(db, 'centers/c1/staff/b1'), staff({ name: '' })));
    await assertFails(setDoc(doc(db, 'centers/c1/staff/b2'), staff({ role: 'wizard' })));
    await assertFails(setDoc(doc(db, 'centers/c1/staff/b3'), staff({ status: 'asleep' })));
    await assertFails(setDoc(doc(db, 'centers/c1/staff/b4'), staff({ extra: 1 })));
    await assertFails(setDoc(doc(db, 'centers/c1/staff/b5'), staff({ note: 'x'.repeat(201) })));
    await assertFails(setDoc(doc(db, 'centers/c1/staff/b6'), staff({ createdAt: new Date(0) })));
    await assertFails(setDoc(doc(db, 'centers/c1/staff/b7'), staff({ workDays: [] }))); // at least one working day
    await assertFails(setDoc(doc(db, 'centers/c1/staff/b8'), staff({ workDays: [1, 2, 3, 4, 5, 6, 7, 1] }))); // more entries than days of the week
    await assertFails(setDoc(doc(db, 'centers/c1/staff/b9'), staff({ workDays: 'monday' }))); // not a list
    await assertSucceeds(setDoc(doc(db, 'centers/c1/staff/ok1'), staff({ workDays: [1, 3, 5] })));
    await assertSucceeds(setDoc(doc(db, 'centers/c1/staff/ok2'), (({ workDays: _w, ...rest }) => rest)(staff()))); // records from before schedules existed
  });
  it('lets a center edit and delete its staff but not rewrite their creation time', async () => {
    await env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), 'centers/c1/staff/s9'), { name: 'X', role: 'driver', phone: '', note: '', status: 'on_duty', createdAt: new Date(1000), updatedAt: new Date(1000) }));
    const ref = doc(center('c1'), 'centers/c1/staff/s9');
    await assertSucceeds(updateDoc(ref, { status: 'leave', updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(ref, { createdAt: serverTimestamp(), updatedAt: serverTimestamp() }));
    await assertSucceeds(deleteDoc(ref));
  });
  it('shows a center its own team and the admin every team, nobody else', async () => {
    await env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), 'centers/c2/staff/s1'), { name: 'Other', role: 'driver', phone: '', note: '', status: 'on_duty', createdAt: new Date(), updatedAt: new Date() }));
    await assertSucceeds(getDocs(collection(center('c2'), 'centers/c2/staff')));
    await assertFails(getDocs(collection(center('c1'), 'centers/c2/staff')));
    await assertSucceeds(getDocs(collection(admin(), 'centers/c2/staff')));
    await assertFails(getDocs(collection(anon(), 'centers/c2/staff')));
  });
  it('lets a center manage only its own vehicles, with valid fields', async () => {
    const db = center('c1');
    await assertSucceeds(setDoc(doc(db, 'centers/c1/vehicles/v1'), vehicle()));
    await assertFails(setDoc(doc(db, 'centers/c2/vehicles/v1'), vehicle()));
    await assertFails(setDoc(doc(db, 'centers/c1/vehicles/b1'), vehicle({ code: '' })));
    await assertFails(setDoc(doc(db, 'centers/c1/vehicles/b2'), vehicle({ kind: 'spaceship' })));
    await assertFails(setDoc(doc(db, 'centers/c1/vehicles/b3'), vehicle({ seats: 0 })));
    await assertFails(setDoc(doc(db, 'centers/c1/vehicles/b4'), vehicle({ seats: 2.5 })));
    await assertFails(setDoc(doc(db, 'centers/c1/vehicles/b5'), vehicle({ status: 'on_mission' }))); // "on a mission" is derived, never stored
    await assertFails(setDoc(doc(admin(), 'centers/c1/vehicles/b6'), vehicle()));
    await assertSucceeds(getDocs(collection(admin(), 'centers/c1/vehicles')));
    await assertFails(getDocs(collection(anon(), 'centers/c1/vehicles'))); // vehicles are not public
    await assertFails(getDocs(collection(center('c2'), 'centers/c1/vehicles'))); // nor visible to another center
    await assertFails(getDocs(collection(guest(), 'centers/c1/vehicles')));
    await assertSucceeds(deleteDoc(doc(db, 'centers/c1/vehicles/v1')));
  });
});

describe('ready crews', () => {
  const crewDoc = (over: Record<string, unknown> = {}) => ({ name: 'Alfa', vehicleId: 'v1', memberIds: ['s1', 's2'], leaderId: 's1', workDays: [1, 2, 3, 4, 5], note: '', createdAt: serverTimestamp(), updatedAt: serverTimestamp(), ...over });

  it('lets a center manage only its own crews', async () => {
    await assertSucceeds(setDoc(doc(center('c1'), 'centers/c1/crews/t1'), crewDoc()));
    await assertFails(setDoc(doc(center('c1'), 'centers/c2/crews/t1'), crewDoc())); // another center
    await assertFails(setDoc(doc(anon(), 'centers/c1/crews/t2'), crewDoc()));
    await assertFails(setDoc(doc(guest(), 'centers/c1/crews/t3'), crewDoc()));
    await assertFails(setDoc(doc(admin(), 'centers/c1/crews/t4'), crewDoc())); // admins read, they do not edit the crews of a center
  });
  it('lets only the owner and the admin read them', async () => {
    await assertSucceeds(getDocs(collection(center('c1'), 'centers/c1/crews')));
    await assertSucceeds(getDocs(collection(admin(), 'centers/c1/crews')));
    await assertFails(getDocs(collection(center('c2'), 'centers/c1/crews')));
    await assertFails(getDocs(collection(anon(), 'centers/c1/crews')));
    await assertFails(getDocs(collection(guest(), 'centers/c1/crews')));
  });
  it('rejects invalid crews', async () => {
    const db = center('c1');
    await assertFails(setDoc(doc(db, 'centers/c1/crews/b1'), crewDoc({ name: '' })));
    await assertFails(setDoc(doc(db, 'centers/c1/crews/b2'), crewDoc({ name: 'x'.repeat(61) })));
    await assertFails(setDoc(doc(db, 'centers/c1/crews/b3'), crewDoc({ workDays: [] }))); // at least one working day
    await assertFails(setDoc(doc(db, 'centers/c1/crews/b4'), crewDoc({ workDays: [1, 2, 3, 4, 5, 6, 7, 1] })));
    await assertFails(setDoc(doc(db, 'centers/c1/crews/b5'), crewDoc({ memberIds: Array.from({ length: 31 }, (_, i) => 's' + i) })));
    await assertFails(setDoc(doc(db, 'centers/c1/crews/b6'), crewDoc({ memberIds: 's1' }))); // not a list
    await assertFails(setDoc(doc(db, 'centers/c1/crews/b7'), crewDoc({ extra: 1 })));
    await assertFails(setDoc(doc(db, 'centers/c1/crews/b8'), crewDoc({ note: 'x'.repeat(201) })));
    await assertFails(setDoc(doc(db, 'centers/c1/crews/b9'), crewDoc({ createdAt: new Date(0) })));
    await assertSucceeds(setDoc(doc(db, 'centers/c1/crews/ok1'), crewDoc({ vehicleId: '', memberIds: [], leaderId: '' }))); // a crew whose last person was deleted
    await assertSucceeds(setDoc(doc(db, 'centers/c1/crews/ok2'), crewDoc({ memberIds: Array.from({ length: 30 }, (_, i) => 's' + i) })));
  });
  it('lets the owner edit and delete, keeping the creation time', async () => {
    await env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), 'centers/c1/crews/t9'), { name: 'Old', vehicleId: '', memberIds: [], leaderId: '', workDays: [1], note: '', createdAt: new Date(1000), updatedAt: new Date(1000) }));
    const ref = doc(center('c1'), 'centers/c1/crews/t9');
    await assertSucceeds(updateDoc(ref, { name: 'New', updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(ref, { createdAt: serverTimestamp(), updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(center('c2'), 'centers/c1/crews/t9'), { name: 'Hacked', updatedAt: serverTimestamp() }));
    await assertSucceeds(deleteDoc(ref));
    await assertFails(deleteDoc(doc(center('c2'), 'centers/c1/crews/t1')));
  });
});

describe('crew and step timestamps on assignments', () => {
  const ref = () => doc(center('c1'), 'assignments/r1_c1');
  const crew = (v = 1, s = 1) => ({
    vehicles: Array.from({ length: v }, (_, i) => ({ id: 'v' + i, code: 'V' + i })),
    staff: Array.from({ length: s }, (_, i) => ({ id: 's' + i, name: 'S' + i, role: 'driver' })),
  });
  const accept = (extra: Record<string, unknown> = {}) => updateDoc(ref(), { status: 'accepted', seen: true, updatedAt: serverTimestamp(), acceptedAt: serverTimestamp(), ...extra });

  it('accepts with a crew and the matching server time', async () => {
    await assertSucceeds(accept({ crew: crew(2, 3) }));
  });
  it('requires the step timestamp, in the right transition, with the server time', async () => {
    await assertFails(updateDoc(ref(), { status: 'accepted', updatedAt: serverTimestamp() })); // a step without its stamp
    await assertFails(accept({ acceptedAt: new Date() })); // client clock
    await assertFails(updateDoc(ref(), { status: 'accepted', updatedAt: serverTimestamp(), acceptedAt: serverTimestamp(), arrivedAt: serverTimestamp() })); // a stamp from another step
    await assertFails(updateDoc(ref(), { updatedAt: serverTimestamp(), doneAt: serverTimestamp() })); // a stamp without its transition
  });
  it('bounds the crew size', async () => {
    await assertFails(accept({ crew: crew(11, 1) }));
    await assertFails(accept({ crew: crew(1, 41) }));
    await assertSucceeds(accept({ crew: crew(10, 40) }));
  });
  it('carries the names of the crews that went, up to ten', async () => {
    await assertSucceeds(accept({ crew: { ...crew(1, 2), teams: ['Alfa', 'Bravo'] } }));
    await assertFails(accept({ crew: { ...crew(1, 2), teams: Array.from({ length: 11 }, (_, i) => 'T' + i) } }));
    await assertFails(accept({ crew: { ...crew(1, 2), teams: 'Alfa' } }));
  });
  it('rejects a crew of the wrong shape', async () => {
    await assertFails(accept({ crew: { vehicles: [], staff: [], boss: 'me' } }));
    await assertFails(accept({ crew: { vehicles: 'v1', staff: [] } }));
    await assertFails(accept({ crew: 'everyone' }));
  });
  it('lets the crew be corrected while accepted or on the way, not after arriving or on a decline', async () => {
    await assertSucceeds(accept({ crew: crew(1, 1) }));
    await assertSucceeds(updateDoc(ref(), { crew: crew(2, 2), updatedAt: serverTimestamp() })); // correct it
    await assertSucceeds(updateDoc(ref(), { status: 'enroute', updatedAt: serverTimestamp(), enrouteAt: serverTimestamp(), crew: crew(2, 3) }));
    await assertSucceeds(updateDoc(ref(), { status: 'arrived', updatedAt: serverTimestamp(), arrivedAt: serverTimestamp() }));
    await assertFails(updateDoc(ref(), { crew: crew(1, 1), updatedAt: serverTimestamp() })); // too late
    await assertFails(updateDoc(ref(), { status: 'done', updatedAt: serverTimestamp(), doneAt: serverTimestamp(), crew: crew(1, 1) }));
    await assertSucceeds(updateDoc(ref(), { status: 'done', updatedAt: serverTimestamp(), doneAt: serverTimestamp() }));
  });
  it('does not accept a crew with a decline', async () => {
    await assertFails(updateDoc(ref(), { status: 'declined', updatedAt: serverTimestamp(), crew: crew(1, 1) }));
  });
  it("stops a center writing another center's crew", async () => {
    await assertFails(updateDoc(doc(center('c1'), 'assignments/r1_c2'), { status: 'accepted', updatedAt: serverTimestamp(), acceptedAt: serverTimestamp(), crew: crew() }));
  });
  it('lets the admin read the crew', async () => {
    await accept({ crew: crew(2, 2) });
    const snap = await assertSucceeds(getDoc(doc(admin(), 'assignments/r1_c1')));
    const data = snap.data() as { crew: { vehicles: unknown[] } };
    if (data.crew.vehicles.length !== 2) throw new Error('crew not visible to admin');
  });
});

describe('needs, areas, tasks, volunteers', () => {
  it('lets app users read needs and areas but not write them', async () => {
    await assertSucceeds(getDoc(doc(anon(), 'needs/n1')));
    await assertSucceeds(getDoc(doc(anon(), 'assemblyAreas/a1')));
    await assertFails(getDoc(doc(guest(), 'needs/n1')));
    await assertFails(getDoc(doc(center(), 'needs/n1')));
    await assertFails(setDoc(doc(anon(), 'needs/x'), { need: 'aid', urgency: 1, district: 'x', lat: 1, lng: 1 }));
  });
  it('validates what an admin writes', async () => {
    const db = admin();
    await assertSucceeds(setDoc(doc(db, 'needs/n2'), { need: 'water', urgency: 3, district: 'Fatih', lat: 41, lng: 29 }));
    await assertFails(setDoc(doc(db, 'needs/n3'), { need: 'water', urgency: 9, district: 'Fatih', lat: 41, lng: 29 }));
    await assertFails(setDoc(doc(db, 'needs/n4'), { need: 'gold', urgency: 1, district: 'Fatih', lat: 41, lng: 29 }));
    await assertSucceeds(setDoc(doc(db, 'assemblyAreas/a2'), { number: 2, name: 'Stadium', capacity: 500, occupied: 10, lat: 41, lng: 29 }));
    await assertFails(setDoc(doc(db, 'assemblyAreas/a3'), { number: 3, name: 'Bad', capacity: 0, occupied: 0, lat: 41, lng: 29 }));
    await assertFails(setDoc(doc(db, 'assemblyAreas/a4'), { number: 4, name: 'Bad', capacity: 5, occupied: 0, lat: 91, lng: 29 }));
  });
  it('keeps tasks and volunteers admin-only', async () => {
    await assertSucceeds(getDoc(doc(admin(), 'tasks/t1')));
    await assertFails(getDoc(doc(anon(), 'tasks/t1')));
    await assertFails(getDoc(doc(center(), 'tasks/t1')));
    await assertFails(setDoc(doc(anon(), 'volunteers/v1'), { role: 'aid', active: true }));
  });
});

describe('everything else is closed', () => {
  it('denies unknown collections to every role', async () => {
    await assertFails(getDoc(doc(admin(), 'secrets/s1')));
    await assertFails(setDoc(doc(admin(), 'secrets/s1'), { a: 1 }));
  });
});
