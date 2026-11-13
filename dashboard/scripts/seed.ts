/* Seeds the Firebase EMULATORS with realistic sample data (Istanbul, same places as the design mockup).
 *
 *   npm run emulators            (in one terminal)
 *   npm run seed                 (in another)
 *
 * Sign-in after seeding:
 *   admin    admin@ornek.org            Admin-2026-demo!
 *   center   kadikoy.112@ornek.org      Merkez-2026-demo!   (ambulance, has open assignments)
 *   center   yeni.merkez@ornek.org      Gecici-2026-demo!   (a center that has never signed in)
 *
 * It refuses to run against a real project unless you pass --allow-remote. Against a real project (or with --secure-accounts) it is
 * "secure": no admin account, every center gets a RANDOM strong password (kept as is: there is no forced change at first sign-in), emails use the reserved
 * domain example.org, an existing account keeps its password, and the new passwords are appended to --passwords-file (keep that file
 * outside the repo). Real project:
 *   GOOGLE_APPLICATION_CREDENTIALS=key.json npx tsx scripts/seed.ts --allow-remote --project <id> --passwords-file <path>
 * Remove it all again with scripts/unseed.ts.
 *
 * --region elazig adds a second set of sample centers and assembly points around Elazığ (c12-c15, a7-a12) next to the Istanbul ones,
 * for testing from a phone that is not in Istanbul (the sample reports, centers and points are otherwise all in Istanbul).
 */
import { randomBytes } from 'node:crypto';
import { appendFileSync } from 'node:fs';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, Timestamp, getFirestore } from 'firebase-admin/firestore';

const ARGS = process.argv.slice(2);
const argOf = (flag: string) => {
  const i = ARGS.indexOf(flag);
  return i >= 0 ? ARGS[i + 1] : undefined;
};
if (process.argv.includes('--emulator')) {
  process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080';
  process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9099';
}
const emulated = !!process.env.FIRESTORE_EMULATOR_HOST && !!process.env.FIREBASE_AUTH_EMULATOR_HOST;
const remote = !emulated;
if (remote && !process.argv.includes('--allow-remote')) {
  console.error('Refusing to seed: FIRESTORE_EMULATOR_HOST / FIREBASE_AUTH_EMULATOR_HOST are not set.\nStart the emulators (npm run emulators) and run `npm run seed`, or pass --allow-remote if you really mean a real project.');
  process.exit(1);
}
const SECURE = remote || ARGS.includes('--secure-accounts');
const PROJECT = argOf('--project') ?? process.env.GCLOUD_PROJECT;
const PASSWORDS_FILE = argOf('--passwords-file');
if (remote && (!PROJECT || PROJECT.startsWith('demo-'))) {
  console.error('Pass --project <your-firebase-project-id> for a real project.');
  process.exit(1);
}
if (SECURE && !PASSWORDS_FILE) {
  console.error('Secure accounts need --passwords-file <path outside the repo> to receive the random passwords.');
  process.exit(1);
}
if (emulated) process.env.GCLOUD_PROJECT ??= 'demo-yasamhatti';

initializeApp({ projectId: PROJECT ?? process.env.GCLOUD_PROJECT ?? 'demo-yasamhatti' });
const db = getFirestore();
const auth = getAuth();

