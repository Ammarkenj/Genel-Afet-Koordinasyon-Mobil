/* Verification for the YaşamHattı prototype. Run: node tools/check.js
   1. Contrast of every semantic colour pair, light and dark (WCAG).
   2. i18n: TR and AR have identical keys; every key and icon used in app.js exists.
   3. Smoke test: renders every screen and flow in both languages against a stub DOM. */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const failures = [];
const warnings = [];
const fail = (msg) => failures.push(msg);

// ---------- 1. Contrast ----------
function parseTokens(css) {
  const base = {};
  const dark = {};
  const blockRe = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = blockRe.exec(css))) {
    const selector = m[1];
    const target = /dark/.test(selector) ? dark : base;
    const declRe = /(--[\w-]+)\s*:\s*([^;]+);/g;
    let d;
    while ((d = declRe.exec(m[2]))) target[d[1]] = d[2].trim();
  }
  return { light: base, dark: Object.assign({}, base, dark) };
}

function resolve(tokens, name, depth) {
  let value = tokens[name];
  if (value === undefined) throw new Error('Unknown token ' + name);
  const ref = /^var\((--[\w-]+)\)$/.exec(value);
  if (ref) {
    if ((depth || 0) > 8) throw new Error('Token cycle at ' + name);
    return resolve(tokens, ref[1], (depth || 0) + 1);
  }
  return value;
}

function luminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  const channel = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

