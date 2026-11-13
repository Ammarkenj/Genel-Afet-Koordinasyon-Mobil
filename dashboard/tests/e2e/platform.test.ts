/* End-to-end: the real client code (src/data/repos.ts, src/firebase/*) against the Auth, Firestore and Functions emulators.
 * Run with `npm run test:e2e`. It follows one center from creation to deletion. */
import { describe, expect, it, beforeAll } from 'vitest';
import { initializeApp as initAdmin } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { getFirestore as getAdminDb, Timestamp } from 'firebase-admin/firestore';
import { EmailAuthProvider, reauthenticateWithCredential, signInWithEmailAndPassword, signOut, updatePassword } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, orderBy, query, where } from 'firebase/firestore';
import { auth, db } from '../../src/firebase/app';
import { collection as col } from 'firebase/firestore';
import {
  deleteStaff, deleteVehicle, saveStaff, saveTeam, saveVehicle, updateCrew,
  assignReport, createCenter, deleteCenter, markAssignmentSeen, registerDevice, setAssignmentStatus, setCenterActive, setOwnCenterStatus,
} from '../../src/data/repos';
import { toAssignment, toCenter, toReport } from '../../src/data/mappers';
import { suggestCenters } from '../../src/domain/suggestCenters';
import { busyIds, crewFromTeams, freeVehicleCount, splitTeams, staffState, vehicleState } from '../../src/domain/crew';
import { toStaff, toTeam, toVehicle } from '../../src/data/mappers';
import { ALL_DAYS, isoDay } from '../../src/domain/workdays';

const ADMIN = { email: 'admin@e2e.org', password: 'Admin-pass-12345' };
const NEW_PASSWORD = 'Brand-new-password-1';

let reportId = '';
let centerId = '';
let tempPassword = '';
const CENTER_EMAIL = 'ambulans.e2e@ornek.org';

const asAdmin = async () => {
  await signOut(auth);
  await signInWithEmailAndPassword(auth, ADMIN.email, ADMIN.password);
  await auth.currentUser?.getIdToken(true);
};
const code = (e: unknown) => (e as { code?: string }).code ?? String(e);
/** Polls until `read` returns something that satisfies `ok` (database triggers run a moment after the write). */
async function eventually<T>(read: () => Promise<T>, ok: (v: T) => boolean, ms = 15000): Promise<T> {
  const t0 = Date.now();
  let last = await read();
  while (!ok(last) && Date.now() - t0 < ms) {
    await new Promise((r) => setTimeout(r, 300));
    last = await read();
  }
  return last;
}
let vehicleId = '';
let vehicleId2 = '';
let staffId = '';
const failsWith = async (p: Promise<unknown>, expected: string) => {
  const err = await p.then(() => null, (e: unknown) => e);
  expect(err, 'expected the call to fail').not.toBeNull();
  expect(code(err)).toContain(expected);
};

beforeAll(async () => {
  initAdmin({ projectId: 'demo-yasamhatti' });
  const adminAuth = getAdminAuth();
  const user = await adminAuth.createUser({ email: ADMIN.email, password: ADMIN.password });
  await adminAuth.setCustomUserClaims(user.uid, { role: 'admin' });
  // A user with no role at all, and one report that needs an ambulance (an automatically detected fall).
  await adminAuth.createUser({ email: 'norole@e2e.org', password: 'Nobody-pass-12345' });
  const ref = await getAdminDb().collection('reports').add({
    no: 2001, kind: 'help', type: 'fall', auto: true, state: 'sent', injured: null, trapped: null, people: 1, ops: 'new', district: 'Kadıköy',
    lat: 40.99, lng: 29.03, createdAt: Timestamp.now(),
  });
  reportId = ref.id;
});