const MIN = 60_000;
const at = (minAgo: number) => Timestamp.fromMillis(Date.now() - minAgo * MIN);
/** District centroids (approximate), so sample pins fall on land. */
const DISTRICT: Record<string, [number, number]> = {
  Kadıköy: [40.9903, 29.0291], Üsküdar: [41.0226, 29.0153], Beşiktaş: [41.0422, 29.0067], Fatih: [41.0186, 28.9397], Bakırköy: [40.9819, 28.8772],
  Esenyurt: [41.0343, 28.6801], Maltepe: [40.9352, 29.1315], Kartal: [40.9063, 29.1862], Şişli: [41.0602, 28.9877], Zeytinburnu: [41.0053, 28.904], Avcılar: [40.9793, 28.7217],
};
/** A stable pseudo-random offset (about +-700 m) so pins of one district do not stack. */
const near = (district: string, seed: number) => {
  const [lat, lng] = DISTRICT[district] ?? [41.0082, 28.9784];
  const j = (k: number) => (((seed * 9301 + k * 49297) % 233280) / 233280 - 0.5) * 0.014;
  return { lat: +(lat + j(1)).toFixed(5), lng: +(lng + j(2)).toFixed(5) };
};
const CENTER_LOC: Record<string, [number, number]> = {
  c1: [40.9923, 29.0383], c2: [41.012, 28.949], c3: [40.986, 28.879], c4: [40.998, 29.045], c5: [41.033, 28.675], c6: [41.021, 29.041],
  c7: [40.976, 29.102], c8: [41.01, 28.945], c9: [41.042, 29.009], c10: [40.942, 29.13], c11: [40.877, 29.233],
};
const AREA_LOC: Record<number, [number, number]> = { 1: [40.9845, 29.0285], 2: [40.9877, 29.0366], 3: [41.0045, 28.952], 4: [41.0205, 29.0285], 5: [40.971, 28.787], 6: [41.0335, 28.677] };
const ll = ([lat, lng]: [number, number]) => ({ lat, lng });

// [no, kind, type, minutesAgo, state, auto, injured, trapped, people, ops, district, x, y]
type R = [number, 'help' | 'safe', string | null, number, string, boolean, boolean | null, boolean | null, number, string, string, number, number];
const REPORTS: R[] = [
  [1048, 'help', 'quake', 2, 'sent', false, true, true, 4, 'new', 'Kadıköy', 62, 58],
  [1047, 'help', 'fall', 4, 'sent', true, null, null, 1, 'new', 'Üsküdar', 55, 36],
  [1046, 'safe', null, 5, 'sent', false, null, null, 3, 'resolved', 'Beşiktaş', 40, 30],
  [1045, 'help', 'quake', 7, 'queued', false, true, null, 2, 'new', 'Esenyurt', 14, 62],
  [1044, 'help', 'crash', 9, 'sent', true, true, false, 2, 'dispatched', 'Bakırköy', 24, 74],
  [1043, 'help', 'fire', 11, 'sent', false, false, true, 5, 'dispatched', 'Fatih', 36, 46],
  [1042, 'safe', null, 12, 'sent', false, null, null, 1, 'resolved', 'Kadıköy', 66, 66],
  [1041, 'help', 'quake', 14, 'sent', false, true, true, 3, 'dispatched', 'Üsküdar', 58, 42],
  [1040, 'help', 'quake', 16, 'sending', false, null, null, 1, 'new', 'Maltepe', 78, 78],
  [1039, 'safe', null, 18, 'sent', false, null, null, 2, 'resolved', 'Şişli', 44, 24],
  [1038, 'help', 'fall', 21, 'sent', true, false, false, 1, 'resolved', 'Beşiktaş', 38, 34],
  [1037, 'help', 'quake', 23, 'queued', false, null, true, 6, 'new', 'Esenyurt', 10, 56],
  [1036, 'help', 'crash', 26, 'sent', true, true, null, 3, 'dispatched', 'Kartal', 86, 70],
  [1035, 'safe', null, 28, 'sent', false, null, null, 4, 'resolved', 'Fatih', 33, 50],
  [1034, 'help', 'quake', 31, 'sent', false, true, false, 2, 'resolved', 'Bakırköy', 27, 70],
  [1033, 'help', 'fire', 34, 'sent', false, false, false, 2, 'resolved', 'Kadıköy', 70, 62],
  [1032, 'safe', null, 37, 'sent', false, null, null, 1, 'resolved', 'Üsküdar', 52, 40],
  [1031, 'help', 'quake', 41, 'sent', false, true, true, 5, 'dispatched', 'Zeytinburnu', 30, 60],
  [1030, 'help', 'other', 44, 'sent', false, false, false, 1, 'resolved', 'Şişli', 47, 20],
  [1029, 'safe', null, 48, 'sent', false, null, null, 2, 'resolved', 'Maltepe', 74, 74],
  [1028, 'help', 'quake', 52, 'queued', false, true, null, 2, 'new', 'Avcılar', 8, 66],
  [1027, 'help', 'fall', 57, 'sent', true, null, null, 1, 'resolved', 'Fatih', 35, 44],
  [1026, 'safe', null, 63, 'sent', false, null, null, 3, 'resolved', 'Beşiktaş', 41, 28],
  [1025, 'help', 'crash', 70, 'sent', true, false, false, 2, 'resolved', 'Kartal', 84, 72],
  // older ones so the 12-hour chart has a shape
  ...Array.from({ length: 40 }, (_, i): R => {
    const no = 1000 + i;
    const age = 90 + ((i * 37) % 600);
    const kinds = ['quake', 'crash', 'fire', 'fall', 'other'];
    const safe = i % 5 === 0;
    return [no, safe ? 'safe' : 'help', safe ? null : (kinds[i % 5] ?? 'other'), age, 'sent', i % 7 === 0, null, null, 1 + (i % 4), 'resolved', ['Kadıköy', 'Fatih', 'Bakırköy', 'Üsküdar', 'Şişli'][i % 5] ?? 'Fatih', 10 + ((i * 13) % 80), 20 + ((i * 17) % 55)];
  }),
];

