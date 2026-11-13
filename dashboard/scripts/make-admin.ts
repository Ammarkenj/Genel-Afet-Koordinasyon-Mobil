/* One-off: gives an existing Firebase Auth user the admin role.
 *
 *   1. Create the user in Firebase console > Authentication (email + password).
 *   2. Download a service-account key (Project settings > Service accounts) and keep it OUT of the repo.
 *   3. GOOGLE_APPLICATION_CREDENTIALS=path/to/key.json npx tsx scripts/make-admin.ts you@example.org --project your-project-id
 *
 * The person must sign out and in again (or wait up to an hour) for the new role to reach their token.
 */
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const args = process.argv.slice(2);
const email = args.find((a) => a.includes('@'));
const pi = args.indexOf('--project');
const project = pi >= 0 ? args[pi + 1] : process.env.GCLOUD_PROJECT;
if (!email || !project) {
  console.error('Usage: npx tsx scripts/make-admin.ts <email> --project <firebase-project-id>');
  process.exit(1);
}

initializeApp({ projectId: project });
const auth = getAuth();
const user = await auth.getUserByEmail(email);
await auth.setCustomUserClaims(user.uid, { ...(user.customClaims ?? {}), role: 'admin' });
console.log(`${email} is now an admin of ${project}.`);