describe('createCenter (callable)', () => {
  it('rejects callers who are not signed in or have no role', async () => {
    await signOut(auth);
    const input = { name: 'X', type: 'ems', status: 'ready', phone: '', address: '', lat: 41, lng: 29, email: 'x@e2e.org' } as const;
    await failsWith(createCenter(input), 'unauthenticated');
    await signInWithEmailAndPassword(auth, 'norole@e2e.org', 'Nobody-pass-12345');
    await failsWith(createCenter(input), 'permission-denied');
  });

  it('validates the request', async () => {
    await asAdmin();
    await failsWith(createCenter({ name: '', type: 'ems', status: 'ready', phone: '', address: '', lat: 41, lng: 29, email: 'bad@e2e.org' }), 'invalid-argument');
    await failsWith(createCenter({ name: 'Bad', type: 'ems', status: 'ready', phone: '', address: '', lat: 99, lng: 29, email: 'bad@e2e.org' }), 'invalid-argument');
  });

  it('creates the account, claims and document, and refuses a duplicate email', async () => {
    await asAdmin();
    const input = { name: 'Ambulans E2E', type: 'ems', status: 'ready', phone: '+90 216 000 00 00', address: 'Test Cd.', lat: 41.0, lng: 29.03, email: CENTER_EMAIL } as const;
    const res = await createCenter(input);
    expect(res.email).toBe(CENTER_EMAIL);
    expect(res.password).toMatch(/^[A-Za-z0-9]{4}-[A-Za-z0-9]{4}-[A-Za-z0-9]{4}$/);
    centerId = res.centerId;
    tempPassword = res.password;
    await failsWith(createCenter(input), 'already-exists');
    const stored = toCenter(await getDoc(doc(db, 'centers', centerId)));
    expect(stored).toMatchObject({ name: 'Ambulans E2E', type: 'ems', status: 'ready', active: true, email: CENTER_EMAIL });
  });
});

describe('first login of a center', () => {
  it('signs in with the password the admin handed out and goes straight to work (no forced change)', async () => {
    await signOut(auth);
    await signInWithEmailAndPassword(auth, CENTER_EMAIL, tempPassword);
    const t = await auth.currentUser!.getIdTokenResult(true);
    expect(t.claims.role).toBe('center');
    expect(t.claims.centerId).toBe(centerId);
    expect(t.claims.mustChangePassword).toBeUndefined();
  });

  it('can still change its own password later', async () => {
    const user = auth.currentUser!;
    await reauthenticateWithCredential(user, EmailAuthProvider.credential(CENTER_EMAIL, tempPassword));
    await updatePassword(user, NEW_PASSWORD);
    const t = await user.getIdTokenResult(true);
    expect(t.claims.centerId).toBe(centerId);
    await signOut(auth);
    await failsWith(signInWithEmailAndPassword(auth, CENTER_EMAIL, tempPassword), 'auth/');
    await signInWithEmailAndPassword(auth, CENTER_EMAIL, NEW_PASSWORD);
    await auth.currentUser!.getIdToken(true);
  });

  it('sees its own center only, can set its availability and register a push device', async () => {
    expect(toCenter(await getDoc(doc(db, 'centers', centerId))).name).toBe('Ambulans E2E');
    await failsWith(getDocs(collection(db, 'reports')), 'permission-denied');
    await failsWith(getDoc(doc(db, 'centers', 'someone-else')), 'permission-denied');
    await setOwnCenterStatus(centerId, 'busy');
    expect(toCenter(await getDoc(doc(db, 'centers', centerId))).status).toBe('busy');
    await setOwnCenterStatus(centerId, 'ready');
    await registerDevice(centerId, 'fake-fcm-token-'.padEnd(60, 'x'), 'tr');
    await failsWith(registerDevice('another-center', 'fake-fcm-token-'.padEnd(60, 'x'), 'tr'), 'permission-denied');
  });
});