// [id, type, name, status, units, phone, address, x, y, email]
const CENTERS: [string, string, string, string, number, string, string, number, number, string][] = [
  ['c1', 'ems', 'Kadıköy 112 Acil Ambulans İstasyonu', 'ready', 3, '+90 216 555 01 12', 'Bağdat Cd. No: 112, Kadıköy', 64, 60, 'kadikoy.112@ornek.org'],
  ['c2', 'ems', 'Fatih 112 Acil Ambulans İstasyonu', 'busy', 2, '+90 212 555 02 12', 'Millet Cd. No: 40, Fatih', 34, 48, 'fatih.112@ornek.org'],
  ['c3', 'ems', 'Bakırköy 112 Acil Ambulans İstasyonu', 'ready', 2, '+90 212 555 03 12', 'İncirli Cd. No: 8, Bakırköy', 26, 72, 'bakirkoy.112@ornek.org'],
  ['c4', 'fire', 'Kadıköy İtfaiye Grubu', 'ready', 4, '+90 216 555 01 10', 'Fikirtepe Mh., Kadıköy', 68, 56, 'kadikoy.itfaiye@ornek.org'],
  ['c5', 'fire', 'Esenyurt İtfaiye Grubu', 'ready', 3, '+90 212 555 05 10', 'Merkez Mh., Esenyurt', 12, 58, 'esenyurt.itfaiye@ornek.org'],
  ['c6', 'fire', 'Üsküdar İtfaiye Grubu', 'busy', 3, '+90 216 555 06 10', 'Altunizade Mh., Üsküdar', 54, 38, 'uskudar.itfaiye@ornek.org'],
  ['c7', 'rescue', 'AFAD Kurtarma Ekibi, Anadolu', 'ready', 2, '+90 216 555 07 22', 'Kozyatağı Mh., Kadıköy', 72, 64, 'afad.anadolu@ornek.org'],
  ['c8', 'rescue', 'AFAD Kurtarma Ekibi, Avrupa', 'ready', 2, '+90 212 555 08 22', 'Yenikapı Mh., Fatih', 28, 54, 'afad.avrupa@ornek.org'],
  ['c9', 'sar', 'Arama Kurtarma Birimi, Beşiktaş', 'ready', 1, '+90 212 555 09 33', 'Barbaros Blv., Beşiktaş', 42, 32, 'ak.besiktas@ornek.org'],
  ['c10', 'sar', 'Arama Kurtarma Birimi, Maltepe', 'offline', 1, '+90 216 555 10 33', 'Cevizli Mh., Maltepe', 78, 80, 'ak.maltepe@ornek.org'],
];

// [reportNo, centerId, status, minutesAgo]
const ASSIGNMENTS: [number, string, string, number][] = [
  [1044, 'c3', 'arrived', 8], [1044, 'c4', 'enroute', 8],
  [1043, 'c4', 'accepted', 10],
  [1041, 'c7', 'enroute', 13], [1041, 'c1', 'notified', 2],
  [1036, 'c1', 'done', 24], [1036, 'c4', 'arrived', 25],
  [1031, 'c8', 'accepted', 40], [1031, 'c2', 'notified', 39], [1031, 'c1', 'accepted', 12],
  [1034, 'c1', 'done', 30], [1034, 'c8', 'done', 30],
];

