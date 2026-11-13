/* One command for the whole local setup:  npm run local
 * builds the functions, starts the Firebase emulators (Auth, Firestore, Functions), waits for them, seeds sample data,
 * starts the web app and prints the links and demo accounts. Ctrl+C stops everything.
 * Nothing here touches a real Firebase project (project id "demo-yasamhatti"). */
import { spawn, spawnSync } from 'node:child_process';
import { connect } from 'node:net';
import { existsSync } from 'node:fs';

const isWin = process.platform === 'win32';
const children = [];
let stopping = false;

const log = (m) => console.log(`\x1b[36m[local]\x1b[0m ${m}`);
const fail = (m) => {
  console.error(`\x1b[31m[local] ${m}\x1b[0m`);
  stop(1);
};

function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  log('stopping...');
  for (const c of children) {
    try {
      if (isWin) spawnSync('taskkill', ['/pid', String(c.pid), '/T', '/F'], { stdio: 'ignore' });
      else process.kill(-c.pid, 'SIGTERM');
    } catch { /* already gone */ }
  }
  setTimeout(() => process.exit(code), 500);
}
process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));

function run(cmd, args, opts = {}) {
  const c = spawn(cmd, args, { shell: isWin, stdio: opts.quiet ? 'ignore' : 'inherit', detached: !isWin, ...opts });
  children.push(c);
  return c;
}
const runToEnd = (cmd, args) => new Promise((resolve) => spawn(cmd, args, { shell: isWin, stdio: 'inherit' }).on('exit', resolve));

const answers = async (port) => {
  try {
    await fetch(`http://127.0.0.1:${port}/`, { signal: AbortSignal.timeout(1500) });
    return true;
  } catch {
    return false;
  }
};
const portOpen = (port) => new Promise((resolve) => {
  const s = connect({ port, host: '127.0.0.1' });
  s.on('connect', () => { s.destroy(); resolve(true); });
  s.on('error', () => resolve(false));
});
async function waitFor(ports, label, ms = 120_000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    if ((await Promise.all(ports.map(answers))).every(Boolean)) return;
    await new Promise((r) => setTimeout(r, 700));
  }
  fail(`${label} did not start within ${ms / 1000}s`);
}

// 0. sanity checks
if (!existsSync('node_modules')) fail('Run `npm install` first.');
if (!existsSync('functions/node_modules')) fail('Run `npm --prefix functions install` first.');
const java = spawnSync('java', ['-version'], { shell: isWin, stdio: 'ignore' });
if (java.status !== 0) fail('Java is needed by the Firestore emulator (install JDK 21).');
for (const p of [8080, 9099, 5001, 5173]) {
  if (await portOpen(p)) fail(`Port ${p} is already in use. Stop whatever is using it (an earlier \`npm run local\`?).`);
}

// 1. functions build
log('building Cloud Functions...');
if ((await runToEnd('npm', ['--prefix', 'functions', 'run', 'build'])) !== 0) fail('Functions build failed.');

// 2. emulators
log('starting the Firebase emulators (Auth, Firestore, Functions)...');
run('firebase', ['emulators:start', '--only', 'auth,firestore,functions', '--project', 'demo-yasamhatti'], { quiet: true });
await waitFor([8080, 9099], 'The Auth/Firestore emulators');
await waitFor([5001], 'The Functions emulator', 60_000);
await new Promise((r) => setTimeout(r, 2500)); // let the functions finish loading

// 3. seed
log('seeding sample data...');
let seeded = false;
for (let attempt = 1; attempt <= 3 && !seeded; attempt++) {
  seeded = (await runToEnd('npx', ['tsx', 'scripts/seed.ts', '--emulator'])) === 0;
  if (!seeded && attempt < 3) {
    log(`seeding failed (attempt ${attempt}), retrying in 4s...`);
    await new Promise((r) => setTimeout(r, 4000));
  }
}
if (!seeded) fail('Seeding failed.');

// 4. app
log('starting the web app...');
run('npx', ['vite', '--port', '5173', '--strictPort', '--host', '127.0.0.1'], { quiet: true });
await waitFor([5173], 'The web app', 60_000);

console.log(`
\x1b[32m==================  READY  ==================\x1b[0m
  App            http://127.0.0.1:5173            (choose a sign-in page)
  Admin page     http://127.0.0.1:5173/admin/login
  Center page    http://127.0.0.1:5173/center/login

  Admin          admin@ornek.org                Admin-2026-demo!
  Center         kadikoy.112@ornek.org    Merkez-2026-demo!      (ambulance with open assignments)
  New center     yeni.merkez@ornek.org    Gecici-2026-demo!      (a center that has never signed in)
  (other centers: afad.anadolu@ornek.org, kadikoy.itfaiye@ornek.org ... same password as the first center)

  Tip: open the admin and a center in two different browsers (or one normal + one private window)
       to watch an assignment arrive live.
  Re-seed anytime in another terminal:  npm run seed
  Stop everything:  Ctrl+C
\x1b[32m=============================================\x1b[0m
`);
if (process.argv.includes('--open')) spawn(isWin ? 'cmd' : 'xdg-open', isWin ? ['/c', 'start', 'http://127.0.0.1:5173'] : ['http://127.0.0.1:5173'], { stdio: 'ignore', detached: true }).unref();
setInterval(() => {}, 1 << 30);