describe('vehicles, staff and the center counts', () => {
  const stats = async () => toCenter(await getDoc(doc(db, 'centers', centerId))).stats;

  it('starts with zero vehicles and staff', async () => {
    expect(await stats()).toEqual({ vehicles: 0, vehiclesReady: 0, staff: 0, crews: 0 });
  });

  it('the center adds vehicles and staff and the trigger keeps the counts on the center document', async () => {
    const v1 = (await saveVehicle(centerId, { code: '34 AMB 01', kind: 'ambulance', seats: 3, status: 'ready' })) as { id: string };
    const v2 = (await saveVehicle(centerId, { code: '34 AMB 02', kind: 'ambulance', seats: 3, status: 'maintenance' })) as { id: string };
    const s1 = (await saveStaff(centerId, { name: 'Ayşe Demir', role: 'paramedic', phone: '+90 555 000 00 01', note: '', status: 'on_duty', workDays: [1, 2, 3, 4, 5, 6, 7] })) as { id: string };
    await saveStaff(centerId, { name: 'Mehmet Kaya', role: 'driver', phone: '', note: '', status: 'leave', workDays: [1, 2, 3] });
    vehicleId = v1.id;
    vehicleId2 = v2.id;
    staffId = s1.id;
    const s = await eventually(stats, (x) => x.vehicles === 2 && x.staff === 2);
    expect(s).toEqual({ vehicles: 2, vehiclesReady: 1, staff: 2, crews: 0 });
  });

  it('the center defines ready crews and the trigger counts them', async () => {
    const notToday = ALL_DAYS.filter((d) => d !== isoDay(Date.now()));
    await saveTeam(centerId, { name: 'Alfa', vehicleId, memberIds: [staffId], leaderId: staffId, workDays: [...ALL_DAYS], note: '' });
    await saveTeam(centerId, { name: 'Bravo', vehicleId: vehicleId2, memberIds: [staffId], leaderId: '', workDays: [...ALL_DAYS], note: '' }); // its vehicle is in the workshop
    await saveTeam(centerId, { name: 'Charlie', vehicleId, memberIds: [staffId], leaderId: '', workDays: notToday, note: '' }); // not on duty today
    expect((await eventually(stats, (x) => x.crews === 3)).crews).toBe(3);
    await failsWith(saveTeam(centerId, { name: '', vehicleId, memberIds: [staffId], leaderId: '', workDays: [1], note: '' }), 'permission-denied');
    await failsWith(saveTeam(centerId, { name: 'Bad', vehicleId, memberIds: [staffId], leaderId: '', workDays: [], note: '' }), 'permission-denied');
    await failsWith(saveTeam('someone-else', { name: 'X', vehicleId, memberIds: [], leaderId: '', workDays: [1], note: '' }), 'permission-denied');
  });

  it('editing a status updates the counts', async () => {
    await saveVehicle(centerId, { code: '34 AMB 02', kind: 'ambulance', seats: 3, status: 'ready' }, vehicleId2);
    expect(await eventually(stats, (x) => x.vehiclesReady === 2)).toMatchObject({ vehicles: 2, vehiclesReady: 2 });
    await saveVehicle(centerId, { code: '34 AMB 02', kind: 'ambulance', seats: 3, status: 'maintenance' }, vehicleId2);
    expect(await eventually(stats, (x) => x.vehiclesReady === 1)).toMatchObject({ vehiclesReady: 1 });
  });

  it('rejects invalid records', async () => {
    await failsWith(saveVehicle(centerId, { code: '', kind: 'ambulance', seats: 3, status: 'ready' }), 'permission-denied');
    await failsWith(saveVehicle(centerId, { code: 'X', kind: 'ambulance', seats: 0, status: 'ready' }), 'permission-denied');
    await failsWith(saveStaff(centerId, { name: '', role: 'driver', phone: '', note: '', status: 'on_duty', workDays: [1] }), 'permission-denied');
    await failsWith(saveVehicle('someone-else', { code: 'X', kind: 'ambulance', seats: 3, status: 'ready' }), 'permission-denied');
  });

  it('the admin reads the counts and the records', async () => {
    await asAdmin();
    expect(await stats()).toEqual({ vehicles: 2, vehiclesReady: 1, staff: 2, crews: 3 });
    const vehicles = (await getDocs(col(db, 'centers', centerId, 'vehicles'))).docs.map(toVehicle);
    const staff = (await getDocs(col(db, 'centers', centerId, 'staff'))).docs.map(toStaff);
    expect(vehicles.map((v) => v.code).sort()).toEqual(['34 AMB 01', '34 AMB 02']);
    expect(staff.map((m) => m.name).sort()).toEqual(['Ayşe Demir', 'Mehmet Kaya']);
    await failsWith(saveVehicle(centerId, { code: 'ADMIN', kind: 'other', seats: 1, status: 'ready' }), 'permission-denied'); // admins read, they do not edit a center's fleet
    await signOut(auth);
    await signInWithEmailAndPassword(auth, CENTER_EMAIL, NEW_PASSWORD);
    await auth.currentUser!.getIdToken(true);
  });
});

describe('assigning a report', () => {
  it('suggests the new ambulance for an auto-detected fall and assigns it', async () => {
    await asAdmin();
    const report = toReport(await getDoc(doc(db, 'reports', reportId)));
    const centers = (await getDocs(collection(db, 'centers'))).docs.map(toCenter);
    const allAssignments = (await getDocs(col(db, 'assignments'))).docs.map(toAssignment);
    const suggestions = suggestCenters(report, centers, { freeVehicles: (c) => freeVehicleCount(c, allAssignments) });
    expect(suggestions.map((s) => s.center.id)).toEqual([centerId]);
    expect(suggestions[0]).toMatchObject({ busy: false, noFreeVehicle: false, freeVehicles: 1, readyVehicles: 1 });
    await assignReport(report, suggestions.map((s) => s.center.id));
    expect(toReport(await getDoc(doc(db, 'reports', reportId))).ops).toBe('dispatched');
    const a = toAssignment(await getDoc(doc(db, 'assignments', `${reportId}_${centerId}`)));
    expect(a).toMatchObject({ reportId, centerId, status: 'notified', seen: false });
    expect(a.snapshot).toMatchObject({ no: 2001, type: 'fall', auto: true, district: 'Kadıköy' });
    expect(a.snapshot).not.toHaveProperty('deviceId');
  });

  it('refuses a second assignment of the same report to the same center only by overwriting the same document', async () => {
    const report = toReport(await getDoc(doc(db, 'reports', reportId)));
    await assignReport(report, [centerId]);
    const all = await getDocs(query(collection(db, 'assignments'), where('reportId', '==', reportId)));
    expect(all.size).toBe(1);
  });
});