const NEEDS = [
  ['water', 3, 'Esenyurt', 18, 58], ['aid', 3, 'Kadıköy', 64, 54], ['shelter', 2, 'Fatih', 32, 52],
  ['aid', 2, 'Üsküdar', 60, 38], ['water', 1, 'Bakırköy', 22, 78], ['shelter', 1, 'Maltepe', 80, 82],
] as const;
const AREAS = [
  [1, 'Moda Parkı', 1200, 840, 66, 60], [2, 'Fenerbahçe Stadı', 3000, 3000, 62, 70], [3, 'Yenikapı Meydanı', 2500, 1650, 31, 56],
  [4, 'Validebağ Korusu', 1500, 1320, 56, 34], [5, 'Florya Sahili', 2000, 410, 18, 76], [6, 'Esenyurt Spor Salonu', 800, 790, 12, 60],
] as const;
const TASKS = [['aid', 6, false, 'G-214'], ['water', 19, false, 'G-087'], ['shelter', 33, false, 'G-301'], ['aid', 47, true, 'G-112'], ['water', 66, true, 'G-056'], ['aid', 80, true, 'G-190']] as const;

// ----- vehicles and staff -----
/** Every ISO weekday except today: a schedule that is always "not on duty today", whatever day the seed runs. */
const TODAY_ISO = ((new Date().getDay() + 6) % 7) + 1;
const ALL_BUT_TODAY = [1, 2, 3, 4, 5, 6, 7].filter((d) => d !== TODAY_ISO);
const PLATE: Record<string, string> = { ems: 'AMB', fire: 'ITF', rescue: 'AFD', sar: 'ARK' };
const VKIND: Record<string, string> = { ems: 'ambulance', fire: 'fire_truck', rescue: 'rescue_vehicle', sar: 'rescue_vehicle' };
const ROLES: Record<string, string[]> = {
  ems: ['paramedic', 'paramedic', 'driver', 'doctor', 'leader', 'driver', 'paramedic', 'dispatcher'],
  fire: ['firefighter', 'firefighter', 'driver', 'leader', 'firefighter', 'driver', 'firefighter', 'dispatcher'],
  rescue: ['rescuer', 'rescuer', 'driver', 'leader', 'paramedic', 'rescuer', 'driver', 'rescuer'],
  sar: ['rescuer', 'rescuer', 'leader', 'driver', 'rescuer', 'paramedic', 'rescuer', 'driver'],
};
const NAMES = ['Ayşe Demir', 'Mehmet Kaya', 'Fatma Yıldız', 'Ali Şahin', 'Zeynep Arslan', 'Mustafa Çelik', 'Elif Aydın', 'Hasan Koç', 'Emine Öztürk', 'İbrahim Polat', 'Hatice Güneş', 'Yusuf Aksoy', 'Merve Taş', 'Ahmet Erdem', 'Seda Kurt', 'Burak Özdemir'];

/** Writes a document only if it differs from what is stored (timestamps ignored). A re-seed then touches almost nothing,
 *  which matters: every vehicle or staff write fires a Cloud Function, and hundreds of them exhaust the OS's temporary ports. */
async function setIfChanged(path: string, data: Record<string, unknown>, ignore = ['createdAt', 'updatedAt']) {
  const ref = db.doc(path);
  const snap = await ref.get();
  if (snap.exists) {
    const cur = snap.data() ?? {};
    const same = Object.keys(data).every((k) => ignore.includes(k) || JSON.stringify(cur[k]) === JSON.stringify(data[k])) && Object.keys(cur).every((k) => ignore.includes(k) || k in data);
    if (same) return;
  }
  await ref.set(data);
}

/** Deletes documents in a collection whose id is not in `keep` (e.g. a person added by hand in a demo). */
async function removeExtras(collectionPath: string, keep: string[]) {
  const docs = await db.collection(collectionPath).listDocuments();
  await Promise.all(docs.filter((d) => !keep.includes(d.id)).map((d) => d.delete()));
}

interface Seeded {
  vehicles: { id: string; code: string }[];
  staff: { id: string; name: string; role: string }[];
}
const FLEET = new Map<string, Seeded>();