function ratio(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

// [foreground, background, minimum ratio, what it is]
const PAIRS = [
  ['--text', '--bg', 4.5, 'body text on page'],
  ['--text', '--surface', 4.5, 'body text on card'],
  ['--text', '--surface-2', 4.5, 'text on muted surface'],
  ['--text', '--danger-soft', 4.5, 'countdown text on alarm background'],
  ['--text-muted', '--bg', 4.5, 'secondary text on page'],
  ['--text-muted', '--surface', 4.5, 'secondary text on card'],
  ['--text-muted', '--surface-2', 4.5, 'disabled button / tag text'],
  ['--bg', '--text', 4.5, 'toast text'],
  ['--on-danger', '--danger', 7, 'CRITICAL: "I need help" button label'],
  ['--on-safe', '--safe', 7, 'CRITICAL: "I am safe" / cancel countdown label'],
  ['--on-info', '--info', 4.5, 'primary action label'],
  ['--danger-text', '--surface', 4.5, 'error text on card'],
  ['--danger-text', '--bg', 4.5, 'error text on page'],
  ['--danger-text', '--danger-soft', 4.5, 'danger chip / countdown icon'],
  ['--safe-text', '--safe-soft', 4.5, 'safe banner and chip'],
  ['--safe-text', '--surface', 4.5, 'switch "on" label'],
  ['--info-text', '--info-soft', 4.5, 'selected choice'],
  ['--info-text', '--surface', 4.5, 'link / active nav label'],
  ['--info-text', '--bg', 4.5, 'ghost button on page'],
  ['--warn-text', '--warn-soft', 4.5, 'offline banner and chip'],
  ['--border-strong', '--surface', 3, 'control boundary on card'],
  ['--border-strong', '--bg', 3, 'control boundary on page'],
  ['--danger', '--bg', 3, 'help button against page'],
  ['--safe', '--bg', 3, 'safe button against page'],
  ['--info', '--bg', 3, 'primary button against page'],
  ['--info', '--surface-2', 3, 'route and position on map'],
  ['--info', '--surface', 3, 'urgency dots on card'],
  ['--danger-accent', '--surface', 3, 'invalid field border'],
  ['--danger-accent', '--danger-soft', 3, 'countdown ring on alarm background'],
  ['--warn-accent', '--surface', 3, 'alert icon in dialog'],
  ['--focus', '--surface', 3, 'focus ring on card'],
  ['--focus', '--bg', 3, 'focus ring on page']
];

const themes = parseTokens(read('css/tokens.css'));
const contrastRows = [];
for (const theme of ['light', 'dark']) {
  for (const [fg, bg, min, what] of PAIRS) {
    const value = ratio(resolve(themes[theme], fg), resolve(themes[theme], bg));
    contrastRows.push({ theme, fg, bg, min, value, what });
    if (value < min) fail(`contrast ${theme}: ${fg} on ${bg} = ${value.toFixed(2)} < ${min} (${what})`);
  }
}
// The watch pins the dark theme on a pure black face.
for (const [fg, min, what] of [['--text', 4.5, 'watch text'], ['--text-muted', 4.5, 'watch secondary text'], ['--danger', 3, 'watch SOS button'], ['--safe', 3, 'watch safe button'], ['--surface-2', 1.2, 'watch neutral button']]) {
  const value = ratio(resolve(themes.dark, fg), '#000000');
  contrastRows.push({ theme: 'watch', fg, bg: '#000', min, value, what });
  if (value < min) fail(`contrast watch: ${fg} on black = ${value.toFixed(2)} < ${min} (${what})`);
}

// ---------- 2. i18n and icon coverage ----------
const sandboxWindow = {};
vm.runInNewContext(read('js/i18n.js') + '\n' + read('js/icons.js'), { window: sandboxWindow });
const I18N = sandboxWindow.I18N;
const ICONS = sandboxWindow.ICONS;
const appSrc = read('js/app.js');

const trKeys = Object.keys(I18N.tr);
const arKeys = Object.keys(I18N.ar);
trKeys.filter((k) => !(k in I18N.ar)).forEach((k) => fail('i18n: missing in ar: ' + k));
arKeys.filter((k) => !(k in I18N.tr)).forEach((k) => fail('i18n: missing in tr: ' + k));
for (const lang of ['tr', 'ar']) {
  for (const [k, v] of Object.entries(I18N[lang])) {
    if (typeof v !== 'string' || !v.trim()) fail(`i18n: empty value ${lang}.${k}`);
  }
}
for (const k of trKeys) {
  const placeholders = (s) => (s.match(/\{\w+\}/g) || []).sort().join(',');
  if (k in I18N.ar && placeholders(I18N.tr[k]) !== placeholders(I18N.ar[k])) fail('i18n: placeholder mismatch in ' + k);
}

const usedKeys = new Set();
const keyRe = /'([a-z][A-Za-z0-9]*\.[A-Za-z0-9]+)'/g;
let km;
while ((km = keyRe.exec(appSrc))) usedKeys.add(km[1]);
usedKeys.forEach((k) => { if (!(k in I18N.tr)) fail('i18n: key used in app.js but not defined: ' + k); });
trKeys.filter((k) => !usedKeys.has(k)).forEach((k) => warnings.push('i18n: defined but unused: ' + k));

const usedIcons = new Set();
const iconRe = /icon(?:\(|:\s*)'([A-Za-z0-9]+)'/g;
let im;
while ((im = iconRe.exec(appSrc))) usedIcons.add(im[1]);
usedIcons.forEach((name) => { if (!(name in ICONS)) fail('icon used in app.js but not defined: ' + name); });
// Some icon names are passed positionally (tile(), tool()), so "unused" means the quoted name appears nowhere.
Object.keys(ICONS).filter((n) => !appSrc.includes("'" + n + "'")).forEach((n) => warnings.push('icon defined but unused: ' + n));

// ---------- 3. Smoke test against a stub DOM ----------
function makeEl() {
  return {
    innerHTML: '', textContent: '', style: {}, scrollTop: 0, attrs: {},
    getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; },
    setAttribute(k, v) { this.attrs[k] = String(v); },
    focus() {}, closest() { return null; }, querySelector() { return null; }
  };
}
const els = {};
const intervals = [];
const timeouts = [];
const documentStub = {
  documentElement: makeEl(), activeElement: null, title: '',
  getElementById(id) { return els[id] || (els[id] = makeEl()); },
  querySelector() { return null; },
  addEventListener() {}
};
const windowStub = { I18N, ICONS, matchMedia: () => ({ matches: false }) };
vm.runInNewContext(appSrc, {
  window: windowStub, document: documentStub, Date, Math, Number, String, Object, JSON,
  setInterval: (fn) => { intervals.push(fn); return intervals.length; },
  clearInterval: () => {},
  setTimeout: (fn) => { timeouts.push(fn); return timeouts.length; },
  clearTimeout: () => {}
});
const app = windowStub.__yasamhatti;
const cssSrc = read('css/app.css');
const seenClasses = new Set();
let renders = 0;

function inspect(label) {
  renders += 1;
  const html = ['panel', 'phone-view', 'watch-view'].map((id) => els[id].innerHTML).join('\n');
  if (/undefined|NaN|\[object Object\]/.test(html)) fail(`smoke: bad value rendered at ${label}`);
  const actRe = /data-act="([A-Za-z0-9]+)"/g;
  let a;
  while ((a = actRe.exec(html))) if (typeof app.actions[a[1]] !== 'function') fail(`smoke: no action "${a[1]}" at ${label}`);
  const subRe = /data-(?:submit|change)="([A-Za-z0-9]+)"/g;
  while ((a = subRe.exec(html))) if (typeof app.actions[a[1]] !== 'function') fail(`smoke: no handler "${a[1]}" at ${label}`);
  const classRe = /class="([^"]+)"/g;
  while ((a = classRe.exec(html))) a[1].split(/\s+/).filter(Boolean).forEach((c) => seenClasses.add(c));
  const svgOpen = (html.match(/<svg/g) || []).length;
  const svgClose = (html.match(/<\/svg>/g) || []).length;
  if (svgOpen !== svgClose) fail(`smoke: unbalanced svg at ${label}`);
  const btnOpen = (html.match(/<button/g) || []).length;
  const btnClose = (html.match(/<\/button>/g) || []).length;
  if (btnOpen !== btnClose) fail(`smoke: unbalanced button at ${label}`);
}