describe('the center works the assignment', () => {
  const id = () => `${reportId}_${centerId}`;
  const mine = async () => (await getDocs(query(collection(db, 'assignments'), where('centerId', '==', centerId), orderBy('createdAt', 'desc')))).docs.map(toAssignment);

  it('sees only its own assignment and opens it', async () => {
    await signOut(auth);
    await signInWithEmailAndPassword(auth, CENTER_EMAIL, NEW_PASSWORD);
    await auth.currentUser!.getIdToken(true);
    const list = await mine();
    expect(list.map((a) => a.id)).toEqual([id()]);
    await failsWith(getDocs(collection(db, 'assignments')), 'permission-denied');
    await markAssignmentSeen(id());
    expect((await mine())[0]?.seen).toBe(true);
  });

  it('cannot skip a step', async () => {
    await failsWith(setAssignmentStatus(id(), 'arrived'), 'permission-denied');
    await failsWith(setAssignmentStatus(id(), 'done'), 'permission-denied');
  });

  it('moves notified > accepted > enroute > arrived and not backwards', async () => {
    // Only Alfa is offered: the vehicle of Bravo is in the workshop and Charlie is not on duty today.
    const vehicles = (await getDocs(col(db, 'centers', centerId, 'vehicles'))).docs.map(toVehicle);
    const people = (await getDocs(col(db, 'centers', centerId, 'staff'))).docs.map(toStaff);
    const teams = (await getDocs(col(db, 'centers', centerId, 'crews'))).docs.map(toTeam);
    const split = splitTeams(teams, vehicles, people, busyIds([]), Date.now());
    expect(split.ready.map((r) => r.team.name)).toEqual(['Alfa']);
    expect(split.hidden.map((r) => [r.team.name, r.hidden]).sort()).toEqual([['Bravo', 'vehicle_maintenance'], ['Charlie', 'not_today']]);
    const crew = crewFromTeams(split.ready);
    expect(crew).toEqual({ vehicles: [{ id: vehicleId, code: '34 AMB 01' }], staff: [{ id: staffId, name: 'Ayşe Demir', role: 'paramedic' }], teams: ['Alfa'] });
    await setAssignmentStatus(id(), 'accepted', crew); // accepting carries the crew that goes out
    expect((await mine())[0]).toMatchObject({ status: 'accepted', crew });
    expect((await mine())[0]?.acceptedAtMs).not.toBeNull();
    for (const s of ['enroute', 'arrived'] as const) {
      await setAssignmentStatus(id(), s);
      expect((await mine())[0]?.status).toBe(s);
    }
    const a = (await mine())[0]!;
    expect(a.enrouteAtMs).not.toBeNull();
    expect(a.arrivedAtMs).not.toBeNull();
    expect(a.doneAtMs).toBeNull();
    await failsWith(setAssignmentStatus(id(), 'enroute'), 'permission-denied');
  });

  it('the admin sees the progress and cannot delete a center that is still working', async () => {
    await asAdmin();
    const seen = toAssignment(await getDoc(doc(db, 'assignments', id())));
    expect(seen.status).toBe('arrived');
    expect(seen.crew.teams).toEqual(['Alfa']); // the operations room sees which crew went
    await failsWith(deleteCenter(centerId), 'failed-precondition');
  });
});