async function seedFleet(centerId: string, type: string, vehicleCount: number, seed: number) {
  // Re-running the seed must give the same fleet and team: remove whatever a demo session added by hand.
  await removeExtras(`centers/${centerId}/vehicles`, Array.from({ length: vehicleCount }, (_, i) => `v${i + 1}`));
  await removeExtras(`centers/${centerId}/staff`, Array.from({ length: (ROLES[type] ?? ROLES.ems!).length }, (_, i) => `s${i + 1}`));
  await removeExtras(`centers/${centerId}/crews`, ['t1', 't2', 't3']);
  const vehicles: Seeded['vehicles'] = [];
  let ready = 0;
  for (let i = 0; i < vehicleCount; i++) {
    const id = `v${i + 1}`;
    const code = `34 ${PLATE[type] ?? 'ARC'} ${String(10 + ((seed * 7 + i * 13) % 80)).padStart(2, '0')}`;
    const maintenance = vehicleCount >= 3 && i === vehicleCount - 1; // one vehicle in the workshop where there are three or more
    if (!maintenance) ready++;
    await setIfChanged(`centers/${centerId}/vehicles/${id}`, { code, kind: VKIND[type] ?? 'other', seats: type === 'ems' ? 3 : 6, status: maintenance ? 'maintenance' : 'ready', createdAt: at(60 * 24 * 30), updatedAt: at(60 * 24) });
    vehicles.push({ id, code });
  }
  const roles = ROLES[type] ?? ROLES.ems!;
  const staff: Seeded['staff'] = [];
  for (let i = 0; i < roles.length; i++) {
    const id = `s${i + 1}`;
    const name = NAMES[(seed * 3 + i) % NAMES.length] ?? 'Personel';
    const status = i === roles.length - 1 ? 'leave' : i === roles.length - 2 ? 'off_duty' : 'on_duty';
    // Schedules: the first six work every day (so which crew can go does not depend on the weekday), s6 works every day but today
    // (always shows the "not today" state), and the two who are off duty / on leave have part-week patterns.
    const workDays = i === 5 ? ALL_BUT_TODAY : i === roles.length - 1 ? [1, 2, 3, 4, 5] : i === roles.length - 2 ? [1, 3, 5, 6, 7] : [1, 2, 3, 4, 5, 6, 7];
    await setIfChanged(`centers/${centerId}/staff/${id}`, { name, role: roles[i], workDays, phone: `+90 5${30 + (seed % 9)}${String(1000000 + seed * 91 + i * 17).slice(0, 7)}`, note: i === 0 ? 'Nöbet amiri' : '', status, createdAt: at(60 * 24 * 30), updatedAt: at(60 * 24) });
    staff.push({ id, name, role: roles[i] ?? 'other' });
  }
  FLEET.set(centerId, { vehicles, staff });

  // Ready crews. Alfa: always on duty. Bravo: has one member who is off duty (offered with a warning). Charlie: not on duty today (hidden).
  const lastVehicle = vehicles[Math.min(1, vehicles.length - 1)]?.id ?? '';
  const crews = [
    { id: 't1', name: 'Alfa', vehicleId: vehicles[0]?.id ?? '', memberIds: ['s1', 's2'], leaderId: 's1', workDays: [1, 2, 3, 4, 5, 6, 7], note: '' },
    ...(vehicles.length >= 2 ? [{ id: 't2', name: 'Bravo', vehicleId: lastVehicle, memberIds: ['s3', 's4', 's7'], leaderId: 's3', workDays: [1, 2, 3, 4, 5, 6, 7], note: 'Gece vardiyası' }] : []),
    { id: 't3', name: 'Charlie', vehicleId: lastVehicle, memberIds: ['s5', 's6'], leaderId: 's5', workDays: ALL_BUT_TODAY, note: '' },
  ];
  for (const { id, ...c } of crews) await setIfChanged(`centers/${centerId}/crews/${id}`, { ...c, createdAt: at(60 * 24 * 20), updatedAt: at(60 * 24) });
  await removeExtras(`centers/${centerId}/crews`, crews.map((c) => c.id));
  return { vehicles: vehicleCount, vehiclesReady: ready, staff: roles.length, crews: crews.length };
}

