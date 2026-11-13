/* Removes the sample data written by scripts/seed.ts, and only that: documents with the seed's fixed ids
 * (reports r<number>, assignments r<number>_c<number>, centers c<number> with their vehicles/staff/crews/devices, needs n<number>,
 * assemblyAreas a<number>, tasks t<number>, volunteers v<number>) and the Auth accounts of those centers.
 * Anything else (real reports from the app, centers you created) is left alone.
 *
 *   GOOGLE_APPLICATION_CREDENTIALS=key.json npx tsx scripts/unseed.ts --allow-remote --project <id>             # dry run: counts only
 *   GOOGLE_APPLICATION_CREDENTIALS=key.json npx tsx scripts/unseed.ts --allow-remote --project <id> --confirm   # delete
 *   npx tsx scripts/unseed.ts --emulator --confirm                                                              # emulators
 */
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const ARGS = process.argv.slice(2);
const argOf = (flag: string) => {
  const i = ARGS.indexOf(flag);
  return i >= 0 ? ARGS[i + 1] : undefined;
};
if (ARGS.includes('--emulator')) {
  process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080';
  process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9099';
}
const emulated = !!process.env.FIRESTORE_EMULATOR_HOST && !!process.env.FIREBASE_AUTH_EMULATOR_HOST;
const project = argOf('--project') ?? process.env.GCLOUD_PROJECT ?? (emulated ? 'demo-yasamhatti' : undefined);
if (!emulated && (!ARGS.includes('--allow-remote') || !project)) {
  console.error('Real project: pass --allow-remote and --project <id> (add --confirm to really delete).');
  process.exit(1);
}
const confirm = ARGS.includes('--confirm');

initializeApp({ projectId: project });
const db = getFirestore();
const auth = getAuth();

const PATTERNS: [string, RegExp][] = [
  ['reports', /^r\d+$/],
  ['assignments', /^r\d+_c\d+$/],
  ['centers', /^c\d+$/],
  ['needs', /^n\d+$/],
  ['assemblyAreas', /^a\d+$/],
  ['tasks', /^t\d+$/],
  ['volunteers', /^v\d+$/],
];

console.log(`${confirm ? 'DELETING' : 'Dry run (nothing is deleted without --confirm)'} sample data in ${project}${emulated ? ' (emulators)' : ''}`);
for (const [col, re] of PATTERNS) {
  const refs = (await db.collection(col).listDocuments()).filter((d) => re.test(d.id));
  console.log(`${col}: ${refs.length} sample document(s)`);
  if (!confirm) continue;
  for (const ref of refs) {
    if (col === 'centers') {
      const uid = (await ref.get()).data()?.authUid;
      if (typeof uid === 'string' && uid) await auth.deleteUser(uid).catch(() => undefined);
    }
    await db.recursiveDelete(ref); // a center takes its vehicles, staff, crews and devices with it
  }
}
console.log(confirm ? 'Done.' : 'Run again with --confirm to delete.');