function run(label, name, arg) {
  try {
    app.actions[name](arg === undefined ? null : arg, null);
    inspect(label + ' > ' + name + (arg === undefined ? '' : '(' + arg + ')'));
  } catch (err) {
    fail(`smoke: ${label} > ${name}(${arg}) threw: ${err.message}`);
  }
}

function tickCountdown(times) {
  const fn = intervals[intervals.length - 1];
  for (let i = 0; i < times && app.state.countdown; i++) fn();
}

for (const lang of ['tr', 'ar']) {
  for (const theme of ['light', 'dark']) {
    for (const net of ['online', 'weak', 'offline']) {
      const label = `${lang}/${theme}/${net}`;
      run(label, 'setLang', lang);
      run(label, 'setTheme', theme);
      run(label, 'setNet', net);
      app.screens.forEach((s) => { run(label, 'jump', s.id); });
      run(label, 'cdCancel');

      // Onboarding and login
      run(label, 'jump', 'onboarding'); run(label, 'onbNext'); run(label, 'togglePerm', 'location');
      app.state.kvkk = false; run(label, 'onbDone'); run(label, 'toggleKvkk'); run(label, 'onbDone');
      app.state.form.phone = '123'; run(label, 'sendCode');
      app.state.form.phone = '532 111 22 33'; run(label, 'sendCode');
      app.state.form.code = '12'; run(label, 'submitCode');
      app.state.form.code = '123456'; run(label, 'submitCode');

      // Help report with details, then undo
      run(label, 'needHelp'); run(label, 'pickType', 'fire');
      run(label, 'detail', 'injured_yes'); run(label, 'detail', 'trapped_no'); run(label, 'people', 1); run(label, 'people', -1);
      run(label, 'undoReport'); run(label, 'closeDialog'); run(label, 'undoReport'); run(label, 'confirmUndo');

      // Safe report, watch flows
      run(label, 'imSafe'); run(label, 'watchHome'); run(label, 'watchHelp'); run(label, 'go', 'home');
      run(label, 'openReport', app.state.reports[app.state.reports.length - 1].id);

      // AFAD dialog
      run(label, 'go', 'home'); run(label, 'showAfad'); run(label, 'helpQuake');
      run(label, 'go', 'home'); run(label, 'showAfad'); run(label, 'go', 'map');

      // Countdown: cancel, send now, run out
      run(label, 'simulate', 'crash'); tickCountdown(5); inspect(label + ' > countdown ticking'); run(label, 'cdCancel');
      run(label, 'simulate', 'quake'); run(label, 'setSpeed', 10); run(label, 'cdNow'); run(label, 'setSpeed', 1);
      run(label, 'simulate', 'fall'); tickCountdown(5); inspect(label + ' > fall countdown ticking'); run(label, 'cdCancel');
      run(label, 'simulate', 'fall'); tickCountdown(60);
      if (app.state.screen !== 'status' || app.state.reports[app.state.reports.length - 1].type !== 'fall') fail(`smoke: expired fall countdown did not send a fall report at ${label}`);
      run(label, 'needHelp'); run(label, 'pickType', 'fall');
      run(label, 'simulate', 'quake'); tickCountdown(60); inspect(label + ' > countdown expired');
      if (app.state.countdown) fail(`smoke: countdown did not expire at ${label}`);
      if (app.state.screen !== 'status') fail(`smoke: expired countdown did not open status at ${label}`);
      const last = app.state.reports[app.state.reports.length - 1];
      if (!last || !last.auto || last.kind !== 'help') fail(`smoke: expired countdown did not create an auto help report at ${label}`);
      app.state.settings.autoDetect = false; run(label, 'simulate', 'quake');
      if (app.state.countdown) fail(`smoke: countdown started with auto-detect off at ${label}`);
      run(label, 'toggleSetting', 'autoDetect');

      // Volunteer: join, availability, need, accept (queued offline), complete
      app.state.vol.task = null; app.state.vol.joined = false;
      run(label, 'go', 'home'); run(label, 'volStart'); run(label, 'volRole', 'logistics'); run(label, 'volCert'); run(label, 'volJoin');
      if (!app.state.vol.joined || app.state.screen !== 'volHub') fail(`smoke: volunteer join did not open the hub at ${label}`);
      run(label, 'volAvail'); run(label, 'volAvail'); run(label, 'volNeed', 'shelter'); run(label, 'volAccept');
      const vtask = app.state.vol.task;
      const vexpect = net === 'offline' ? 'queued' : (net === 'weak' ? 'sending' : 'sent');
      if (!vtask || vtask.need !== 'shelter' || vtask.state !== vexpect) fail(`smoke: volunteer task state "${vtask && vtask.state}" != "${vexpect}" at ${label}`);
      timeouts.splice(0).forEach((fn) => fn());
      inspect(label + ' > volunteer task settled');
      run(label, 'go', 'volHub'); run(label, 'volNeed', 'aid'); run(label, 'volAccept');
      if (app.state.vol.task !== vtask) fail(`smoke: a second volunteer task replaced the active one at ${label}`);
      run(label, 'back'); run(label, 'volNeed', 'shelter'); run(label, 'volAccept'); run(label, 'volDone');
      if (vtask.done || app.state.dialog !== 'doneTask') fail(`smoke: completing a task must ask first at ${label}`);
      run(label, 'closeDialog');
      if (vtask.done) fail(`smoke: declining the confirmation still completed the task at ${label}`);
      run(label, 'volDone'); run(label, 'volDoneConfirm');
      if (!vtask.done || app.state.dialog) fail(`smoke: volunteer task not marked done after confirming at ${label}`);
      run(label, 'back'); run(label, 'back');
      run(label, 'go', 'profile'); run(label, 'volStart'); run(label, 'back');
      if (app.state.screen !== 'profile') fail(`smoke: volunteer back did not return to Profile at ${label}`);

      // Map, tools, donate, profile
      run(label, 'go', 'map'); run(label, 'pickArea', 2); run(label, 'toggleRoute'); run(label, 'toggleRoute');
      run(label, 'go', 'tools'); run(label, 'toggleSiren'); run(label, 'toggleFlash'); run(label, 'call112'); run(label, 'toggleSiren'); run(label, 'toggleFlash');
      run(label, 'go', 'donate'); run(label, 'fund', 'rescue'); run(label, 'amount', 500); run(label, 'method', 'transfer');
      app.state.form.custom = '5'; run(label, 'donateConfirm');
      if (app.state.donate.receipt) fail(`smoke: donation below minimum accepted at ${label}`);
      app.state.form.custom = '75'; run(label, 'donateConfirm');
      if (!app.state.donate.processing || app.state.donate.receipt) fail(`smoke: donation skipped the processing state at ${label}`);
      timeouts.splice(0).forEach((fn) => fn());
      inspect(label + ' > donation processed');
      if (!app.state.donate.receipt || app.state.donate.paid !== 75) fail(`smoke: custom donation not applied at ${label}`);
      run(label, 'donateAgain');
      run(label, 'go', 'profile'); run(label, 'toggleSetting', 'sms'); run(label, 'proto'); run(label, 'logout'); run(label, 'guest');
      timeouts.splice(0).forEach((fn) => fn());
      inspect(label + ' > timers flushed');
    }
  }
}