/** Who went out on an assignment: the first vehicles/staff of that center, offset so two active jobs never share a vehicle. */
function crewFor(centerId: string, vehicles: number, staff: number, offset: number) {
  const f = FLEET.get(centerId);
  if (!f) return { vehicles: [], staff: [], teams: [] };
  const teams = offset === 0 ? ['Alfa'] : offset === 1 && f.vehicles.length >= 2 ? ['Bravo'] : [];
  return { vehicles: f.vehicles.slice(offset, offset + vehicles), staff: f.staff.slice(offset * 2, offset * 2 + staff), teams };
}

/** Step timestamps for a status: accepted ~3 min after the assignment, arrived ~12 min, done ~40 min. */
function steps(status: string, createdMinAgo: number) {
  const t: Record<string, Timestamp> = {};
  const order = ['accepted', 'enroute', 'arrived', 'done'];
  const offsets = [3, 5, 12, 40];
  const reached = status === 'declined' ? -1 : order.indexOf(status);
  const keys = ['acceptedAt', 'enrouteAt', 'arrivedAt', 'doneAt'];
  for (let i = 0; i <= reached; i++) t[keys[i]!] = at(Math.max(0, createdMinAgo - offsets[i]!));
  return t;
}

/** example.org is reserved (no mailbox), so a password-reset mail can never reach a stranger; ornek.org might belong to someone. */
const mailOf = (email: string) => (SECURE ? email.replace(/@ornek\.org$/, '@example.org') : email);
const ISSUED: { email: string; password: string }[] = [];
const randomPassword = () => `${randomBytes(15).toString('base64url')}aA1!`;

async function user(email: string, password: string, claims: Record<string, unknown>, displayName: string) {
  const mail = mailOf(email);
  try {
    const existing = await auth.getUserByEmail(mail);
    // Secure mode never resets a password that a person may already have set.
    await auth.updateUser(existing.uid, SECURE ? { displayName, disabled: false } : { password, displayName, disabled: false });
    await auth.setCustomUserClaims(existing.uid, claims);
    return existing.uid;
  } catch (e) {
    if ((e as { code?: string }).code !== 'auth/user-not-found') throw e;
    const pw = SECURE ? randomPassword() : password;
    const created = await auth.createUser({ email: mail, password: pw, displayName });
    await auth.setCustomUserClaims(created.uid, claims);
    if (SECURE) ISSUED.push({ email: mail, password: pw });
    return created.uid;
  }
}

/** Against a real project: say what is there and stop if anything is not ours (real reports/centers use other ids). */
async function preflight() {
  if (!remote) return;
  const odd: string[] = [];
  for (const [col, re] of [['reports', /^r\d+$/], ['centers', /^c\d+$/]] as const) {
    const ids = (await db.collection(col).listDocuments()).map((d) => d.id);
    console.log(`${col}: ${ids.length} document(s) already in ${PROJECT}`);
    odd.push(...ids.filter((id) => !re.test(id)).map((id) => `${col}/${id}`));
  }
  if (odd.length && !ARGS.includes('--force-existing')) {
    console.error(`Found documents that are not seed data (${odd.slice(0, 5).join(', ')}${odd.length > 5 ? ', ...' : ''}). Nothing was written. Pass --force-existing to add the sample data next to them.`);
    process.exit(1);
  }
}

