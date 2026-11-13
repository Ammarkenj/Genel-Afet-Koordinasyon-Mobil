/* Browser check of the real app against the seeded emulators (needs `npm run emulators`, `npm run seed`, `npm run dev`).
 *   node tests/ui/ui-check.mjs <outDir>
 * Signs in as an admin and as a center, visits every page in both languages and themes, saves screenshots,
 * and reports console errors, horizontal overflow and the key numbers on screen. */
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const EDGE = process.env.EDGE_PATH ?? 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:5173';
const out = process.argv[2] ?? 'ui-shots';
mkdirSync(out, { recursive: true });

const results = [];
const ok = (cond, msg) => results.push(`${cond ? 'PASS' : 'FAIL'} ${msg}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({ executablePath: EDGE, headless: true, args: ['--no-sandbox'] });
const consoleErrors = [];

async function newPage(width, height, lang = 'tr', theme = 'light') {
  // A separate browser context per role: Firebase keeps the signed-in user in IndexedDB, which tabs of one context share.
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  await page.setViewport({ width, height });
  await page.evaluateOnNewDocument((l, th) => {
    try { if (!localStorage.getItem('yh-lang')) localStorage.setItem('yh-lang', l); if (!localStorage.getItem('yh-theme')) localStorage.setItem('yh-theme', th); } catch { /* ignore */ }
  }, lang, theme);
  page.on('console', (m) => {
    const t = m.text();
    // Map tiles and web fonts need the internet; their failures are not app errors.
    if (m.type() === 'error' && !/tile\.openstreetmap|fonts\.g|ERR_NAME_NOT_RESOLVED|ERR_INTERNET_DISCONNECTED|Failed to load resource/.test(t)) consoleErrors.push(`[${width}] ${t}`);
  });
  page.on('pageerror', (e) => consoleErrors.push(`[${width}] pageerror: ${e.message}`));
  return page;
}

// Each kind of account has its own sign-in page.
const portalOf = (email) => (email.startsWith('admin@') ? '/admin/login' : '/center/login');
async function login(page, email, password, path = portalOf(email)) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle2' });
  await page.type('input[name=email]', email);
  await page.type('input[name=password]', password);
  await page.click('button[type=submit]');
}
const goTab = async (page, href, heading) => {
  // The Team item of the bottom navigation opens the crews page; the staff page is its second tab.
  if (href === '/center/staff') await page.click('.bnav a[href="/center/crews"]'), await page.waitForSelector('.tabs a[href="/center/staff"]'), await page.click('.tabs a[href="/center/staff"]');
  else if (href === '/center/crews') await page.click('.bnav a[href="/center/crews"]');
  else await page.click(`.bnav a[href="${href}"]`);
  await page.waitForFunction((h) => document.querySelector('.page-h h1')?.textContent === h, { timeout: 10000 }, heading);
  await sleep(300);
};
const shot = (page, name) => page.screenshot({ path: join(out, `${name}.png`) });
const overflow = (page) => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
const text = (page) => page.evaluate(() => document.body.innerText);

try {
  // ---------- admin ----------
  const admin = await newPage(1440, 1000);
  await admin.goto(`${BASE}/admin`, { waitUntil: 'networkidle2' });
  ok(admin.url().endsWith('/admin/login'), 'unauthenticated visit to /admin redirects to the ADMIN sign-in page');
  ok((await text(admin)).includes('Operasyon odası girişi'), 'the admin page says it is the operations-room sign-in');
  ok(await admin.$eval('form[data-portal]', (f) => f.dataset.portal === 'admin'), 'the admin page is the admin portal');
  await admin.goto(`${BASE}/center`, { waitUntil: 'networkidle2' });
  ok(admin.url().endsWith('/center/login'), 'unauthenticated visit to /center redirects to the CENTER sign-in page');
  ok((await text(admin)).includes('Merkez girişi') && (await text(admin)).includes('Hesabınızı yönetici oluşturur'), 'the center page says it is the center sign-in and mentions the first-login password change');
  ok(await admin.$eval('form[data-portal]', (f) => f.dataset.portal === 'center'), 'the center page is the center portal');
  await shot(admin, 'login-center-tr-light');
  await admin.click('.login-switch a');
  await admin.waitForFunction(() => location.pathname === '/admin/login');
  ok(true, 'each page links to the other one');
  await admin.goto(`${BASE}/login`, { waitUntil: 'networkidle2' });
  ok((await admin.$$eval('.portal-card', (c) => c.map((x) => x.getAttribute('href')))).join() === '/admin/login,/center/login', '/login offers the two sign-in pages');
  await shot(admin, 'login-choose-tr-light');
  // the wrong kind of account is refused on each page, and stays signed out
  await login(admin, 'kadikoy.112@ornek.org', 'Merkez-2026-demo!', '/admin/login');
  await admin.waitForSelector('[role=alert]');
  ok((await text(admin)).includes('merkez hesabı') && admin.url().endsWith('/admin/login'), 'a center account on the admin page is refused with a pointer to the center page');
  await admin.goto(`${BASE}/admin`, { waitUntil: 'networkidle2' });
  ok(admin.url().endsWith('/admin/login'), 'and it did not stay signed in');
  await login(admin, 'admin@ornek.org', 'Admin-2026-demo!', '/center/login');
  await admin.waitForSelector('[role=alert]');
  ok((await text(admin)).includes('yönetici hesabı') && admin.url().endsWith('/center/login'), 'an admin account on the center page is refused with a pointer to the admin page');
  await admin.goto(`${BASE}/center`, { waitUntil: 'networkidle2' });
  ok(admin.url().endsWith('/center/login'), 'and it did not stay signed in');
  await admin.goto(`${BASE}/admin`, { waitUntil: 'networkidle2' });
  await login(admin, 'admin@ornek.org', 'wrong-password');
  await admin.waitForSelector('[role=alert]');
  ok((await text(admin)).includes('hatalı'), 'wrong password shows a clear error');
  await admin.evaluate(() => { document.querySelector('input[name=password]').value = ''; });
  await admin.click('input[name=password]', { clickCount: 3 });
  await admin.type('input[name=password]', 'Admin-2026-demo!');
  await admin.click('button[type=submit]');
  await admin.waitForFunction(() => location.pathname.startsWith('/admin/overview'), { timeout: 15000 });
  await admin.waitForFunction(() => !document.body.innerText.includes('Yükleniyor'), { timeout: 15000 });
  await sleep(600);
  await shot(admin, 'admin-overview-tr-light');
  const t0 = await text(admin);
  ok(/Aktif yardım çağrısı/.test(t0) && /Canlı akış/.test(t0), 'overview renders KPI and live feed');
  ok(await admin.evaluate(() => [...document.querySelectorAll('.kpi-val')].map((e) => e.textContent).join(',') !== ''), 'KPI values are filled from Firestore');
  ok((await overflow(admin)) <= 0, 'overview: no horizontal overflow at 1440');

  await admin.goto(`${BASE}/admin/centers`, { waitUntil: 'networkidle2' });
  await admin.waitForSelector('tbody tr');
  await sleep(400);
  const centerRows = await admin.$$eval('tbody tr', (r) => r.length);
  ok(centerRows === 11, `centers page lists 11 centers (got ${centerRows})`);
  await shot(admin, 'admin-centers-tr-light');

  // add-center form: validation errors, then picking a location on the map
  await admin.click('button.btn.primary');
  await admin.waitForSelector('#center-form');
  await admin.click('button[form=center-form]');
  await sleep(300);
  const errs = await admin.$$eval('.err-text', (e) => e.map((x) => x.textContent));
  ok(errs.length >= 3, `empty form shows ${errs.length} field errors`);
  ok(await admin.evaluate(() => document.activeElement?.getAttribute('aria-invalid') === 'true'), 'focus moves to the first invalid field');
  await shot(admin, 'admin-center-form-errors');
  const map = await admin.$('.drawer .leaflet-container');
  const box = await map.boundingBox();
  await admin.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await sleep(300);
  const [lat, lng] = await admin.$$eval('.drawer input[inputmode=decimal]', (i) => i.map((x) => x.value));
  ok(Number.isFinite(parseFloat(lat)) && Number.isFinite(parseFloat(lng)), `clicking the map fills the coordinates (${lat}, ${lng})`);
  await shot(admin, 'admin-center-form-picked');
  await admin.keyboard.press('Escape');
  await sleep(200);
  ok(!(await admin.$('#center-form')), 'Escape closes the drawer');

  // reports + drawer + suggestions
  await admin.goto(`${BASE}/admin/reports`, { waitUntil: 'networkidle2' });
  await admin.waitForSelector('tbody tr');
  await sleep(300);
  const reportRows = await admin.$$eval('tbody tr', (r) => r.length);
  ok(reportRows >= 20, `reports table lists the seeded reports (${reportRows})`);
  await admin.type('#f-q', '1047');
  await sleep(200);
  ok((await admin.$$eval('tbody tr', (r) => r.length)) === 1, 'search narrows the table to one report');
  await admin.click('tbody tr');
  await admin.waitForSelector('.drawer .sug');
  const t1 = await text(admin);
  ok(/Çok yüksek öncelik/.test(t1), 'auto-detected fall shows the top-priority notice');
  ok(/Kadıköy 112 Acil Ambulans/.test(t1) || /112 Acil Ambulans/.test(t1), 'the ambulance is suggested for the fall');
  await shot(admin, 'admin-report-drawer-tr-light');
  ok(await admin.evaluate(() => document.activeElement?.closest('.drawer') !== null), 'focus is inside the drawer');
  await admin.keyboard.press('Escape');
  await sleep(200);

  // map
  await admin.goto(`${BASE}/admin/map`, { waitUntil: 'networkidle2' });
  await sleep(1200);
  const markers = await admin.$$eval('.leaflet-marker-icon', (m) => m.length);
  ok(markers > 30, `live map draws markers for every layer (${markers})`);
  await admin.click('.leaflet-marker-icon');
  await sleep(300);
  await shot(admin, 'admin-map-tr-light');

  for (const p of ['volunteers', 'areas']) {
    await admin.goto(`${BASE}/admin/${p}`, { waitUntil: 'networkidle2' });
    await sleep(500);
    await shot(admin, `admin-${p}-tr-light`);
  }

  // Arabic + dark
  await admin.goto(`${BASE}/admin/overview`, { waitUntil: 'networkidle2' });
  await admin.evaluate(() => { localStorage.setItem('yh-lang', 'ar'); localStorage.setItem('yh-theme', 'dark'); });
  await admin.reload({ waitUntil: 'networkidle2' });
  await sleep(800);
  ok(await admin.evaluate(() => document.documentElement.dir === 'rtl' && document.documentElement.lang === 'ar'), 'Arabic sets dir=rtl and lang=ar');
  ok(await admin.evaluate(() => document.documentElement.dataset.theme === 'dark'), 'dark theme is applied');
  await shot(admin, 'admin-overview-ar-dark');
  await admin.goto(`${BASE}/admin/centers`, { waitUntil: 'networkidle2' });
  await sleep(600);
  await shot(admin, 'admin-centers-ar-dark');
  await admin.goto(`${BASE}/admin/reports?r=`, { waitUntil: 'networkidle2' });
  await sleep(400);
  ok(!/\{\{/.test(await text(admin)), 'no unreplaced {{placeholders}} in Arabic');
  ok((await overflow(admin)) <= 0, 'reports (AR): no horizontal overflow');

  // role guard: an admin cannot open the center area
  await admin.goto(`${BASE}/center`, { waitUntil: 'networkidle2' });
  ok(admin.url().includes('/admin'), 'an admin visiting /center is sent back to /admin');
  await admin.close();

  // ---------- admin: what the room sees of a center, before the center changes anything ----------
  const adminBefore = await newPage(1440, 1000);
  await login(adminBefore, 'admin@ornek.org', 'Admin-2026-demo!');
  await adminBefore.waitForFunction(() => location.pathname.startsWith('/admin/overview'), { timeout: 15000 });
  await adminBefore.goto(`${BASE}/admin/centers/c1`, { waitUntil: 'networkidle2' });
  await adminBefore.waitForSelector('.g-auto .kpi');
  await sleep(800);
  ok((await adminBefore.$$eval('.g-auto .kpi', (k) => k.length)) === 6, 'admin center detail shows the six dashboard cards');
  const detailVeh = await adminBefore.$$eval('section[aria-labelledby=h-veh] tbody tr', (r) => r.length);
  const detailStaff = await adminBefore.$$eval('section[aria-labelledby=h-staff] tbody tr', (r) => r.length);
  ok(detailVeh === 3 && detailStaff === 8, `admin sees the center's 3 vehicles and 8 staff (${detailVeh}, ${detailStaff})`);
  const detailCrews = await adminBefore.$$eval('section[aria-labelledby=h-crews] tbody tr', (r) => r.map((x) => x.innerText));
  ok(detailCrews.length === 3 && detailCrews.some((r) => r.includes('Charlie') && r.includes('Bugün çalışma günü değil')), 'admin sees the 3 ready crews with their state today');
  ok((await text(adminBefore)).includes('Görevde'), 'admin sees who is on a mission (derived from the open assignment)');
  await shot(adminBefore, 'admin-center-detail-tr-light');
  ok((await overflow(adminBefore)) <= 0, 'admin center detail: no horizontal overflow');
  await adminBefore.goto(`${BASE}/admin/centers`, { waitUntil: 'networkidle2' });
  await adminBefore.waitForSelector('tbody tr');
  await sleep(500);
  const row = await adminBefore.$$eval('tbody tr', (rows) => rows.map((r) => r.innerText).find((t) => t.includes('Kadıköy 112 Acil')) ?? '');
  ok(/\d+\s*\/\s*3/.test(row), 'centers list shows vehicles free/total from the live counts');
  await shot(adminBefore, 'admin-centers-list-tr-light');
  await adminBefore.close();

  // ---------- admin: moving around by clicking (a redirect loop shows up as "Throttling navigation") ----------
  const nav = await newPage(1440, 900);
  const consoleAll = [];
  let navCount = 0;
  nav.on('console', (m) => consoleAll.push(m.text()));
  nav.on('framenavigated', () => navCount++);
  await login(nav, 'admin@ornek.org', 'Admin-2026-demo!');
  await nav.waitForFunction(() => location.pathname.startsWith('/admin/overview'), { timeout: 15000 });
  await sleep(800);
  const hrefs = await nav.$$eval('.nav a', (a) => a.map((x) => x.getAttribute('href')));
  ok(hrefs.join() === ['overview', 'map', 'reports', 'volunteers', 'centers', 'areas'].map((x) => '/admin/' + x).join(), `the sidebar links are absolute and the same on every page (${hrefs.join(' ')})`);
  for (const href of ['/admin/map', '/admin/reports', '/admin/volunteers', '/admin/centers', '/admin/areas', '/admin/overview']) {
    navCount = 0;
    await nav.click(`.nav a[href="${href}"]`);
    await sleep(500);
    ok(new URL(nav.url()).pathname === href && navCount <= 2, `clicking the sidebar goes to ${href} in one step (${navCount} navigation)`);
  }
  for (const bad of ['/admin/does-not-exist', '/admin/overview/reports']) {
    navCount = 0;
    await nav.goto(`${BASE}${bad}`, { waitUntil: 'networkidle2' });
    await sleep(500);
    ok(new URL(nav.url()).pathname === '/admin/overview' && navCount <= 6, `an unknown admin address (${bad}) goes to the overview, not into a redirect loop`);
  }
  await nav.goto(`${BASE}/admin/centers`, { waitUntil: 'networkidle2' });
  await nav.waitForSelector('tbody tr');
  await nav.evaluate(() => document.querySelector('tbody a.btn').click());
  await nav.waitForFunction(() => /^\/admin\/centers\/c\d+$/.test(location.pathname), { timeout: 8000 });
  ok(true, 'the "detail" link of a center opens that center');
  ok(!consoleAll.some((m) => /Throttling navigation/i.test(m)), 'the browser never warned about throttled navigation');
  await nav.close();

  // ---------- center console (phone width) ----------
  const center = await newPage(400, 900);
  await login(center, 'kadikoy.112@ornek.org', 'Merkez-2026-demo!');
  await center.waitForFunction(() => location.pathname === '/center', { timeout: 15000 });
  await center.waitForSelector('.g-auto .kpi', { timeout: 15000 });
  await sleep(900);
  await shot(center, 'center-dashboard-m-tr-light');
  const tc = await text(center);
  ok(/Yeni bildirim/.test(tc), 'center sees the new-assignment banner on the dashboard');
  ok((await center.$$eval('.g-auto .kpi', (k) => k.length)) === 6, 'center dashboard shows six cards');
  ok((await center.$$eval('.bnav a', (a) => a.length)) === 5, 'phone shows a 5-item bottom navigation');
  ok(await center.$eval('.bnav', (n) => getComputedStyle(n).display !== 'none'), 'the bottom navigation is visible on a phone');
  ok((await overflow(center)) <= 0, 'center dashboard: no horizontal overflow at 400');
  ok(!tc.includes('Fatih 112'), "another center's name is not visible");
  await center.goto(`${BASE}/admin`, { waitUntil: 'networkidle2' });
  ok(center.url().includes('/center'), 'a center visiting /admin is sent back to /center');

  // reports section
  await goTab(center, '/center/reports', 'Bildirimler');
  await center.waitForSelector('tbody tr');
  await sleep(400);
  const rows = await center.$$eval('tbody tr', (r) => r.length);
  ok(rows >= 10, `reports lists all of the center's assignments (${rows})`);
  await shot(center, 'center-reports-m-tr-light');
  ok((await overflow(center)) <= 0, 'center reports: no horizontal overflow at 400');
  // (the live panel pushes the filters down a phone screen, behind the sticky header: click from the page, not by coordinates)
  await center.evaluate(() => document.querySelector('.seg button:nth-child(2)').click()); // active only
  await sleep(300);
  const activeRows = await center.$$eval('tbody tr', (r) => r.length);
  ok(activeRows === 2, `the "active" filter keeps the 2 running assignments (${activeRows})`);
  const liveRows = await center.$$eval('.live-list .live-row', (r) => r.length);
  ok(liveRows === 2, `the live panel lists the 2 open assignments (${liveRows})`);
  ok((await center.$$eval('.live-map .leaflet-marker-icon', (m) => m.length)) === 3, 'the live map shows the center and the 2 open assignments');
  const order = await center.evaluate(() => document.querySelector('.live-panel').getBoundingClientRect().top < document.querySelector('.live-layout > section:not(.live-panel)').getBoundingClientRect().top);
  ok(order, 'on a phone the live panel is above the table');
  ok((await center.$$eval('.live-row.fresh', (r) => r.length)) === 1 && /Yeni|Bildirildi/.test(await center.$eval('.live-row.fresh', (r) => r.innerText)), 'the new, unread assignment is highlighted in the panel');
  ok((await overflow(center)) <= 0, 'live panel: no horizontal overflow at 400');
  await shot(center, 'center-live-m-tr-light');

  // staff section: add a person
  await goTab(center, '/center/staff', 'Personel');
  await center.waitForSelector('tbody tr');
  const staffBefore = await center.$$eval('tbody tr', (r) => r.length);
  ok(staffBefore === 8, `staff page lists the 8 seeded people (${staffBefore})`);
  ok((await text(center)).includes('Nöbette'), 'staff shows duty states in words');
  ok((await text(center)).includes('Bugün çalışma günü değil'), 'someone who is not scheduled today is shown as such');
  ok((await center.$$eval('.tabs .tab', (t) => t.length)) === 2, 'the Team section has two tabs: crews and staff');
  await shot(center, 'center-staff-m-tr-light');
  await center.click('.page-h .btn.primary');
  await center.waitForSelector('#staff-form');
  await center.click('button[form=staff-form]');
  await sleep(250);
  ok((await center.$$eval('.err-text', (e) => e.length)) === 1, 'an empty name is rejected with a message under the field');
  await center.type('#staff-form input.input', 'Test Personeli');
  const pressed = () => center.$$eval('#staff-form .layer-toggles .chip[aria-pressed=true]', (c) => c.length);
  ok((await pressed()) === 7, 'a new person works every day by default (7 day chips on)');
  await center.screenshot({ path: join(out, 'center-staff-form-m-tr-light.png') });
  await center.click('#staff-form .flags .btn:nth-child(1)'); // "Hafta içi"
  ok((await pressed()) === 5, 'the "weekdays" preset selects Monday to Friday');
  while ((await pressed()) > 0) await center.click('#staff-form .layer-toggles .chip[aria-pressed=true]');
  await center.click('button[form=staff-form]');
  await sleep(250);
  ok((await text(center)).includes('En az bir çalışma günü'), 'saving with no working day is refused with a message');
  const chips = await center.$$('#staff-form .layer-toggles .chip');
  const monLabel = await chips[0].evaluate((c) => c.textContent.trim());
  const wedLabel = await chips[2].evaluate((c) => c.textContent.trim());
  await chips[0].click();
  await chips[2].click();
  ok((await pressed()) === 2, 'two chosen days are on (Monday and Wednesday)');
  await center.click('button[form=staff-form]');
  await center.waitForFunction((n) => document.querySelectorAll('tbody tr').length === n, { timeout: 8000 }, staffBefore + 1);
  ok(true, 'the new person appears in the list live');
  const newRow = await center.$$eval('tbody tr', (rows) => rows.map((r) => r.innerText).find((t) => t.includes('Test Personeli')) ?? '');
  ok(newRow.includes(monLabel) && newRow.includes(wedLabel), `the list shows the chosen days (${monLabel}, ${wedLabel})`);
  await center.waitForFunction(() => !document.querySelector('.drawer'), { timeout: 8000 });

  // vehicles section: one is out on a mission and cannot be deleted
  await goTab(center, '/center/vehicles', 'Araçlar');
  await center.waitForSelector('tbody tr');
  const vehBefore = await center.$$eval('tbody tr', (r) => r.length);
  ok(vehBefore === 3, `vehicles page lists the 3 seeded vehicles (${vehBefore})`);
  const vt = await text(center);
  ok(vt.includes('Görevde') && vt.includes('Bakımda') && vt.includes('Hazır'), 'vehicles show ready, on a mission and in maintenance in words');
  await shot(center, 'center-vehicles-m-tr-light');
  const onMissionRow = await center.$$eval('tbody tr', (rows) => rows.findIndex((r) => r.innerText.includes('Görevde')));
  await (await center.$$('tbody tr button.icon-only'))[onMissionRow].click();
  await center.waitForSelector('.modal');
  ok(await center.$eval('.modal .btn:not([data-keep])', (b) => b.disabled), 'a vehicle that is out cannot be deleted');
  ok((await text(center)).includes('görevde'), 'the reason is written in the dialog');
  await center.click('[data-keep]');
  await center.click('.page-h .btn.primary');
  await center.waitForSelector('#veh-form');
  await center.type('#veh-form input[dir=ltr]', '34 TEST 99');
  await center.click('button[form=veh-form]');
  await center.waitForFunction((n) => document.querySelectorAll('tbody tr').length === n, { timeout: 8000 }, vehBefore + 1);
  ok(true, 'the new vehicle appears in the list live');
  await center.waitForFunction(() => !document.querySelector('.drawer'), { timeout: 8000 });

  // ready crews: the three seeded ones, then define a new one
  await goTab(center, '/center/crews', 'Hazır ekipler');
  await center.waitForSelector('tbody tr');
  await sleep(500);
  const crewRows = await center.$$eval('tbody tr', (rows) => rows.map((r) => r.innerText));
  ok(crewRows.length === 3, `crews page lists the 3 seeded crews (${crewRows.length})`);
  const crewRow = (name) => crewRows.find((r) => r.includes(name)) ?? '';
  ok(crewRow('Charlie').includes('Bugün çalışma günü değil'), 'a crew that is not scheduled today says so');
  ok(crewRow('Alfa').includes('Görevde'), 'a crew whose vehicle is out says it is on a mission');
  ok(crewRow('Bravo').includes('Hazır, bazı üyeler yok'), 'a crew with a member who is off duty is ready but says a member is missing');
  ok((await center.$$eval('.tabs .tab', (t) => t.length)) === 2, 'the crews page has the same two tabs');
  await shot(center, 'center-crews-m-tr-light');
  ok((await overflow(center)) <= 0, 'center crews: no horizontal overflow at 400');
  await center.click('.page-h .btn.primary');
  await center.waitForSelector('#team-form');
  await center.click('button[form=team-form]');
  await sleep(250);
  ok((await center.$$eval('#team-form .err-text', (e) => e.length)) === 3, 'an empty crew is refused with a message under name, vehicle and members');
  await center.type('#team-form input.input', 'Test Ekibi');
  await center.select('#team-form select.select', await center.$eval('#team-form select.select option:last-child', (o) => o.value)); // the vehicle added above (sorted last)
  const pickMember = (label) => center.evaluate((l) => {
    const rows = [...document.querySelectorAll('#team-form .pick-row')];
    const row = rows.find((r) => [...r.querySelectorAll('.badge')].some((b) => b.textContent.trim() === l));
    row?.querySelector('input')?.click();
    return !!row;
  }, label);
  ok(await pickMember('Nöbette'), 'a member who is available now is picked');
  ok(await pickMember('Bugün çalışma günü değil'), 'a member who is not scheduled today can be a member of the crew too');
  await shot(center, 'center-crew-form-m-tr-light');
  await center.click('button[form=team-form]');
  await center.waitForFunction((n) => document.querySelectorAll('tbody tr').length === n, { timeout: 8000 }, 4);
  await center.waitForFunction(() => !document.querySelector('.drawer'), { timeout: 8000 });
  const mine = await center.$$eval('tbody tr', (rows) => rows.map((r) => r.innerText).find((t) => t.includes('Test Ekibi')) ?? '');
  ok(mine.includes('34 TEST 99') && mine.includes('Hazır, bazı üyeler yok'), 'the new crew appears live, ready with a warning that one member is missing today');

  // accept the new assignment from the live list, with a ready crew
  await center.goto(`${BASE}/center/reports`, { waitUntil: 'networkidle2' });
  await center.waitForSelector('.live-row');
  await sleep(600);
  const accepts = await center.$$eval('.live-row .live-accept', (b) => b.map((x) => ({ h: x.getBoundingClientRect().height, row: x.closest('.live-row').innerText })));
  ok(accepts.length === 1 && accepts[0].row.includes('#1041'), 'only the new assignment has an accept button in the live list');
  ok(accepts[0].h >= 48, `the accept button is big enough to tap (${Math.round(accepts[0].h)}px)`);
  ok((await center.$$eval('.live-row', (r) => r.filter((x) => !x.innerText.includes('Bildirildi') && x.querySelector('.live-accept')).length)) === 0, 'a running assignment has no accept button');
  const clickAccept = () => center.evaluate(() => document.querySelector('.live-row .live-accept').click());
  await clickAccept();
  await center.waitForSelector('#crew-t');
  ok(new URL(center.url()).pathname === '/center/reports', 'the crew picker opens over the reports page, without leaving it');
  await center.click('.drawer-f .btn:not(.primary)'); // cancel
  await center.waitForFunction(() => !document.querySelector('#crew-t'), { timeout: 5000 });
  ok((await center.$$eval('.live-row .live-accept', (b) => b.length)) === 1, 'cancelling leaves the assignment waiting to be accepted');
  await clickAccept();
  await center.waitForSelector('#crew-t');
  const primary = '.btn.primary.lg';
  await sleep(300);
  await shot(center, 'center-crew-m-tr-light');
  const cards = await center.$$eval('.team-card', (c) => c.map((x) => x.innerText));
  const mineCard = cards.find((c) => c.includes('Test Ekibi')) ?? '';
  ok(cards.length === 2 && cards.some((c) => c.includes('Bravo')) && mineCard !== '', `only the crews that can go today are offered (${cards.length}: Bravo and the new one)`);
  ok(!(await text(center)).includes('Charlie') && !(await text(center)).includes('Alfa'), 'the crew that is out and the one that is off today are not listed');
  ok(/Bugün gizlenen ekipler: 2/.test(await text(center)), 'a line says how many crews are hidden today');
  ok(mineCard.includes('1 üye katılamıyor') && mineCard.includes('Bugün çalışma günü değil'), 'the crew that is short of a member shows a warning with the name and the reason');
  ok(cards.find((c) => c.includes('Bravo')).includes('Nöbette değil'), 'the other crew names its missing member and why (off duty)');
  await center.click('.drawer-f .btn.primary'); // accept with nothing selected
  await sleep(300);
  ok((await text(center)).includes('Bir ekip seçin'), 'accepting without choosing a crew is refused with a message');
  // the manual form is the fallback
  await center.evaluate(() => [...document.querySelectorAll('.drawer-b button')].find((b) => b.textContent.includes('elle'))?.click());
  await center.waitForSelector('fieldset.group');
  await sleep(300);
  await shot(center, 'center-crew-manual-m-tr-light');
  ok(await center.$$eval('.pick-row.off input', (i) => i.every((x) => x.disabled) && i.length >= 2), 'busy and in-maintenance vehicles/people are disabled in the manual picker');
  ok((await text(center)).includes('Başka bir görevde') && (await text(center)).includes('Bakımda'), 'each disabled row says why');
  const listedNames = await center.$$eval('fieldset.group:nth-of-type(2) .pick-row .t', (n) => n.length);
  ok(listedNames < 9 && /personel listede yok/.test(await text(center)), 'people who are off duty, on leave or not scheduled today are not listed, and a line says so');
  await center.click('.drawer-f .btn.primary'); // accept with nothing selected
  await sleep(300);
  ok((await text(center)).includes('En az bir araç'), 'manual: accepting without a vehicle is refused with a message');
  await center.evaluate(() => [...document.querySelectorAll('.drawer-b button')].find((b) => b.textContent.includes('Hazır ekiplere dön'))?.click());
  await center.waitForSelector('.team-card');
  await center.evaluate(() => [...document.querySelectorAll('.team-card')].find((c) => c.innerText.includes('Test Ekibi'))?.querySelector('input')?.click());
  await sleep(150);
  ok((await text(center)).includes('1 ekip seçildi'), 'the footer counts the chosen crew');
  await center.click('.drawer-f .btn.primary');
  await center.waitForFunction(() => !document.querySelector('#crew-t'), { timeout: 8000 });
  await center.waitForFunction(() => !document.querySelector('.live-row .live-accept'), { timeout: 8000 });
  ok((await center.$$eval('.live-row', (r) => r.some((x) => x.innerText.includes('#1041') && x.innerText.includes('Üstlendi')))), 'after accepting from the list the row shows "Üstlendi" and the accept button is gone');
  await center.evaluate(() => [...document.querySelectorAll('.live-row')].find((r) => r.innerText.includes('#1041')).querySelector('a.btn').click());
  await center.waitForSelector('.stepper');
  await sleep(800);
  await shot(center, 'center-detail-m-tr-light');
  ok((await overflow(center)) <= 0, 'center assignment: no horizontal overflow at 400');
  await center.waitForFunction(() => document.body.innerText.includes('Yoldayım'), { timeout: 8000 });
  ok((await center.$$eval('#h-crew ~ .grid .badge, .card .crew-chips .badge', (b) => b.length)) >= 2, 'the chosen vehicle and person are shown on the assignment');
  ok((await text(center)).includes('Test Ekibi'), 'the name of the crew that went is shown on the assignment');
  await shot(center, 'center-accepted-m-tr-light');

  const waitFor = (label) => center.waitForFunction((l) => document.body.innerText.includes(l), { timeout: 8000 }, label).then(() => true, () => false);
  const enabled = () => center.waitForFunction(() => { const b = document.querySelector('.btn.primary.lg'); return b && !b.disabled; }, { timeout: 8000 });
  await enabled();
  await center.click(primary); // enroute
  ok(await waitFor('Vardım'), 'after leaving, the next action is "Vardım"');
  await enabled();
  await center.click(primary); // arrived
  ok(await waitFor('Görevi tamamla'), 'after arriving, the next action is "Görevi tamamla"');
  ok(!(await text(center)).includes('Ekibi düzenle'), 'the crew can no longer be edited after arriving');
  await enabled();
  await center.click(primary);
  await center.waitForSelector('.modal');
  ok(await center.evaluate(() => document.activeElement?.hasAttribute('data-keep')), 'the confirmation focuses the safe answer');
  await center.click('[data-keep]');
  await sleep(300);
  ok(!(await center.$('.modal')), 'the safe answer closes the dialog without finishing');
  await center.setOfflineMode(true);
  await sleep(500);
  ok(await center.$eval(primary, (b) => b.disabled), 'offline: the action button is disabled');
  ok((await text(center)).includes('Bağlantı yok'), 'offline: the reason is written next to it');
  await center.setOfflineMode(false);
  await sleep(300);
  await enabled();
  await center.click(primary);
  await center.waitForSelector('.modal');
  await center.click('.modal .btn:not([data-keep])');
  await center.waitForFunction(() => !document.querySelector('.modal') && !document.querySelector('.btn.primary.lg'), { timeout: 10000 });
  ok(true, 'confirming finishes the job: the dialog closes and no action is left');

  // dashboard + settings afterwards
  await center.click('.bnav a[href="/center"]');
  await center.waitForSelector('.g-auto .kpi');
  await sleep(500);
  ok((await center.$eval('.g-auto', (g) => g.innerText)).includes('/'), 'the dashboard shows vehicles and staff as ready/total');
  await center.click('.bnav a[href="/center/settings"]');
  await center.waitForSelector('#h-info');
  await sleep(300);
  await shot(center, 'center-settings-m-tr-light');
  ok((await overflow(center)) <= 0, 'center settings: no horizontal overflow at 400');
  await center.close();

  // ---------- center on a desktop, Arabic dark ----------
  const centerAr = await newPage(1440, 1000, 'ar', 'dark');
  await login(centerAr, 'kadikoy.112@ornek.org', 'Merkez-2026-demo!');
  await centerAr.waitForFunction(() => location.pathname === '/center', { timeout: 15000 });
  await centerAr.waitForSelector('.g-auto .kpi');
  await sleep(900);
  ok(await centerAr.evaluate(() => document.documentElement.dir === 'rtl'), 'center console (AR) is right-to-left');
  ok(await centerAr.$eval('.cside', (n) => getComputedStyle(n).display !== 'none'), 'a desktop shows the side navigation');
  ok(await centerAr.$eval('.bnav', (n) => getComputedStyle(n).display === 'none'), 'and hides the bottom navigation');
  await shot(centerAr, 'center-dashboard-d-ar-dark');
  ok((await overflow(centerAr)) <= 0, 'center dashboard (AR, 1440): no horizontal overflow');
  for (const path of ['reports', 'crews', 'staff', 'vehicles', 'settings']) {
    await centerAr.goto(`${BASE}/center/${path}`, { waitUntil: 'networkidle2' });
    await sleep(500);
    ok(!/\{\{/.test(await text(centerAr)), `no placeholders left on /center/${path} (AR)`);
    if (path !== 'settings') await shot(centerAr, `center-${path}-d-ar-dark`);
  }
  await centerAr.close();

  // live panel beside the table on a wide screen, above it on a narrower one
  const wide = await newPage(1656, 1000);
  await login(wide, 'kadikoy.112@ornek.org', 'Merkez-2026-demo!');
  await wide.waitForFunction(() => location.pathname === '/center', { timeout: 15000 });
  await wide.goto(`${BASE}/center/reports`, { waitUntil: 'networkidle2' });
  await wide.waitForSelector('.live-panel .live-row, .live-panel .empty');
  await sleep(800);
  const rects = await wide.evaluate(() => {
    const r = (el) => { const b = el.getBoundingClientRect(); return { l: b.left, r: b.right, t: b.top, b: b.bottom }; };
    return { panel: r(document.querySelector('.live-panel')), table: r(document.querySelector('.live-layout > section:not(.live-panel)')), vw: innerWidth };
  });
  ok(rects.panel.r <= rects.table.l || rects.table.r <= rects.panel.l, 'at 1656 the live panel sits beside the table, not over it');
  ok(Math.abs(rects.panel.t - rects.table.t) < 4, 'and level with the top of the table');
  ok(rects.panel.r - rects.panel.l >= 360 && rects.table.r - rects.table.l >= 800, `both have room (panel ${Math.round(rects.panel.r - rects.panel.l)}px, table ${Math.round(rects.table.r - rects.table.l)}px)`);
  const n = await wide.$$eval('.live-list .live-row', (r) => r.length);
  const counted = Number(((await wide.$eval('.live-panel .result-count', (c) => c.innerText)).match(/\d+/) ?? [])[0]);
  ok(n >= 1 && n === counted, `the count matches the rows (${n})`);
  ok((await wide.$$eval('.live-map .leaflet-marker-icon', (m) => m.length)) === n + 1, 'one marker per open assignment plus the center');
  await shot(wide, 'center-reports-wide-tr-light');
  const openHref = await wide.$eval('.live-row a.btn', (a) => a.getAttribute('href'));
  await wide.click('.live-row a.btn');
  await wide.waitForFunction((h) => location.pathname === h, { timeout: 8000 }, openHref);
  ok(true, 'the "open" button on a row goes to that assignment');
  await wide.setViewport({ width: 1300, height: 900 });
  await wide.goto(`${BASE}/center/reports`, { waitUntil: 'networkidle2' });
  await wide.waitForSelector('.live-panel');
  await sleep(500);
  ok(await wide.evaluate(() => document.querySelector('.live-panel').getBoundingClientRect().bottom <= document.querySelector('.live-layout > section:not(.live-panel)').getBoundingClientRect().top + 1), 'at 1300 the live panel is above the table');
  await wide.close();

  const wideAr = await newPage(1656, 1000, 'ar', 'dark');
  await login(wideAr, 'kadikoy.112@ornek.org', 'Merkez-2026-demo!');
  await wideAr.waitForFunction(() => location.pathname === '/center', { timeout: 15000 });
  await wideAr.goto(`${BASE}/center/reports`, { waitUntil: 'networkidle2' });
  await wideAr.waitForSelector('.live-panel');
  await sleep(800);
  ok(!/\{\{/.test(await text(wideAr)), 'no placeholders left in the live panel (AR)');
  ok(await wideAr.evaluate(() => { const p = document.querySelector('.live-panel').getBoundingClientRect(); const t = document.querySelector('.live-layout > section:not(.live-panel)').getBoundingClientRect(); return p.right <= t.left + 1; }), 'in Arabic (RTL) the panel is at the left, the end side of the table');
  ok((await overflow(wideAr)) <= 0, 'reports (AR, 1656): no horizontal overflow');
  await shot(wideAr, 'center-reports-wide-ar-dark');
  await wideAr.close();

  // ---------- admin: sees what the center changed ----------
  const adminAfter = await newPage(1440, 1000);
  await login(adminAfter, 'admin@ornek.org', 'Admin-2026-demo!');
  await adminAfter.waitForFunction(() => location.pathname.startsWith('/admin/overview'), { timeout: 15000 });
  await adminAfter.goto(`${BASE}/admin/centers/c1`, { waitUntil: 'networkidle2' });
  await adminAfter.waitForSelector('.g-auto .kpi');
  await sleep(900);
  const afterVeh = await adminAfter.$$eval('section[aria-labelledby=h-veh] tbody tr', (r) => r.length);
  const afterStaff = await adminAfter.$$eval('section[aria-labelledby=h-staff] tbody tr', (r) => r.length);
  ok(afterVeh === 4 && afterStaff === 9, `admin sees the new vehicle and person the center added (${afterVeh}, ${afterStaff})`);
  ok((await text(adminAfter)).includes('34 TEST 99'), 'admin sees the new vehicle code');
  const afterCrews = await adminAfter.$$eval('section[aria-labelledby=h-crews] tbody tr', (r) => r.map((x) => x.innerText));
  ok(afterCrews.length === 4 && afterCrews.some((r) => r.includes('Test Ekibi')), 'admin sees the crew the center defined');
  ok((await adminAfter.$$eval('section[aria-labelledby=h-rec] tbody tr', (r) => r.map((x) => x.innerText))).some((r) => r.includes('Test Ekibi')), 'admin sees which crew went on the job');
  const adminStaffRow = await adminAfter.$$eval('section[aria-labelledby=h-staff] tbody tr', (rows) => rows.map((r) => r.innerText).find((t) => t.includes('Test Personeli')) ?? '');
  ok(adminStaffRow.length > 0 && /Pzt/.test(adminStaffRow) && /Çar/.test(adminStaffRow), 'admin sees the new person with the chosen working days');
  await shot(adminAfter, 'admin-center-detail-after-tr-light');
  await adminAfter.close();

  // a center that has never signed in goes straight to its console: there is no forced password change
  const fresh = await newPage(1000, 800);
  await login(fresh, 'yeni.merkez@ornek.org', 'Gecici-2026-demo!');
  await fresh.waitForFunction(() => location.pathname === '/center', { timeout: 15000 });
  await fresh.waitForSelector('.g-auto .kpi', { timeout: 15000 });
  ok(true, 'a first sign-in lands directly on the center dashboard');
  await fresh.goto(`${BASE}/center/password`, { waitUntil: 'networkidle2' });
  ok(!fresh.url().endsWith('/center/password'), 'there is no password screen any more');
  await fresh.close();
} catch (e) {
  results.push(`ERROR ${e.stack ?? e}`);
} finally {
  await browser.close();
}

ok(consoleErrors.length === 0, `no console errors (${consoleErrors.length})${consoleErrors.length ? '\n  ' + [...new Set(consoleErrors)].slice(0, 8).join('\n  ') : ''}`);
console.log(results.join('\n'));
process.exit(results.some((r) => r.startsWith('FAIL') || r.startsWith('ERROR')) ? 1 : 0);