describe('the crew is out while the job runs, then free again', () => {
  const id = () => `${reportId}_${centerId}`;

  it('the vehicle and the person are on a mission and no vehicle is free', async () => {
    const list = (await getDocs(query(collection(db, 'assignments'), where('centerId', '==', centerId)))).docs.map(toAssignment);
    const busy = busyIds(list);
    const vehicles = (await getDocs(col(db, 'centers', centerId, 'vehicles'))).docs.map(toVehicle);
    const staff = (await getDocs(col(db, 'centers', centerId, 'staff'))).docs.map(toStaff);
    expect(vehicles.map((v) => [v.code, vehicleState(v, busy)]).sort()).toEqual([['34 AMB 01', 'on_mission'], ['34 AMB 02', 'maintenance']]);
    expect(staff.map((m) => [m.name, staffState(m, busy, Date.now())]).sort()).toEqual([['Ayşe Demir', 'on_mission'], ['Mehmet Kaya', 'leave']]);
    const center = toCenter(await getDoc(doc(db, 'centers', centerId)));
    expect(freeVehicleCount(center, list)).toBe(0);
  });

  it('the crew that is out is no longer offered', async () => {
    const list = (await getDocs(query(collection(db, 'assignments'), where('centerId', '==', centerId)))).docs.map(toAssignment);
    const vehicles = (await getDocs(col(db, 'centers', centerId, 'vehicles'))).docs.map(toVehicle);
    const people = (await getDocs(col(db, 'centers', centerId, 'staff'))).docs.map(toStaff);
    const teams = (await getDocs(col(db, 'centers', centerId, 'crews'))).docs.map(toTeam);
    const split = splitTeams(teams, vehicles, people, busyIds(list), Date.now());
    expect(split.ready).toEqual([]);
    expect(split.hidden.find((r) => r.team.name === 'Alfa')?.hidden).toBe('vehicle_busy');
  });

  it('the crew can be corrected while on the way, but not after arriving', async () => {
    await signOut(auth);
    await signInWithEmailAndPassword(auth, CENTER_EMAIL, NEW_PASSWORD);
    await auth.currentUser!.getIdToken(true);
    await failsWith(updateCrew(id(), { vehicles: [], staff: [], teams: [] }), 'permission-denied'); // the job is at "arrived"
  });
});

describe('disabling and deleting', () => {
  it('a disabled center cannot sign in; re-enabling lets it back in', async () => {
    await asAdmin();
    await setCenterActive(centerId, false);
    expect(toCenter(await getDoc(doc(db, 'centers', centerId))).active).toBe(false);
    await signOut(auth);
    await failsWith(signInWithEmailAndPassword(auth, CENTER_EMAIL, NEW_PASSWORD), 'auth/user-disabled');
    await asAdmin();
    await setCenterActive(centerId, true);
    await signOut(auth);
    await signInWithEmailAndPassword(auth, CENTER_EMAIL, NEW_PASSWORD);
  });

  it('finishing the job lets the admin delete the center, its account and its devices', async () => {
    await auth.currentUser!.getIdToken(true);
    await setAssignmentStatus(`${reportId}_${centerId}`, 'done');
    const finished = toAssignment(await getDoc(doc(db, 'assignments', `${reportId}_${centerId}`)));
    expect(finished.doneAtMs).not.toBeNull();
    const center = toCenter(await getDoc(doc(db, 'centers', centerId)));
    expect(freeVehicleCount(center, [finished])).toBe(1); // the crew is free again
    // Alfa is offered again now that the job is done
    const vehiclesNow = (await getDocs(col(db, 'centers', centerId, 'vehicles'))).docs.map(toVehicle);
    const peopleNow = (await getDocs(col(db, 'centers', centerId, 'staff'))).docs.map(toStaff);
    const teamsNow = (await getDocs(col(db, 'centers', centerId, 'crews'))).docs.map(toTeam);
    expect(splitTeams(teamsNow, vehiclesNow, peopleNow, busyIds([finished]), Date.now()).ready.map((r) => r.team.name)).toEqual(['Alfa']);
    // deleting a person also takes them out of the crews they were in
    await deleteStaff(centerId, staffId, teamsNow);
    const after = (await getDocs(col(db, 'centers', centerId, 'crews'))).docs.map(toTeam);
    expect(after.every((x) => x.memberIds.length === 0)).toBe(true);
    expect(after.find((x) => x.name === 'Alfa')?.leaderId).toBe('');
    await deleteVehicle(centerId, vehicleId);
    expect(await eventually(async () => toCenter(await getDoc(doc(db, 'centers', centerId))).stats, (x) => x.vehicles === 1 && x.staff === 1)).toMatchObject({ vehicles: 1, staff: 1, crews: 3 });
    await asAdmin();
    await deleteCenter(centerId);
    expect((await getDoc(doc(db, 'centers', centerId))).exists()).toBe(false);
    const adminAuth = getAdminAuth();
    await expect(adminAuth.getUserByEmail(CENTER_EMAIL)).rejects.toMatchObject({ code: 'auth/user-not-found' });
    const devices = await getAdminDb().collection(`centers/${centerId}/devices`).get();
    expect(devices.size).toBe(0);
    // history is kept
    expect((await getDoc(doc(db, 'assignments', `${reportId}_${centerId}`))).exists()).toBe(true);
  });
});