/** Sample centers and assembly points around Elazığ (approximate locations, invented names and phone numbers). */
const ELAZIG_CENTERS: [string, string, string, number, string, string, string, [number, number]][] = [
  ['c12', 'ems', 'Elazığ 112 Acil Ambulans İstasyonu', 3, '+90 424 555 12 12', 'Çarşı Mh., Merkez, Elazığ', 'elazig.112@ornek.org', [38.6712, 39.2158]],
  ['c13', 'fire', 'Elazığ İtfaiye Grubu', 3, '+90 424 555 13 10', 'Cumhuriyet Mh., Merkez, Elazığ', 'elazig.itfaiye@ornek.org', [38.6679, 39.2271]],
  ['c14', 'rescue', 'AFAD Elazığ Kurtarma Ekibi', 2, '+90 424 555 14 22', 'Sürsürü Mh., Merkez, Elazığ', 'afad.elazig@ornek.org', [38.683, 39.196]],
  ['c15', 'sar', 'Arama Kurtarma Birimi, Elazığ', 2, '+90 424 555 15 33', 'Harput Yolu, Merkez, Elazığ', 'ak.elazig@ornek.org', [38.6905, 39.239]],
];
const ELAZIG_AREAS: [number, string, number, number, [number, number]][] = [
  [7, 'Cumhuriyet Meydanı', 1500, 300, [38.677, 39.214]],
  [8, 'Fırat Üniversitesi Spor Alanı', 3000, 900, [38.679, 39.1985]],
  [9, 'Harput Parkı', 1200, 200, [38.7075, 39.2515]],
  [10, 'Sürsürü Parkı', 900, 810, [38.6655, 39.1905]],
  [11, 'Elazığ Stadyumu Çevresi', 2500, 1100, [38.662, 39.22]],
  [12, 'Hazar Yolu Açık Alanı', 1000, 100, [38.654, 39.248]],
];