// Offline queue: reports made offline stay queued, then flush when the network returns.
run('queue', 'setNet', 'offline'); run('queue', 'imSafe');
const queued = app.state.reports[app.state.reports.length - 1];
if (queued.state !== 'queued') fail('queue: report created offline is not queued');
run('queue', 'setNet', 'online');
if (queued.state !== 'sent') fail('queue: queued report not sent when network returned');
// Same for an accepted volunteer task.
app.state.vol.task = null;
run('queue', 'setNet', 'offline'); run('queue', 'volNeed', 'water'); run('queue', 'volAccept');
if (app.state.vol.task.state !== 'queued') fail('queue: volunteer task accepted offline is not queued');
run('queue', 'setNet', 'online');
if (app.state.vol.task.state !== 'sent') fail('queue: queued volunteer task not sent when network returned');

const definedClasses = new Set((cssSrc.match(/\.[A-Za-z][\w-]*/g) || []).map((c) => c.slice(1)));
[...seenClasses].filter((c) => !definedClasses.has(c)).forEach((c) => warnings.push('class used in markup but not styled: ' + c));

// ---------- Report ----------
const worst = (theme) => contrastRows.filter((r) => r.theme === theme).sort((a, b) => a.value / a.min - b.value / b.min)[0];
console.log('Contrast pairs checked: ' + contrastRows.length);
for (const theme of ['light', 'dark', 'watch']) {
  const w = worst(theme);
  console.log(`  tightest ${theme}: ${w.fg} on ${w.bg} = ${w.value.toFixed(2)} (min ${w.min}) — ${w.what}`);
}
for (const r of contrastRows.filter((x) => x.min === 7)) console.log(`  critical ${r.theme}: ${r.fg} on ${r.bg} = ${r.value.toFixed(2)}`);
console.log(`i18n keys: tr ${trKeys.length}, ar ${arKeys.length}; used in app.js: ${usedKeys.size}`);
console.log(`icons: defined ${Object.keys(ICONS).length}, used ${usedIcons.size}`);
console.log('Smoke renders: ' + renders);
if (warnings.length) { console.log('\nWarnings (' + warnings.length + '):'); warnings.forEach((w) => console.log('  - ' + w)); }
if (failures.length) {
  console.log('\nFAILURES (' + failures.length + '):');
  [...new Set(failures)].forEach((f) => console.log('  x ' + f));
  process.exit(1);
}
console.log('\nAll checks passed.');