async function seedElazig() {
  for (const [id, type, name, units, phone, address, email, loc] of ELAZIG_CENTERS) {
    const uid = await user(email, 'Merkez-2026-demo!', { role: 'center', centerId: id }, name);
    const stats = await seedFleet(id, type, units, +id.slice(1));
    await db.doc(`centers/${id}`).set({ name, type, status: 'ready', stats, phone, address, email: mailOf(email), active: true, authUid: uid, ...ll(loc), createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
  }
  for (const [number, name, capacity, occupied, loc] of ELAZIG_AREAS) await db.doc(`assemblyAreas/a${number}`).set({ number, name, capacity, occupied, ...ll(loc), createdAt: FieldValue.serverTimestamp() });
  console.log(`Added the Elazığ set: ${ELAZIG_CENTERS.length} centers and ${ELAZIG_AREAS.length} assembly points.`);
}

async function main() {
  await preflight();
  if (!SECURE) await user('admin@ornek.org', 'Admin-2026-demo!', { role: 'admin' }, 'Operasyon yöneticisi'); // secure mode: the admin is a real person's own account

  const reportIds = new Map<number, string>();
  for (const [no, kind, type, min, state, auto, injured, trapped, people, ops, district] of REPORTS) {
    const id = `r${no}`;
    reportIds.set(no, id);
    await db.doc(`reports/${id}`).set({ no, kind, type, auto, state, injured, trapped, people, ops, district, ...near(district, no), createdAt: at(min), updatedAt: at(min) });
  }

  for (const [id, type, name, status, units, phone, address, , , email] of CENTERS) {
    const uid = await user(email, 'Merkez-2026-demo!', { role: 'center', centerId: id }, name);
    const stats = await seedFleet(id, type, units, +id.slice(1));
    await db.doc(`centers/${id}`).set({ name, type, status, stats, phone, address, email: mailOf(email), active: true, authUid: uid, ...ll(CENTER_LOC[id] ?? [41, 29]), createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
  }
  // A center that has never signed in.
  const freshUid = await user('yeni.merkez@ornek.org', 'Gecici-2026-demo!', { role: 'center', centerId: 'c11' }, 'Pendik 112 Acil Ambulans İstasyonu');
  const stats11 = await seedFleet('c11', 'ems', 2, 11);
  await db.doc('centers/c11').set({ name: 'Pendik 112 Acil Ambulans İstasyonu', type: 'ems', status: 'ready', stats: stats11, phone: '+90 216 555 11 12', address: 'Yenişehir Mh., Pendik', email: mailOf('yeni.merkez@ornek.org'), active: true, authUid: freshUid, ...ll(CENTER_LOC.c11 ?? [41, 29]), createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });

  for (const [no, centerId, status, min] of ASSIGNMENTS) {
    const reportId = reportIds.get(no);
    const r = REPORTS.find((x) => x[0] === no);
    if (!reportId || !r) continue;
    const [, kind, type, , , auto, injured, trapped, people, , district] = r;
    const withCrew = status !== 'notified';
    const slot = ASSIGNMENTS.filter((a) => a[1] === centerId && a[0] > no && a[2] !== 'notified' && a[2] !== 'done').length; // active jobs of one center use different vehicles
    await db.doc(`assignments/${reportId}_${centerId}`).set({
      reportId, centerId, status, seen: status !== 'notified',
      snapshot: { no, kind, type, auto, injured, trapped, people, district, ...near(district, no) },
      crew: withCrew ? crewFor(centerId, 1, 2, status === 'done' ? 0 : slot) : { vehicles: [], staff: [], teams: [] },
      ...steps(status, min),
      createdAt: at(min), updatedAt: at(Math.max(0, min - 1)),
    });
  }

  const hist = [['c1', 5], ['c1', 5], ['c3', 4], ['c4', 4], ['c7', 3]] as const;
  for (let i = 0; i < 26; i++) {
    const no = 900 + i;
    const ageMin = (1 + (i % 6)) * 1440 + ((i * 53) % 600);
    const kinds = ['quake', 'crash', 'fall', 'fire', 'other'];
    const type = kinds[i % 5] ?? 'other';
    const district = ['Kadıköy', 'Fatih', 'Bakırköy', 'Üsküdar', 'Şişli'][i % 5] ?? 'Fatih';
    const rid = `r${no}`;
    await db.doc(`reports/${rid}`).set({ no, kind: 'help', type, auto: type === 'fall', state: 'sent', injured: i % 3 === 0 ? true : null, trapped: null, people: 1 + (i % 3), ops: 'resolved', district, ...near(district, no), createdAt: at(ageMin), updatedAt: at(ageMin - 60) });
    const [centerId] = hist[i % hist.length]!;
    const accept = 2 + (i % 5);
    const arrive = 9 + ((i * 3) % 12);
    await db.doc(`assignments/${rid}_${centerId}`).set({
      reportId: rid, centerId, status: 'done', seen: true,
      snapshot: { no, kind: 'help', type, auto: type === 'fall', injured: i % 3 === 0 ? true : null, trapped: null, people: 1 + (i % 3), district, ...near(district, no) },
      crew: crewFor(centerId, 1, 2, 0),
      acceptedAt: at(ageMin - accept), enrouteAt: at(ageMin - accept - 2), arrivedAt: at(ageMin - arrive), doneAt: at(ageMin - arrive - 30),
      createdAt: at(ageMin), updatedAt: at(ageMin - arrive - 30),
    });
  }

  for (const [i, [need, urgency, district]] of NEEDS.entries()) await db.doc(`needs/n${i + 1}`).set({ need, urgency, district, ...near(district, urgency * 7 + need.length), createdAt: FieldValue.serverTimestamp() });
  for (const [number, name, capacity, occupied] of AREAS) await db.doc(`assemblyAreas/a${number}`).set({ number, name, capacity, occupied, ...ll(AREA_LOC[number] ?? [41, 29]), createdAt: FieldValue.serverTimestamp() });
  for (const [i, [need, min, done, volunteerId]] of TASKS.entries()) await db.doc(`tasks/t${i + 1}`).set({ need, state: 'sent', done, volunteerId, createdAt: at(min) });
  const roles: Record<string, number> = { aid: 19, rescue: 12, logistics: 16 };
  let n = 0;
  for (const [role, count] of Object.entries(roles)) for (let i = 0; i < count; i++) await db.doc(`volunteers/v${++n}`).set({ role, active: true });

  if (argOf('--region') === 'elazig') await seedElazig();
  if (SECURE && PASSWORDS_FILE && ISSUED.length) {
    appendFileSync(PASSWORDS_FILE, `# ${new Date().toISOString()}  ${PROJECT ?? 'emulator'}: center passwords (random; keep this file private)\n${ISSUED.map((x) => `${x.email}\t${x.password}`).join('\n')}\n`, { mode: 0o600 });
    console.log(`Created ${ISSUED.length} center sign-in(s); their random passwords were written to ${PASSWORDS_FILE}.`);
  } else if (SECURE) console.log('No new center sign-ins were needed (existing accounts keep their passwords).');
  console.log(`Seeded ${REPORTS.length} reports, ${CENTERS.length + 1} centers, ${ASSIGNMENTS.length} assignments, ${NEEDS.length} needs, ${AREAS.length} areas, ${TASKS.length} tasks, ${n} volunteers.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
