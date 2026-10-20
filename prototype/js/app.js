/* YaşamHattı UI prototype: state, navigation, 60 s safety countdown, offline queue.
   Classic script (no modules) so index.html works when opened from file://. */
(function () {
  'use strict';

  var I18N = window.I18N;
  var ICONS = window.ICONS;

  // ---------- Static data (all sample data) ----------
  var NAV = [
    { id: 'home', icon: 'home', label: 'nav.home' },
    { id: 'map', icon: 'map', label: 'nav.map' },
    { id: 'tools', icon: 'grid', label: 'nav.tools' },
    { id: 'donate', icon: 'heart', label: 'nav.donate' },
    { id: 'profile', icon: 'user', label: 'nav.profile' }
  ];
  var NO_NAV = { onboarding: true, login: true, countdown: true };
  var SCREEN_LIST = [
    { id: 'onboarding', label: 'screen.onboarding' },
    { id: 'login', label: 'screen.login' },
    { id: 'home', label: 'screen.home' },
    { id: 'select', label: 'screen.select' },
    { id: 'status', label: 'screen.status' },
    { id: 'countdown', label: 'screen.countdown' },
    { id: 'map', label: 'screen.map' },
    { id: 'tools', label: 'screen.tools' },
    { id: 'donate', label: 'screen.donate' },
    { id: 'profile', label: 'screen.profile' },
    { id: 'volJoin', label: 'screen.volJoin' },
    { id: 'volHub', label: 'screen.volHub' },
    { id: 'volNeed', label: 'screen.volNeed' },
    { id: 'volTask', label: 'screen.volTask' }
  ];
  var NET = {
    online: { icon: 'wifi', tone: 'ok', label: 'net.online', desc: 'net.onlineDesc' },
    weak: { icon: 'signalLow', tone: 'warn', label: 'net.weak', desc: 'net.weakDesc' },
    offline: { icon: 'wifiOff', tone: 'warn', label: 'net.offline', desc: 'net.offlineDesc' }
  };
  var NET_ORDER = ['online', 'weak', 'offline'];
  var TYPES = {
    quake: { icon: 'quake', label: 'type.quake' },
    crash: { icon: 'car', label: 'type.crash' },
    fall: { icon: 'fall', label: 'type.fall' },
    fire: { icon: 'flame', label: 'type.fire' },
    other: { icon: 'alert', label: 'type.other' }
  };
  var TYPE_ORDER = ['quake', 'crash', 'fall', 'fire'];
  var KINDS = {
    help: { icon: 'lifebuoy', label: 'kind.help', tone: 'danger' },
    safe: { icon: 'shieldCheck', label: 'kind.safe', tone: 'ok' }
  };
  var RSTATE = {
    sent: { icon: 'checkCircle', label: 'rstate.sent', tone: 'ok', title: 'status.sentTitle', desc: 'status.sentDesc', watch: 'watch.sent' },
    queued: { icon: 'clock', label: 'rstate.queued', tone: 'warn', title: 'status.queuedTitle', desc: 'status.queuedDesc', watch: 'watch.queued' },
    sending: { icon: 'sync', label: 'rstate.sending', tone: 'info', title: 'status.sendingTitle', desc: 'status.sendingDesc', watch: 'watch.sending' }
  };
  var CAUSES = { quake: 'cd.quake', crash: 'cd.crash', fall: 'cd.fall' };
  // Volunteer flow (sample data). Fields mirror Volunteers / Needs / VolunteerAssignments in the ER diagram.
  var VOL_SCREENS = { volJoin: true, volHub: true, volNeed: true, volTask: true };
  var URGENCY = { 1: 'vol.urg1', 2: 'vol.urg2', 3: 'vol.urg3' };
  // Result header copy per task state (a finished task shows 'done').
  var TASK_COPY = {
    sent: { title: 'vol.taskSent', desc: 'vol.taskSentDesc' },
    queued: { title: 'vol.taskQueued', desc: 'vol.taskQueuedDesc' },
    sending: { title: 'vol.taskSending', desc: 'vol.taskSendingDesc' },
    done: { title: 'vol.taskDone', desc: 'vol.taskDoneDesc' }
  };
  var ROLES = [
    { id: 'aid', icon: 'firstAid', name: 'vol.roleAid', desc: 'vol.roleAidDesc' },
    { id: 'rescue', icon: 'search', name: 'vol.roleRescue', desc: 'vol.roleRescueDesc' },
    { id: 'logistics', icon: 'box', name: 'vol.roleLogistics', desc: 'vol.roleLogisticsDesc' }
  ];
  var NEEDS = [
    { id: 'aid', icon: 'firstAid', name: 'need.aid', desc: 'need.aidDesc', dist: 'need.aidDist', level: 3 },
    { id: 'water', icon: 'drop', name: 'need.water', desc: 'need.waterDesc', dist: 'need.waterDist', level: 3 },
    { id: 'shelter', icon: 'tent', name: 'need.shelter', desc: 'need.shelterDesc', dist: 'need.shelterDist', level: 2 }
  ];
  var PERMS = [
    { id: 'location', icon: 'pin', name: 'perm.location', desc: 'perm.locationDesc' },
    { id: 'notif', icon: 'bell', name: 'perm.notif', desc: 'perm.notifDesc' },
    { id: 'sensor', icon: 'sensor', name: 'perm.sensor', desc: 'perm.sensorDesc' }
  ];
  var AREAS = [
    { n: 1, name: 'area.1', m: 450, min: 6, x: 250, y: 70, route: 'M120 170V120H250V70' },
    { n: 2, name: 'area.2', m: 900, min: 12, x: 70, y: 60, route: 'M120 170V120H70V60' },
    { n: 3, name: 'area.3', m: 1400, min: 18, x: 270, y: 210, route: 'M120 170V210H270' }
  ];
  var FUNDS = [
    { id: 'food', icon: 'drop', name: 'fund.food', desc: 'fund.foodDesc' },
    { id: 'shelter', icon: 'tent', name: 'fund.shelter', desc: 'fund.shelterDesc' },
    { id: 'rescue', icon: 'lifebuoy', name: 'fund.rescue', desc: 'fund.rescueDesc' }
  ];
  var METHODS = [
    { id: 'card', icon: 'card', name: 'donate.card' },
    { id: 'transfer', icon: 'bank', name: 'donate.transfer' }
  ];
  var AMOUNTS = [100, 250, 500, 1000];
  var MIN_DONATION = 10;
  var COUNTDOWN_SECONDS = 60;
  var RING = 2 * Math.PI * 88;
  var SAMPLE_COORDS = '38.6748, 39.2225';
  var SAMPLE_PHONE = '+90 5XX XXX XX XX';

  // ---------- State ----------
  var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  var state = {
    lang: 'tr',
    theme: prefersDark ? 'dark' : 'light',
    net: 'online',
    screen: 'onboarding',
    prevScreen: 'home',
    onbStep: 1,
    perms: { location: false, notif: false, sensor: false },
    kvkk: false,
    kvkkError: false,
    loginStep: 1,
    loginError: '',
    form: { phone: '', code: '', custom: '' },
    reports: [],
    currentId: null,
    countdown: null,
    speed: 1,
    dialog: null,
    dialogReturn: null,
    siren: false,
    flash: false,
    area: 0,
    routeOn: false,
    donate: { fund: 'food', amount: 250, method: 'card', error: false, receipt: null },
    settings: { autoDetect: true, sms: true },
    vol: { joined: false, role: 'aid', cert: false, available: true, need: 'water', task: null, origin: 'home' },
    watch: 'home',
    focusNext: null
  };
  var seq = 0;
  var scrollPos = {};
  // Export frames (index.html?frame=phone|watch) are still images: no timers, no focus ring.
  var frozen = false;
  var hold = false;
  var frameKind = null;
  var frameId = null;
  var timer = null;
  var toastTimer = null;

  var panelEl = document.getElementById('panel');
  var phoneView = document.getElementById('phone-view');
  var watchView = document.getElementById('watch-view');
  var toastEl = document.getElementById('toast');

  // ---------- Helpers ----------
  function t(key, vars) {
    var dict = I18N[state.lang] || I18N.tr;
    var s = dict[key];
    if (s == null) s = key;
    if (vars) {
      Object.keys(vars).forEach(function (k) { s = s.split('{' + k + '}').join(String(vars[k])); });
    }
    return s;
  }

  function esc(value) {
    return String(value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function icon(name, cls) {
    return '<svg class="icon' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + ICONS[name] + '</svg>';
  }

  // data-act drives the click handler; data-fid lets render() restore focus after a re-render.
  function act(name, arg) {
    var hasArg = arg !== undefined && arg !== null;
    return ' data-act="' + name + '"' + (hasArg ? ' data-arg="' + arg + '"' : '') + ' data-fid="' + name + (hasArg ? '-' + arg : '') + '"';
  }

  function clock() {
    if (frozen) return '09:41'; // export frames: match the status bar, not the wall clock
    var d = new Date();
    return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
  }

  function currentReport() {
    for (var i = 0; i < state.reports.length; i++) {
      if (state.reports[i].id === state.currentId) return state.reports[i];
    }
    return null;
  }

  function queuedCount() {
    return state.reports.filter(function (r) { return r.state === 'queued'; }).length;
  }

  function chip(tone, iconName, text) {
    return '<span class="chip chip-' + tone + '">' + icon(iconName, 'icon-sm') + esc(text) + '</span>';
  }

  function seg(actName, options, current, label) {
    return '<div class="seg" role="group" aria-label="' + esc(label) + '">' + options.map(function (o) {
      var on = o.value === current;
      return '<button type="button"' + act(actName, o.value) + ' aria-pressed="' + on + '">' +
        (on ? icon('check', 'icon-sm') : '') + (o.icon ? icon(o.icon, 'icon-sm') : '') + '<span dir="auto"' + (o.lang ? ' lang="' + o.lang + '"' : '') + '>' + esc(o.text) + '</span></button>';
    }).join('') + '</div>';
  }

  function switchRow(actName, arg, on, title, desc) {
    return '<button type="button" class="switch-row" role="switch" aria-checked="' + on + '"' + act(actName, arg) + '>' +
      '<span class="switch-text"><strong>' + esc(title) + '</strong>' + (desc ? '<span>' + esc(desc) + '</span>' : '') + '</span>' +
      '<span class="switch-state" aria-hidden="true">' + esc(t(on ? 'common.on' : 'common.off')) + '</span>' +
      '<span class="switch" aria-hidden="true"></span></button>';
  }

  function appbar(title, withBack) {
    return '<header class="appbar">' +
      (withBack ? '<button type="button" class="icon-btn"' + act('back') + ' aria-label="' + esc(t('common.back')) + '">' + icon('back', 'flip') + '</button>' : '') +
      '<h1 class="h-headline" id="screen-title" tabindex="-1">' + esc(title) + '</h1></header>';
  }

  function stepLabel(n, total) {
    return '<p class="step">' + esc(t('common.step', { n: n, total: total })) + '</p>';
  }

  function later(fn, ms) {
    if (!frozen) { setTimeout(fn, ms); return; }
    if (!hold) fn();
  }

  function toast(message) {
    toastEl.textContent = message;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.textContent = ''; }, 4500);
  }

  function roleById(id) {
    return ROLES.filter(function (r) { return r.id === id; })[0] || ROLES[0];
  }

  function needById(id) {
    return NEEDS.filter(function (n) { return n.id === id; })[0] || NEEDS[0];
  }

  // Urgency is dots plus words, never colour alone (and never red: red is reserved for "I need help").
  function urgency(level, bare) {
    var dots = '';
    for (var i = 1; i <= 3; i++) dots += '<span class="urg-dot' + (i <= level ? ' is-on' : '') + '"></span>';
    return '<span class="urgency"><span class="urg-dots" aria-hidden="true">' + dots + '</span>' +
      esc((bare ? '' : t('vol.urgency') + ': ') + t(URGENCY[level])) + '</span>';
  }

  function taskChip(task) {
    if (task.done) return chip('ok', 'checkCircle', t('vol.completed'));
    var s = RSTATE[task.state];
    return chip(s.tone, s.icon, t(s.label));
  }

  // One row on Home and on Profile: the bottom navigation is already full at five items.
  function volEntry() {
    return '<button type="button" class="list-row list-row-info"' + act('volStart') + '>' + icon('users', 'icon-lg') +
      '<span class="list-main"><strong>' + esc(t(state.vol.joined ? 'vol.entryHub' : 'vol.entryJoin')) + '</strong>' +
      '<span class="hint">' + esc(t('vol.entrySub')) + '</span></span>' + icon('chevron', 'flip') + '</button>';
  }

  // ---------- Phone: shared chrome ----------
  function statusBar() {
    var n = NET[state.net];
    return '<div class="statusbar"><span>09:41</span><span class="sb-right">' + icon(n.icon, 'icon-sm') +
      '<span class="sr-only">' + esc(t(n.label)) + '</span>' + icon('battery', 'icon-sm') + '</span></div>';
  }

  function netBanner() {
    var n = NET[state.net];
    var q = queuedCount();
    return '<div class="banner banner-' + n.tone + '">' + icon(n.icon) + '<div class="banner-text"><strong>' + esc(t(n.label)) + '</strong>' +
      '<span>' + esc(t(n.desc)) + '</span>' +
      (q ? '<span class="banner-q">' + icon('clock', 'icon-sm') + esc(t('net.queued', { n: q })) + '</span>' : '') +
      '</div></div>';
  }

  function bottomNav() {
    return '<nav class="bottom-nav" aria-label="' + esc(t('nav.label')) + '"' + (state.dialog ? ' inert' : '') + '>' + NAV.map(function (item) {
      var on = state.screen === item.id || (item.id === 'home' && (state.screen === 'select' || state.screen === 'status' || VOL_SCREENS[state.screen]));
      return '<button type="button" class="nav-item"' + act('go', item.id) + (on ? ' aria-current="page"' : '') + '>' +
        '<span class="nav-ic">' + icon(item.icon) + '</span><span>' + esc(t(item.label)) + '</span></button>';
    }).join('') + '</nav>';
  }

  // ---------- Phone: screens ----------
  var SCREENS = {};

  SCREENS.onboarding = function () {
    if (state.onbStep === 1) {
      return stepLabel(1, 2) + '<div class="hero">' + icon('lifebuoy', 'icon-hero') +
        '<h1 class="brand" id="screen-title" tabindex="-1">YaşamHattı</h1>' +
        '<p class="lead">' + esc(t('onb.tagline')) + '</p></div>' +
        '<section class="stack" aria-labelledby="lang-title">' +
        '<h2 class="h-title" id="lang-title">' + esc(t('onb.chooseLang')) + '</h2>' +
        '<button type="button" class="choice choice-lg" lang="tr"' + act('setLang', 'tr') + ' aria-pressed="' + (state.lang === 'tr') + '">' +
        icon('globe') + '<span class="choice-main">Türkçe</span>' + (state.lang === 'tr' ? icon('check') : '') + '</button>' +
        '<button type="button" class="choice choice-lg" lang="ar"' + act('setLang', 'ar') + ' aria-pressed="' + (state.lang === 'ar') + '">' +
        icon('globe') + '<span class="choice-main">العربية</span>' + (state.lang === 'ar' ? icon('check') : '') + '</button>' +
        '</section>' +
        '<div class="pin-bottom"><button type="button" class="btn btn-info btn-xl"' + act('onbNext') + '>' + esc(t('common.continue')) + icon('chevron', 'flip') + '</button></div>';
    }
    return appbar(t('onb.permTitle'), true) + stepLabel(2, 2) +
      '<p class="lead">' + esc(t('onb.permLead')) + '</p>' +
      '<div class="card card-flush">' + PERMS.map(function (p) {
        return '<div class="perm">' + icon(p.icon) + switchRow('togglePerm', p.id, state.perms[p.id], t(p.name), t(p.desc)) + '</div>';
      }).join('') + '</div>' +
      '<label class="check"><input type="checkbox" data-change="toggleKvkk" data-fid="kvkk"' + (state.kvkk ? ' checked' : '') +
      (state.kvkkError ? ' aria-invalid="true" aria-describedby="kvkk-error"' : '') + '><span>' + esc(t('onb.kvkk')) + '</span></label>' +
      (state.kvkkError ? '<p class="field-error" id="kvkk-error">' + icon('alert', 'icon-sm') + esc(t('onb.kvkkNeeded')) + '</p>' : '') +
      '<div class="pin-bottom"><button type="button" class="btn btn-info btn-xl"' + act('onbDone') + '>' + esc(t('common.continue')) + icon('chevron', 'flip') + '</button></div>';
  };

  SCREENS.login = function () {
    var step1 = state.loginStep === 1;
    var err = state.loginError;
    var field = step1
      ? '<div class="field"><label for="f-phone">' + esc(t('login.phone')) + '</label>' +
        '<div class="input-group"><span class="input-prefix" aria-hidden="true">+90</span>' +
        '<input id="f-phone" data-model="phone" data-fid="phone" type="tel" inputmode="numeric" autocomplete="tel-national" dir="ltr" maxlength="13" aria-required="true" value="' + esc(state.form.phone) + '"' +
        ' aria-describedby="phone-hint' + (err ? ' phone-error' : '') + '"' + (err ? ' aria-invalid="true"' : '') + '></div>' +
        '<p class="hint" id="phone-hint">' + esc(t('login.phoneHint')) + '</p>' +
        (err ? '<p class="field-error" id="phone-error">' + icon('alert', 'icon-sm') + esc(t(err)) + '</p>' : '') + '</div>'
      : '<div class="field"><label for="f-code">' + esc(t('login.code')) + '</label>' +
        '<input id="f-code" data-model="code" data-fid="code" type="text" inputmode="numeric" autocomplete="one-time-code" dir="ltr" maxlength="6" aria-required="true" value="' + esc(state.form.code) + '"' +
        ' aria-describedby="code-hint' + (err ? ' code-error' : '') + '"' + (err ? ' aria-invalid="true"' : '') + '>' +
        '<p class="hint" id="code-hint">' + esc(t('login.codeHint')) + '</p>' +
        (err ? '<p class="field-error" id="code-error">' + icon('alert', 'icon-sm') + esc(t(err)) + '</p>' : '') + '</div>';
    return '<div class="hero hero-sm">' + icon('lifebuoy', 'icon-hero') + '<p class="brand brand-sm">YaşamHattı</p></div>' +
      stepLabel(step1 ? 1 : 2, 2) +
      '<h1 class="h-headline" id="screen-title" tabindex="-1">' + esc(t('login.title')) + '</h1>' +
      '<p class="lead">' + esc(t('login.lead')) + '</p>' +
      '<form class="stack" data-submit="' + (step1 ? 'sendCode' : 'submitCode') + '" novalidate>' + field +
      '<button type="submit" class="btn btn-info" data-fid="login-submit">' + esc(t(step1 ? 'login.sendCode' : 'login.submit')) + '</button>' +
      (step1 ? '' : '<button type="button" class="btn btn-ghost"' + act('changeNumber') + '>' + esc(t('login.changeNumber')) + '</button>') +
      '</form>' +
      '<div class="pin-bottom stack-sm"><button type="button" class="btn btn-outline"' + act('guest') + '>' + esc(t('login.guest')) + '</button>' +
      '<p class="hint center">' + icon('info', 'icon-sm') + esc(t('login.guestNote')) + '</p></div>';
  };

  SCREENS.home = function () {
    var recent = state.reports.slice(-3).reverse();
    return '<header class="appbar"><h1 class="brand brand-bar" id="screen-title" tabindex="-1">' + icon('lifebuoy') + 'YaşamHattı</h1>' +
      '<button type="button" class="icon-btn"' + act('showAfad') + ' aria-label="' + esc(t('home.alerts')) + '">' + icon('bell') + '</button></header>' +
      netBanner() +
      '<section class="stack" aria-labelledby="home-prompt">' +
      '<h2 class="h-title" id="home-prompt">' + esc(t('home.prompt')) + '</h2>' +
      '<button type="button" class="btn btn-danger btn-xxl"' + act('needHelp') + '>' + icon('lifebuoy', 'icon-lg') +
      '<span class="btn-text"><span>' + esc(t('home.help')) + '</span><small>' + esc(t('home.helpSub')) + '</small></span></button>' +
      '<button type="button" class="btn btn-safe btn-xl"' + act('imSafe') + '>' + icon('shieldCheck', 'icon-lg') + '<span>' + esc(t('home.safe')) + '</span></button>' +
      '</section>' +
      '<section class="stack-sm" aria-labelledby="home-quick"><h2 class="h-section" id="home-quick">' + esc(t('home.quick')) + '</h2>' +
      '<div class="grid-3">' +
      tile('toggleSiren', 'siren', t('home.siren'), state.siren) +
      tile('toggleFlash', 'flash', t('home.flash'), state.flash) +
      '<button type="button" class="tile tile-danger"' + act('call112') + '>' + icon('phone') + '<span>' + esc(t('home.call')) + '</span></button>' +
      '</div></section>' +
      '<section class="stack-sm" aria-labelledby="home-vol"><h2 class="h-section" id="home-vol">' + esc(t('vol.section')) + '</h2>' + volEntry() + '</section>' +
      '<section class="card" aria-labelledby="home-afad"><div class="card-head"><h2 class="h-section" id="home-afad">' + esc(t('home.afadTitle')) + '</h2>' +
      '<span class="tag">' + esc(t('common.sample')) + '</span></div>' +
      '<div class="quake"><div class="quake-mag"><span class="quake-num">5.4</span><span class="quake-label">' + esc(t('home.afadMag')) + '</span></div>' +
      '<div><strong>' + esc(t('home.afadPlace')) + '</strong><p class="hint">' + esc(t('home.afadMeta')) + '</p></div></div></section>' +
      '<section class="stack-sm" aria-labelledby="home-recent"><h2 class="h-section" id="home-recent">' + esc(t('home.recent')) + '</h2>' +
      (recent.length ? '<ul class="list">' + recent.map(function (r) {
        var k = KINDS[r.kind];
        var s = RSTATE[r.state];
        return '<li><button type="button" class="list-row"' + act('openReport', r.id) + '>' + icon(k.icon) +
          '<span class="list-main"><strong>' + esc(t(k.label)) + (r.type ? ' · ' + esc(t(TYPES[r.type].label)) : '') + '</strong>' +
          '<span class="hint">' + esc(r.time) + '</span></span>' + chip(s.tone, s.icon, t(s.label)) + '</button></li>';
      }).join('') + '</ul>' : '<p class="hint">' + esc(t('home.noReports')) + '</p>') +
      '</section>';
  };

  function tile(actName, iconName, label, on) {
    return '<button type="button" class="tile"' + act(actName) + ' aria-pressed="' + on + '">' + icon(iconName) +
      '<span>' + esc(label) + '</span><span class="tile-state" aria-hidden="true">' + esc(t(on ? 'common.on' : 'common.off')) + '</span></button>';
  }

  SCREENS.select = function () {
    return appbar(t('select.title'), true) +
      '<p class="lead">' + esc(t('select.lead')) + '</p>' +
      '<div class="stack">' + TYPE_ORDER.map(function (id) {
        return '<button type="button" class="btn btn-outline btn-xl btn-start"' + act('pickType', id) + '>' + icon(TYPES[id].icon, 'icon-lg') +
          '<span class="grow">' + esc(t(TYPES[id].label)) + '</span>' + icon('chevron', 'flip') + '</button>';
      }).join('') +
      '<button type="button" class="btn btn-ghost"' + act('pickType', 'other') + '>' + esc(t('type.other')) + '</button></div>';
  };

  SCREENS.status = function () {
    var r = currentReport();
    if (!r) {
      return appbar(t('screen.status'), true) + '<p class="lead">' + esc(t('status.none')) + '</p>' +
        '<button type="button" class="btn btn-info"' + act('go', 'home') + '>' + esc(t('status.home')) + '</button>';
    }
    var s = RSTATE[r.state];
    var k = KINDS[r.kind];
    var details = '';
    if (r.kind === 'help') {
      details = '<section class="card stack" aria-labelledby="more-title"><h2 class="h-section" id="more-title">' + esc(t('status.more')) + '</h2>' +
        yesNo('injured', t('status.injured'), r.injured) +
        yesNo('trapped', t('status.trapped'), r.trapped) +
        '<div class="row-between"><span class="q-label" id="people-label">' + esc(t('status.people')) + '</span>' +
        '<div class="stepper" role="group" aria-labelledby="people-label">' +
        '<button type="button" class="icon-btn icon-btn-outline"' + act('people', -1) + ' aria-label="' + esc(t('status.decrease')) + '"' + (r.people <= 1 ? ' disabled' : '') + '>' + icon('minus') + '</button>' +
        '<output class="stepper-val" aria-live="polite">' + r.people + '</output>' +
        '<button type="button" class="icon-btn icon-btn-outline"' + act('people', 1) + ' aria-label="' + esc(t('status.increase')) + '">' + icon('plus') + '</button>' +
        '</div></div></section>';
    }
    return '<div class="result result-' + s.tone + '">' + icon(s.icon, 'icon-xl') +
      '<h1 class="h-headline" id="screen-title" tabindex="-1">' + esc(t(s.title)) + '</h1>' +
      '<p class="lead">' + esc(t(s.desc)) + '</p>' +
      (r.auto ? '<p class="note-line">' + icon('info', 'icon-sm') + esc(t('status.auto')) + '</p>' : '') + '</div>' +
      '<dl class="card kv">' +
      kv(t('status.kind'), chip(k.tone, k.icon, t(k.label))) +
      (r.type ? kv(t('status.type'), esc(t(TYPES[r.type].label))) : '') +
      kv(t('status.time'), esc(r.time)) +
      kv(t('status.location'), '<bdi dir="ltr">' + SAMPLE_COORDS + '</bdi>') +
      kv(t('status.delivery'), chip(s.tone, s.icon, t(s.label))) +
      '</dl>' + details +
      '<div class="stack">' +
      '<button type="button" class="btn btn-info"' + act('go', 'map') + '>' + icon('pin') + esc(t('status.showArea')) + '</button>' +
      '<button type="button" class="btn btn-outline"' + act('go', 'home') + '>' + esc(t('status.home')) + '</button>' +
      '<button type="button" class="btn btn-ghost btn-ghost-danger"' + act('undoReport') + '>' + esc(t('status.undo')) + '</button></div>';
  };

  function kv(label, valueHtml) {
    return '<div class="kv-row"><dt>' + esc(label) + '</dt><dd>' + valueHtml + '</dd></div>';
  }

  function yesNo(field, label, value) {
    function option(v, key) {
      var on = value === v;
      return '<button type="button" class="choice choice-sm"' + act('detail', field + '_' + v) + ' aria-pressed="' + on + '">' +
        (on ? icon('check', 'icon-sm') : '') + '<span>' + esc(t(key)) + '</span></button>';
    }
    return '<div class="row-between"><span class="q-label" id="q-' + field + '">' + esc(label) + '</span>' +
      '<div class="pair" role="group" aria-labelledby="q-' + field + '">' + option('yes', 'common.yes') + option('no', 'common.no') + '</div></div>';
  }

  SCREENS.countdown = function () {
    var c = state.countdown;
    if (!c) return SCREENS.home();
    return '<div class="cd">' + icon('alert', 'icon-xl cd-icon') +
      '<h1 class="h-headline" id="screen-title" tabindex="-1">' + esc(t(CAUSES[c.cause])) + '</h1>' +
      '<p class="lead">' + esc(t('cd.desc')) + '</p>' +
      '<div class="cd-ring" role="timer" aria-label="' + esc(t('cd.timer')) + '">' +
      '<svg viewBox="0 0 200 200" aria-hidden="true" focusable="false"><circle class="cd-track" cx="100" cy="100" r="88"/>' +
      '<circle class="cd-progress" id="cd-ring" cx="100" cy="100" r="88" stroke-dasharray="' + RING.toFixed(1) + '" stroke-dashoffset="0"/></svg>' +
      '<div class="cd-center"><span class="cd-num" id="cd-num">' + c.remaining + '</span><span class="cd-unit">' + esc(t('cd.seconds')) + '</span></div></div>' +
      '<p class="sr-only" id="cd-live" aria-live="assertive"></p></div>' +
      '<div class="pin-bottom stack">' +
      '<button type="button" class="btn btn-safe btn-xxl"' + act('cdCancel') + '>' + icon('shieldCheck', 'icon-lg') + '<span>' + esc(t('cd.cancel')) + '</span></button>' +
      '<button type="button" class="btn btn-danger btn-xl"' + act('cdNow') + '>' + icon('lifebuoy', 'icon-lg') + '<span>' + esc(t('cd.now')) + '</span></button></div>';
  };

  SCREENS.map = function () {
    var a = AREAS[state.area];
    var offline = state.net === 'offline';
    var svg = '<svg class="map" viewBox="0 0 340 260" role="img" aria-label="' + esc(t('map.alt')) + '">' +
      '<rect class="m-bg" width="340" height="260"/>' +
      '<rect class="m-park" x="140" y="136" width="92" height="58" rx="8"/>' +
      '<path class="m-road" d="M0 40H340M0 120H340M0 210H340M70 0V260M120 0V260M250 0V260"/>' +
      (state.routeOn ? '<path class="m-route" d="' + a.route + '"/>' : '') +
      AREAS.map(function (p, i) {
        return '<g transform="translate(' + p.x + ' ' + p.y + ')"><circle class="m-pin' + (i === state.area ? ' is-selected' : '') + '" r="' + (i === state.area ? 17 : 14) + '"/>' +
          '<text class="m-pin-text" text-anchor="middle" y="5">' + p.n + '</text></g>';
      }).join('') +
      '<circle class="m-you-ring" cx="120" cy="170" r="14"/><circle class="m-you" cx="120" cy="170" r="7"/></svg>';
    return appbar(t('map.title'), false) +
      '<div>' + (offline ? chip('warn', 'wifiOff', t('map.offline')) : chip('ok', 'checkCircle', t('map.online'))) + '</div>' +
      '<div class="map-frame">' + svg + '</div>' +
      '<section class="card stack-sm" aria-labelledby="area-title">' +
      '<div class="card-head"><span class="tag">' + esc(t(state.area === 0 ? 'map.nearest' : 'map.selected')) + '</span><span class="tag">' + esc(t('common.sample')) + '</span></div>' +
      '<h2 class="h-title" id="area-title"><span class="num-badge" aria-hidden="true">' + a.n + '</span>' + esc(t(a.name)) + '</h2>' +
      '<p class="lead">' + esc(t('map.walk', { m: a.m, min: a.min })) + '</p>' +
      (state.routeOn ? '<p class="note-line">' + icon('route', 'icon-sm') + esc(t('map.routeOn')) + '</p>' : '') +
      '<button type="button" class="btn ' + (state.routeOn ? 'btn-outline' : 'btn-info') + '"' + act('toggleRoute') + ' aria-pressed="' + state.routeOn + '">' +
      icon('route') + esc(t(state.routeOn ? 'map.stop' : 'map.start')) + '</button></section>' +
      '<section class="stack-sm" aria-labelledby="areas-title"><h2 class="h-section" id="areas-title">' + esc(t('map.all')) + '</h2><ul class="list">' +
      AREAS.map(function (p, i) {
        return '<li><button type="button" class="list-row"' + act('pickArea', i) + ' aria-pressed="' + (i === state.area) + '">' +
          '<span class="num-badge" aria-hidden="true">' + p.n + '</span><span class="list-main"><strong>' + esc(t(p.name)) + '</strong>' +
          '<span class="hint">' + esc(t('map.walk', { m: p.m, min: p.min })) + '</span></span>' + (i === state.area ? icon('check') : '') + '</button></li>';
      }).join('') + '</ul></section>';
  };

  SCREENS.tools = function () {
    function tool(actName, iconName, on, title, desc, onText) {
      return '<section class="card stack-sm tool' + (on ? ' is-on' : '') + '"><div class="tool-head">' + icon(iconName, 'icon-lg') +
        '<div><h2 class="h-title">' + esc(title) + '</h2><p class="hint">' + esc(desc) + '</p></div></div>' +
        (on ? '<p class="live-line"><span class="pulse" aria-hidden="true"></span>' + esc(onText) + '</p>' : '') +
        '<button type="button" class="btn btn-xl ' + (on ? 'btn-outline' : 'btn-info') + '"' + act(actName) + ' aria-pressed="' + on + '">' + esc(t(on ? 'tools.stop' : 'tools.start')) + '</button></section>';
    }
    return appbar(t('tools.title'), false) +
      tool('toggleSiren', 'siren', state.siren, t('tools.sirenTitle'), t('tools.sirenDesc'), t('tools.sirenOn')) +
      tool('toggleFlash', 'flash', state.flash, t('tools.flashTitle'), t('tools.flashDesc'), t('tools.flashOn')) +
      '<button type="button" class="btn btn-danger btn-xl"' + act('call112') + '>' + icon('phone', 'icon-lg') + '<span>' + esc(t('home.call')) + '</span></button>' +
      '<section class="card tool-head">' + icon('sms', 'icon-lg') + '<div><h2 class="h-section">' + esc(t('tools.smsTitle')) + '</h2>' +
      '<p class="hint">' + esc(t('tools.smsDesc')) + '</p></div></section>';
  };

  SCREENS.donate = function () {
    var d = state.donate;
    if (d.receipt) {
      return '<div class="result result-ok">' + icon('checkCircle', 'icon-xl') +
        '<h1 class="h-headline" id="screen-title" tabindex="-1">' + esc(t('donate.doneTitle')) + '</h1>' +
        '<p class="lead">' + esc(t('donate.doneDesc')) + '</p></div>' +
        '<dl class="card kv">' + kv(t('donate.receipt'), '<bdi dir="ltr">' + esc(d.receipt) + '</bdi>') +
        kv(t('donate.purpose'), esc(t(fundById(d.fund).name))) +
        kv(t('donate.total'), '<bdi dir="ltr">' + d.paid + ' ₺</bdi>') + '</dl>' +
        '<p class="note-line">' + icon('info', 'icon-sm') + esc(t('donate.proto')) + '</p>' +
        '<button type="button" class="btn btn-info"' + act('donateAgain') + '>' + esc(t('donate.again')) + '</button>';
    }
    var offline = state.net === 'offline';
    return appbar(t('donate.title'), false) +
      '<div class="banner banner-ok">' + icon('lock') + '<div class="banner-text"><span>' + esc(t('donate.secure')) + '</span></div></div>' +
      (offline ? '<div class="banner banner-warn">' + icon('wifiOff') + '<div class="banner-text"><span>' + esc(t('donate.offline')) + '</span></div></div>' : '') +
      '<section class="stack-sm" aria-labelledby="fund-title"><h2 class="h-section" id="fund-title">' + esc(t('donate.purpose')) + '</h2>' +
      '<div class="stack-sm" role="group" aria-labelledby="fund-title">' + FUNDS.map(function (f) {
        var on = d.fund === f.id;
        return '<button type="button" class="choice"' + act('fund', f.id) + ' aria-pressed="' + on + '">' + icon(f.icon) +
          '<span class="choice-main"><strong>' + esc(t(f.name)) + '</strong><span class="hint">' + esc(t(f.desc)) + '</span></span>' + (on ? icon('check') : '') + '</button>';
      }).join('') + '</div></section>' +
      '<section class="stack-sm" aria-labelledby="amount-title"><h2 class="h-section" id="amount-title">' + esc(t('donate.amount')) + '</h2>' +
      '<div class="grid-2" role="group" aria-labelledby="amount-title">' + AMOUNTS.map(function (a) {
        var on = d.amount === a;
        return '<button type="button" class="choice choice-center"' + act('amount', a) + ' aria-pressed="' + on + '">' + (on ? icon('check', 'icon-sm') : '') +
          '<bdi dir="ltr">' + a + ' ₺</bdi></button>';
      }).join('') + '</div>' +
      '<div class="field"><label for="f-custom">' + esc(t('donate.custom')) + '</label>' +
      '<input id="f-custom" data-model="custom" data-fid="custom" type="text" inputmode="numeric" dir="ltr" maxlength="6" value="' + esc(state.form.custom) + '"' +
      ' aria-describedby="custom-hint' + (d.error ? ' custom-error' : '') + '"' + (d.error ? ' aria-invalid="true"' : '') + '>' +
      '<p class="hint" id="custom-hint">' + esc(t('donate.customHint')) + '</p>' +
      (d.error ? '<p class="field-error" id="custom-error">' + icon('alert', 'icon-sm') + esc(t('donate.customError')) + '</p>' : '') + '</div></section>' +
      '<section class="stack-sm" aria-labelledby="method-title"><h2 class="h-section" id="method-title">' + esc(t('donate.method')) + '</h2>' +
      '<div class="stack-sm" role="group" aria-labelledby="method-title">' + METHODS.map(function (m) {
        var on = d.method === m.id;
        return '<button type="button" class="choice"' + act('method', m.id) + ' aria-pressed="' + on + '">' + icon(m.icon) +
          '<span class="choice-main">' + esc(t(m.name)) + '</span>' + (on ? icon('check') : '') + '</button>';
      }).join('') + '</div></section>' +
      (d.processing
        ? '<button type="button" class="btn btn-info btn-xl"' + act('donateConfirm') + ' aria-disabled="true"><span class="spinner" aria-hidden="true"></span>' + esc(t('donate.processing')) + '</button>'
        : '<button type="button" class="btn btn-info btn-xl"' + act('donateConfirm') + (offline ? ' disabled' : '') + '>' + icon('lock') + esc(t('donate.confirm')) + '</button>') +
      '<p class="note-line">' + icon('info', 'icon-sm') + esc(t('donate.proto')) + '</p>';
  };

  function fundById(id) {
    return FUNDS.filter(function (f) { return f.id === id; })[0] || FUNDS[0];
  }

  SCREENS.profile = function () {
    function contact(nameKey) {
      var name = t(nameKey);
      return '<li class="list-static"><span class="list-main"><strong>' + esc(name) + '</strong><span class="hint"><bdi dir="ltr">' + SAMPLE_PHONE + '</bdi></span></span>' +
        '<button type="button" class="icon-btn icon-btn-outline"' + act('call112', nameKey) + ' aria-label="' + esc(t('profile.callContact', { name: name })) + '">' + icon('phone') + '</button></li>';
    }
    return appbar(t('profile.title'), false) +
      '<section class="card" aria-labelledby="p-personal"><div class="card-head"><h2 class="h-section" id="p-personal">' + esc(t('profile.personal')) + '</h2>' +
      '<button type="button" class="btn-link"' + act('proto', 'personal') + '>' + esc(t('profile.edit')) + '</button></div>' +
      '<dl class="kv">' + kv(t('profile.name'), esc(t('profile.nameVal'))) + kv(t('profile.phone'), '<bdi dir="ltr">' + SAMPLE_PHONE + '</bdi>') + '</dl></section>' +
      '<section class="card" aria-labelledby="p-medical"><div class="card-head"><h2 class="h-section" id="p-medical">' + esc(t('profile.medical')) + '</h2>' +
      '<button type="button" class="btn-link"' + act('proto', 'medical') + '>' + esc(t('profile.edit')) + '</button></div>' +
      '<p class="hint">' + esc(t('profile.medicalNote')) + '</p>' +
      '<dl class="kv">' + kv(t('profile.blood'), '<bdi dir="ltr">A Rh+</bdi>') + kv(t('profile.chronic'), esc(t('profile.chronicVal'))) +
      kv(t('profile.allergy'), esc(t('profile.allergyVal'))) + '</dl></section>' +
      '<section class="card stack-sm" aria-labelledby="p-contacts"><h2 class="h-section" id="p-contacts">' + esc(t('profile.contacts')) + '</h2>' +
      '<ul class="list list-plain">' + contact('profile.contact1') + contact('profile.contact2') + '</ul>' +
      '<button type="button" class="btn btn-outline"' + act('proto', 'contact') + '>' + icon('plus') + esc(t('profile.addContact')) + '</button></section>' +
      '<section class="stack-sm" aria-labelledby="p-vol"><h2 class="h-section" id="p-vol">' + esc(t('vol.section')) + '</h2>' + volEntry() + '</section>' +
      '<section class="card stack" aria-labelledby="p-settings"><h2 class="h-section" id="p-settings">' + esc(t('profile.settings')) + '</h2>' +
      '<div class="stack-sm"><span class="q-label">' + esc(t('profile.lang')) + '</span>' +
      seg('setLang', [{ value: 'tr', text: 'Türkçe', lang: 'tr' }, { value: 'ar', text: 'العربية', lang: 'ar' }], state.lang, t('profile.lang')) + '</div>' +
      '<div class="stack-sm"><span class="q-label">' + esc(t('profile.theme')) + '</span>' +
      seg('setTheme', [{ value: 'light', text: t('profile.light'), icon: 'sun' }, { value: 'dark', text: t('profile.dark'), icon: 'moon' }], state.theme, t('profile.theme')) + '</div>' +
      switchRow('toggleSetting', 'autoDetect', state.settings.autoDetect, t('profile.auto'), t('profile.autoDesc')) +
      switchRow('toggleSetting', 'sms', state.settings.sms, t('profile.sms'), t('profile.smsDesc')) +
      '<p class="note-line">' + icon('lock', 'icon-sm') + esc(t('profile.privacy')) + '</p></section>' +
      '<button type="button" class="btn btn-outline"' + act('logout') + '>' + esc(t('profile.logout')) + '</button>';
  };

  // ---------- Phone: volunteer ----------
  SCREENS.volJoin = function () {
    var v = state.vol;
    return appbar(t('vol.joinTitle'), true) +
      '<p class="lead">' + esc(t('vol.joinLead')) + '</p>' +
      '<section class="stack-sm" aria-labelledby="vol-role-title"><h2 class="h-section" id="vol-role-title">' + esc(t('vol.role')) + '</h2>' +
      '<div class="stack-sm" role="group" aria-labelledby="vol-role-title">' + ROLES.map(function (r) {
        var on = v.role === r.id;
        return '<button type="button" class="choice"' + act('volRole', r.id) + ' aria-pressed="' + on + '">' + icon(r.icon) +
          '<span class="choice-main"><strong>' + esc(t(r.name)) + '</strong><span class="hint">' + esc(t(r.desc)) + '</span></span>' + (on ? icon('check') : '') + '</button>';
      }).join('') + '</div></section>' +
      '<label class="check"><input type="checkbox" data-change="volCert" data-fid="volCert"' + (v.cert ? ' checked' : '') + '><span>' + esc(t('vol.cert')) + '</span></label>' +
      '<p class="note-line">' + icon('pin', 'icon-sm') + esc(t('vol.locationNote')) + '</p>' +
      '<div class="pin-bottom"><button type="button" class="btn btn-info btn-xl"' + act('volJoin') + '>' + icon('users', 'icon-lg') + '<span>' + esc(t('vol.joinBtn')) + '</span></button></div>';
  };

  SCREENS.volHub = function () {
    var v = state.vol;
    var net = NET[state.net];
    var task = v.task;
    var banner = state.net === 'online' ? '' :
      '<div class="banner banner-warn">' + icon(net.icon) + '<div class="banner-text"><strong>' + esc(t(net.label)) + '</strong>' +
      '<span>' + esc(t(state.net === 'offline' ? 'vol.offlineDesc' : 'net.weakDesc')) + '</span>' +
      (task && task.state === 'queued' ? '<span class="banner-q">' + icon('clock', 'icon-sm') + esc(t('vol.taskWaiting')) + '</span>' : '') + '</div></div>';
    var activeTask = !task ? '' :
      '<section class="stack-sm" aria-labelledby="vol-task"><h2 class="h-section" id="vol-task">' + esc(t('vol.activeTask')) + '</h2>' +
      '<button type="button" class="list-row list-row-info"' + act('go', 'volTask') + '>' + icon('clipboard', 'icon-lg') +
      '<span class="list-main"><strong>' + esc(t(needById(task.need).name)) + '</strong><span class="hint">' + esc(t('vol.assigned')) + ' · ' + esc(task.time) + '</span>' +
      taskChip(task) + '</span>' + icon('chevron', 'flip') + '</button></section>';
    var needs = !v.available
      ? '<p class="note-line">' + icon('info', 'icon-sm') + esc(t('vol.unavailable')) + '</p>'
      : '<section class="stack-sm" aria-labelledby="vol-needs"><div class="card-head"><h2 class="h-section" id="vol-needs">' + esc(t('vol.needs')) + '</h2>' +
        '<span class="tag">' + esc(t('common.sample')) + '</span></div><ul class="list">' + NEEDS.map(function (n) {
          return '<li><button type="button" class="list-row list-row-info"' + act('volNeed', n.id) + '>' + icon(n.icon, 'icon-lg') +
            '<span class="list-main"><strong>' + esc(t(n.name)) + '</strong><span class="hint">' + esc(t(n.dist)) + '</span>' + urgency(n.level) +
            (task && task.need === n.id ? taskChip(task) : '') + '</span>' + icon('chevron', 'flip') + '</button></li>';
        }).join('') + '</ul></section>';
    return appbar(t('vol.hubTitle'), true) + banner +
      '<section class="card stack-sm" aria-labelledby="vol-status"><h2 class="h-section" id="vol-status">' + esc(t('vol.status')) + '</h2>' +
      switchRow('volAvail', null, v.available, t('vol.available'), t(v.available ? 'vol.availableOn' : 'vol.availableOff')) +
      '<dl class="kv">' + kv(t('vol.role'), esc(t(roleById(v.role).name))) +
      kv(t('vol.certLabel'), v.cert ? chip('ok', 'checkCircle', t('vol.certYes')) : chip('info', 'info', t('vol.certNo'))) +
      kv(t('vol.locShare'), v.available ? chip('info', 'pin', t('common.on')) : chip('warn', 'pin', t('common.off'))) + '</dl></section>' +
      activeTask + needs;
  };

  SCREENS.volNeed = function () {
    var v = state.vol;
    var n = needById(v.need);
    var task = v.task;
    var taken = !!task && task.need === n.id;
    var busy = !!task && !task.done && !taken;
    return appbar(t('vol.needTitle'), true) +
      '<section class="card stack-sm"><div class="card-head"><span class="tag">' + esc(t('common.sample')) + '</span></div>' +
      '<h2 class="h-title">' + icon(n.icon, 'icon-lg') + esc(t(n.name)) + '</h2><p class="lead">' + esc(t(n.desc)) + '</p></section>' +
      '<dl class="card kv">' + kv(t('vol.event'), esc(t('vol.eventName'))) + kv(t('vol.urgency'), urgency(n.level, true)) + kv(t('vol.distance'), esc(t(n.dist))) + '</dl>' +
      (busy ? '<p class="note-line">' + icon('info', 'icon-sm') + esc(t('vol.busy')) + '</p>' : '') +
      '<div class="pin-bottom stack">' +
      (taken
        ? '<button type="button" class="btn btn-info btn-xl"' + act('go', 'volTask') + '>' + icon('clipboard', 'icon-lg') + '<span>' + esc(t('vol.toTask')) + '</span></button>'
        : '<button type="button" class="btn btn-info btn-xl"' + act('volAccept') + (busy ? ' disabled' : '') + '>' + icon('checkCircle', 'icon-lg') + '<span>' + esc(t('vol.accept')) + '</span></button>') +
      '<button type="button" class="btn btn-outline"' + act('go', 'volHub') + '>' + esc(t('vol.back')) + '</button></div>';
  };

  SCREENS.volTask = function () {
    var task = state.vol.task;
    if (!task) {
      return appbar(t('screen.volTask'), true) + '<p class="lead">' + esc(t('vol.noTask')) + '</p>' +
        '<button type="button" class="btn btn-info"' + act('go', 'volHub') + '>' + esc(t('vol.hubBack')) + '</button>';
    }
    var s = RSTATE[task.state];
    var key = task.done ? 'done' : task.state;
    return '<div class="result result-' + (task.done ? 'ok' : s.tone) + '">' + icon(task.done ? 'checkCircle' : s.icon, 'icon-xl') +
      '<h1 class="h-headline" id="screen-title" tabindex="-1">' + esc(t(TASK_COPY[key].title)) + '</h1>' +
      '<p class="lead">' + esc(t(TASK_COPY[key].desc)) + '</p></div>' +
      '<dl class="card kv">' + kv(t('vol.needType'), esc(t(needById(task.need).name))) + kv(t('vol.event'), esc(t('vol.eventName'))) +
      kv(t('vol.assigned'), esc(task.time)) + kv(t('status.delivery'), chip(s.tone, s.icon, t(s.label))) +
      kv(t('vol.state'), task.done ? chip('ok', 'checkCircle', t('vol.completed')) : chip('info', 'route', t('vol.inProgress'))) + '</dl>' +
      '<div class="stack">' +
      '<button type="button" class="btn btn-info"' + act('go', 'map') + '>' + icon('route') + esc(t('vol.route')) + '</button>' +
      (task.done ? '' : '<button type="button" class="btn btn-outline"' + act('volDone') + '>' + icon('check') + esc(t('vol.complete')) + '</button>') +
      '<button type="button" class="btn btn-ghost"' + act('go', 'volHub') + '>' + esc(t('vol.hubBack')) + '</button></div>';
  };

  // ---------- Phone: dialogs ----------
  function dialogHtml() {
    if (state.dialog === 'afad') {
      return '<div class="scrim"><div class="dialog" role="alertdialog" aria-modal="true" aria-labelledby="dlg-title" aria-describedby="dlg-desc">' +
        '<div class="dialog-head">' + icon('quake', 'icon-lg dialog-icon') + '<h2 class="h-headline" id="dlg-title">' + esc(t('afad.title')) + '</h2>' +
        '<button type="button" class="icon-btn"' + act('closeDialog') + ' aria-label="' + esc(t('common.close')) + '">' + icon('close') + '</button></div>' +
        '<p class="lead" id="dlg-desc">' + esc(t('afad.body')) + ' <span class="tag">' + esc(t('common.sample')) + '</span></p>' +
        '<p class="q-label">' + esc(t('afad.ask')) + '</p>' +
        '<button type="button" class="btn btn-safe btn-xl" data-autofocus' + act('imSafe') + '>' + icon('shieldCheck', 'icon-lg') + '<span>' + esc(t('home.safe')) + '</span></button>' +
        '<button type="button" class="btn btn-danger btn-xl"' + act('helpQuake') + '>' + icon('lifebuoy', 'icon-lg') + '<span>' + esc(t('home.help')) + '</span></button>' +
        '<button type="button" class="btn btn-outline"' + act('go', 'map') + '>' + icon('pin') + esc(t('status.showArea')) + '</button></div></div>';
    }
    // Completing a task cannot be undone, so it asks first; the safe answer is the default focus.
    if (state.dialog === 'doneTask') {
      return '<div class="scrim"><div class="dialog" role="alertdialog" aria-modal="true" aria-labelledby="dlg-title" aria-describedby="dlg-desc">' +
        '<h2 class="h-headline" id="dlg-title">' + esc(t('vol.doneConfirmTitle')) + '</h2>' +
        '<p class="lead" id="dlg-desc">' + esc(t('vol.doneConfirmDesc')) + '</p>' +
        '<button type="button" class="btn btn-outline" data-autofocus' + act('closeDialog') + '>' + esc(t('vol.doneNo')) + '</button>' +
        '<button type="button" class="btn btn-info"' + act('volDoneConfirm') + '>' + icon('check') + esc(t('vol.doneYes')) + '</button></div></div>';
    }
    if (state.dialog === 'confirm') {
      return '<div class="scrim"><div class="dialog" role="alertdialog" aria-modal="true" aria-labelledby="dlg-title" aria-describedby="dlg-desc">' +
        '<h2 class="h-headline" id="dlg-title">' + esc(t('confirm.title')) + '</h2>' +
        '<p class="lead" id="dlg-desc">' + esc(t('confirm.desc')) + '</p>' +
        '<button type="button" class="btn btn-outline" data-autofocus' + act('closeDialog') + '>' + esc(t('confirm.no')) + '</button>' +
        '<button type="button" class="btn btn-danger"' + act('confirmUndo') + '>' + esc(t('confirm.yes')) + '</button></div></div>';
    }
    return '';
  }

  function phoneHtml() {
    var render = SCREENS[state.screen] || SCREENS.home;
    return statusBar() +
      '<div class="screen" id="screen" data-screen="' + state.screen + '"' + (state.dialog ? ' inert' : '') + '>' + render() + '</div>' +
      (NO_NAV[state.screen] ? '' : bottomNav()) + dialogHtml();
  }

  // ---------- Watch (Wear OS, always dark) ----------
  function watchHtml() {
    if (state.watch === 'countdown' && state.countdown) {
      return '<p class="w-label">' + esc(t(CAUSES[state.countdown.cause])) + '</p>' +
        '<p class="w-num" id="w-cd-num" role="timer" aria-label="' + esc(t('cd.timer')) + '">' + state.countdown.remaining + '</p>' +
        '<button type="button" class="w-pill w-safe"' + act('cdCancel') + '>' + icon('shieldCheck', 'icon-sm') + esc(t('watch.ok')) + '</button>';
    }
    if (state.watch === 'status' && currentReport()) {
      var s = RSTATE[currentReport().state];
      return '<span class="w-result w-' + s.tone + '">' + icon(s.icon, 'icon-lg') + '</span>' +
        '<p class="w-title">' + esc(t(s.watch)) + '</p>' +
        (currentReport().state === 'queued' ? '<p class="w-label">' + esc(t('watch.queuedSub')) + '</p>' : '') +
        '<button type="button" class="w-pill w-neutral"' + act('watchHome') + '>' + esc(t('watch.done')) + '</button>';
    }
    if (state.watch === 'alert') {
      return icon('quake', 'icon-lg w-alert') + '<p class="w-title">' + esc(t('watch.quake')) + '</p>' +
        '<button type="button" class="w-pill w-safe"' + act('imSafe') + '>' + icon('shieldCheck', 'icon-sm') + esc(t('watch.safe')) + '</button>' +
        '<button type="button" class="w-pill w-danger"' + act('helpQuake') + '>' + icon('lifebuoy', 'icon-sm') + esc(t('watch.help')) + '</button>';
    }
    return '<p class="w-time">09:41</p>' +
      '<button type="button" class="w-sos"' + act('watchHelp') + '>' + icon('lifebuoy', 'icon-lg') + '<span>' + esc(t('watch.help')) + '</span></button>' +
      '<button type="button" class="w-pill w-safe"' + act('imSafe') + '>' + icon('shieldCheck', 'icon-sm') + esc(t('watch.safe')) + '</button>';
  }

  // ---------- Review panel ----------
  function panelHtml() {
    return '<h2 class="panel-title" lang="tr">YaşamHattı</h2><p class="hint">' + esc(t('lab.sub')) + '</p>' +
      '<div class="panel-group"><h3 class="panel-h">' + esc(t('lab.lang')) + '</h3>' +
      seg('setLang', [{ value: 'tr', text: 'Türkçe', lang: 'tr' }, { value: 'ar', text: 'العربية', lang: 'ar' }], state.lang, t('lab.lang')) + '</div>' +
      '<div class="panel-group"><h3 class="panel-h">' + esc(t('lab.theme')) + '</h3>' +
      seg('setTheme', [{ value: 'light', text: t('profile.light'), icon: 'sun' }, { value: 'dark', text: t('profile.dark'), icon: 'moon' }], state.theme, t('lab.theme')) + '</div>' +
      '<div class="panel-group"><h3 class="panel-h">' + esc(t('lab.net')) + '</h3><div class="seg seg-col" role="group" aria-label="' + esc(t('lab.net')) + '">' +
      NET_ORDER.map(function (id) {
        var on = state.net === id;
        return '<button type="button"' + act('setNet', id) + ' aria-pressed="' + on + '">' + (on ? icon('check', 'icon-sm') : '') + icon(NET[id].icon, 'icon-sm') + '<span>' + esc(t(NET[id].label)) + '</span></button>';
      }).join('') + '</div></div>' +
      '<div class="panel-group"><h3 class="panel-h">' + esc(t('lab.sim')) + '</h3>' +
      '<button type="button" class="btn btn-outline btn-sm"' + act('simulate', 'quake') + '>' + icon('quake', 'icon-sm') + esc(t('lab.simQuake')) + '</button>' +
      '<button type="button" class="btn btn-outline btn-sm"' + act('simulate', 'crash') + '>' + icon('car', 'icon-sm') + esc(t('lab.simCrash')) + '</button>' +
      '<button type="button" class="btn btn-outline btn-sm"' + act('simulate', 'fall') + '>' + icon('fall', 'icon-sm') + esc(t('lab.simFall')) + '</button>' +
      '<button type="button" class="btn btn-outline btn-sm"' + act('showAfad') + '>' + icon('bell', 'icon-sm') + esc(t('lab.simAfad')) + '</button></div>' +
      '<div class="panel-group"><h3 class="panel-h">' + esc(t('lab.speed')) + '</h3>' +
      seg('setSpeed', [{ value: 1, text: '1×' }, { value: 10, text: '10×' }], state.speed, t('lab.speed')) + '</div>' +
      '<div class="panel-group"><h3 class="panel-h">' + esc(t('lab.screens')) + '</h3><div class="screen-list">' +
      SCREEN_LIST.map(function (s) {
        return '<button type="button"' + act('jump', s.id) + (state.screen === s.id ? ' aria-current="true"' : '') + '>' + esc(t(s.label)) + '</button>';
      }).join('') + '</div></div>';
  }

  // ---------- Render ----------
  function render() {
    var active = document.activeElement;
    var fid = active && active.getAttribute ? active.getAttribute('data-fid') : null;
    var region = fid && active.closest ? active.closest('[data-region]') : null;
    var oldScreen = document.getElementById('screen');
    var sameScreen = oldScreen && oldScreen.getAttribute('data-screen') === state.screen;
    var keepScroll = sameScreen ? oldScreen.scrollTop : (state.restoreScroll ? scrollPos[state.screen] || 0 : 0);
    state.restoreScroll = false;

    var root = document.documentElement;
    root.lang = state.lang;
    root.dir = state.lang === 'ar' ? 'rtl' : 'ltr';
    root.setAttribute('data-theme', state.theme);
    document.title = t('lab.title');

    panelEl.innerHTML = panelHtml();
    phoneView.innerHTML = phoneHtml();
    watchView.innerHTML = watchHtml();
    document.getElementById('phone-label').textContent = t('lab.phone');
    document.getElementById('watch-label').textContent = t('lab.watch');
    document.getElementById('lab-note').textContent = t('lab.note');
    document.getElementById('skip-link').textContent = t('lab.skip');

    var newScreen = document.getElementById('screen');
    if (newScreen) newScreen.scrollTop = keepScroll;

    var target = null;
    var reveal = false;
    if (state.focusNext) {
      target = document.querySelector(state.focusNext);
      // A field focused after a failed submit may sit above the fold; the screen title never needs revealing.
      reveal = state.focusNext !== '#screen-title';
      state.focusNext = null;
    } else if (fid && region) {
      target = region.querySelector('[data-fid="' + fid + '"]');
    }
    if (frozen) target = null;
    if (target && target.focus) target.focus({ preventScroll: true });
    if (reveal && target && target.scrollIntoView) target.scrollIntoView({ block: 'nearest' });
    updateCountdownDom();
  }

  function updateCountdownDom() {
    var c = state.countdown;
    if (!c) return;
    var num = document.getElementById('cd-num');
    if (num) num.textContent = c.remaining;
    var ring = document.getElementById('cd-ring');
    if (ring) ring.style.strokeDashoffset = String(RING * (1 - c.remaining / COUNTDOWN_SECONDS));
    var watchNum = document.getElementById('w-cd-num');
    if (watchNum) watchNum.textContent = c.remaining;
    var live = document.getElementById('cd-live');
    if (live && (c.remaining % 10 === 0 || c.remaining <= 5)) live.textContent = c.remaining + ' ' + t('cd.seconds');
  }

  // ---------- Behaviour ----------
  // Remember where each screen was scrolled so "back" returns the user to the same place.
  function saveScroll() {
    var sc = document.getElementById('screen');
    var id = sc && sc.getAttribute ? sc.getAttribute('data-screen') : null;
    if (id) scrollPos[id] = sc.scrollTop;
  }

  function go(screen, restore) {
    saveScroll();
    state.restoreScroll = !!restore;
    if (state.screen !== screen) state.prevScreen = state.screen;
    state.screen = screen;
    state.dialog = null;
    if (state.watch === 'alert') state.watch = 'home';
    state.focusNext = '#screen-title';
    render();
  }

  function createReport(kind, type, auto) {
    var report = {
      id: ++seq, kind: kind, type: type || null, time: clock(), auto: !!auto,
      state: state.net === 'offline' ? 'queued' : (state.net === 'weak' ? 'sending' : 'sent'),
      injured: null, trapped: null, people: 1
    };
    state.reports.push(report);
    state.currentId = report.id;
    state.watch = 'status';
    if (report.state === 'sending') {
      later(function () {
        if (report.state !== 'sending') return;
        report.state = state.net === 'offline' ? 'queued' : 'sent';
        render();
      }, 2500);
    }
    go('status');
  }

  function stopCountdown() {
    clearInterval(timer);
    timer = null;
    state.countdown = null;
  }

  function startTimer() {
    clearInterval(timer);
    if (frozen) return;
    timer = setInterval(tick, 1000 / state.speed);
  }

  function tick() {
    var c = state.countdown;
    if (!c) { clearInterval(timer); return; }
    c.remaining -= 1;
    if (c.remaining <= 0) { expireCountdown(); return; }
    updateCountdownDom();
  }

  function expireCountdown() {
    if (!state.countdown) return;
    var cause = state.countdown.cause;
    stopCountdown();
    createReport('help', cause, true);
  }

  function startCountdown(cause) {
    saveScroll();
    if (state.screen !== 'countdown') state.prevScreen = state.screen;
    state.countdown = { cause: cause, remaining: COUNTDOWN_SECONDS };
    state.dialog = null;
    state.screen = 'countdown';
    state.watch = 'countdown';
    state.focusNext = '#phone-view [data-fid="cdCancel"]';
    startTimer();
    render();
  }

  function openDialog(name, opener) {
    state.dialog = name;
    state.dialogReturn = opener && opener.getAttribute('data-fid') && opener.closest('[data-region="phone"]')
      ? '#phone-view [data-fid="' + opener.getAttribute('data-fid') + '"]' : null;
    state.focusNext = '.dialog [data-autofocus]';
    render();
  }

  function closeDialog() {
    if (!state.dialog) return;
    state.dialog = null;
    if (state.watch === 'alert') state.watch = 'home';
    state.focusNext = state.dialogReturn;
    state.dialogReturn = null;
    render();
  }

  var actions = {
    setLang: function (arg) { state.lang = arg; render(); },
    setTheme: function (arg) { state.theme = arg; render(); },
    setSpeed: function (arg) { state.speed = Number(arg); if (state.countdown) startTimer(); render(); },
    setNet: function (arg) {
      state.net = arg;
      var flushed = 0;
      state.reports.forEach(function (r) {
        if (arg !== 'offline' && r.state === 'queued') { r.state = 'sent'; flushed += 1; }
        if (arg === 'offline' && r.state === 'sending') r.state = 'queued';
      });
      var task = state.vol.task;
      if (task) {
        if (arg !== 'offline' && task.state === 'queued') { task.state = 'sent'; flushed += 1; }
        if (arg === 'offline' && task.state === 'sending') task.state = 'queued';
      }
      render();
      if (flushed) toast(t('toast.synced', { n: flushed }));
    },
    go: function (arg) { go(arg); },
    jump: function (arg) {
      if (arg === 'countdown') { startCountdown('quake'); return; }
      if (state.countdown) stopCountdown();
      if (arg === 'onboarding') state.onbStep = 1;
      if (arg === 'login') { state.loginStep = 1; state.loginError = ''; }
      state.watch = 'home';
      go(arg);
    },
    back: function () {
      if (state.screen === 'onboarding') { state.onbStep = 1; state.focusNext = '#screen-title'; render(); return; }
      if (state.screen === 'volNeed' || state.screen === 'volTask') { go('volHub', true); return; }
      if (VOL_SCREENS[state.screen]) { go(state.vol.origin, true); return; }
      go(state.screen === 'select' || state.screen === 'status' ? 'home' : state.prevScreen, true);
    },

    onbNext: function () { state.onbStep = 2; state.focusNext = '#screen-title'; render(); },
    togglePerm: function (arg) { state.perms[arg] = !state.perms[arg]; render(); },
    toggleKvkk: function () { state.kvkk = !state.kvkk; if (state.kvkk) state.kvkkError = false; render(); },
    onbDone: function () {
      if (!state.kvkk) { state.kvkkError = true; state.focusNext = '[data-fid="kvkk"]'; render(); return; }
      go('login');
    },

    sendCode: function () {
      var digits = state.form.phone.replace(/\D/g, '');
      if (digits.length !== 10 || digits.charAt(0) !== '5') { state.loginError = 'login.phoneError'; state.focusNext = '#f-phone'; render(); return; }
      state.loginError = ''; state.loginStep = 2; state.focusNext = '#f-code'; render();
    },
    submitCode: function () {
      if (!/^\d{6}$/.test(state.form.code.trim())) { state.loginError = 'login.codeError'; state.focusNext = '#f-code'; render(); return; }
      state.loginError = ''; go('home');
    },
    changeNumber: function () { state.loginStep = 1; state.loginError = ''; state.form.code = ''; state.focusNext = '#f-phone'; render(); },
    guest: function () { state.loginError = ''; go('home'); },
    logout: function () { state.loginStep = 1; state.form.code = ''; go('login'); toast(t('toast.loggedOut')); },

    needHelp: function () { go('select'); },
    watchHelp: function () { createReport('help', 'other', false); },
    helpQuake: function () { createReport('help', 'quake', false); },
    imSafe: function () { createReport('safe', null, false); },
    pickType: function (arg) { createReport('help', arg, false); },
    openReport: function (arg) { state.currentId = Number(arg); go('status'); },
    detail: function (arg) {
      var r = currentReport(); if (!r) return;
      var parts = arg.split('_');
      r[parts[0]] = r[parts[0]] === parts[1] ? null : parts[1];
      render();
    },
    people: function (arg) {
      var r = currentReport(); if (!r) return;
      r.people = Math.max(1, Math.min(99, r.people + Number(arg)));
      render();
    },
    undoReport: function (arg, el) { openDialog('confirm', el); },
    confirmUndo: function () {
      state.reports = state.reports.filter(function (r) { return r.id !== state.currentId; });
      state.currentId = null;
      state.watch = 'home';
      go('home');
      toast(t('toast.reportCancelled'));
    },
    closeDialog: function () { closeDialog(); },
    showAfad: function (arg, el) {
      if (state.countdown) return;
      state.watch = 'alert';
      openDialog('afad', el);
    },
    watchHome: function () { state.watch = 'home'; render(); },

    simulate: function (arg) {
      if (!state.settings.autoDetect) { toast(t('lab.autoOff')); return; }
      startCountdown(arg);
    },
    cdCancel: function () {
      var returnTo = state.prevScreen === 'countdown' ? 'home' : state.prevScreen;
      stopCountdown();
      state.watch = 'home';
      go(returnTo, true);
      toast(t('toast.cdCancelled'));
    },
    cdExpire: function () { expireCountdown(); },
    cdNow: function () {
      var cause = state.countdown ? state.countdown.cause : 'other';
      stopCountdown();
      createReport('help', cause, false);
    },

    toggleSiren: function () { state.siren = !state.siren; render(); },
    toggleFlash: function () { state.flash = !state.flash; render(); },
    call112: function () { toast(t('toast.call')); },
    proto: function () { toast(t('toast.proto')); },

    pickArea: function (arg) { state.area = Number(arg); render(); },
    toggleRoute: function () { state.routeOn = !state.routeOn; render(); },

    fund: function (arg) { state.donate.fund = arg; render(); },
    amount: function (arg) { state.donate.amount = Number(arg); state.form.custom = ''; state.donate.error = false; render(); },
    method: function (arg) { state.donate.method = arg; render(); },
    donateConfirm: function () {
      var d = state.donate;
      var custom = state.form.custom.trim();
      var amount = d.amount;
      if (custom) {
        amount = Number(custom);
        if (!/^\d+$/.test(custom) || amount < MIN_DONATION) { d.error = true; state.focusNext = '#f-custom'; render(); return; }
      }
      d.error = false;
      d.processing = true;
      render();
      later(function () {
        d.processing = false;
        d.paid = amount;
        d.receipt = 'YH-' + String(100000 + ((Date.now() / 1000) | 0) % 900000);
        if (state.screen === 'donate') state.focusNext = '#screen-title';
        render();
      }, 1200);
    },
    donateAgain: function () { state.donate.receipt = null; state.form.custom = ''; state.focusNext = '#screen-title'; render(); },

    toggleSetting: function (arg) { state.settings[arg] = !state.settings[arg]; render(); },

    volStart: function () {
      if (!VOL_SCREENS[state.screen]) state.vol.origin = state.screen;
      go(state.vol.joined ? 'volHub' : 'volJoin');
    },
    volRole: function (arg) { state.vol.role = arg; render(); },
    volCert: function () { state.vol.cert = !state.vol.cert; render(); },
    volJoin: function () { state.vol.joined = true; go('volHub'); toast(t('toast.volJoined')); },
    volAvail: function () { state.vol.available = !state.vol.available; render(); },
    volNeed: function (arg) { state.vol.need = arg; go('volNeed'); },
    // Like a report: accepted offline it is queued on the device and flushed when the network returns.
    volAccept: function () {
      var v = state.vol;
      if (v.task && v.task.need === v.need) { go('volTask'); return; }
      if (v.task && !v.task.done) return;
      var task = {
        need: v.need, time: clock(), done: false,
        state: state.net === 'offline' ? 'queued' : (state.net === 'weak' ? 'sending' : 'sent')
      };
      v.task = task;
      if (task.state === 'sending') {
        later(function () {
          if (task.state !== 'sending') return;
          task.state = state.net === 'offline' ? 'queued' : 'sent';
          render();
        }, 2500);
      }
      go('volTask');
    },
    volDone: function (arg, el) { if (state.vol.task && !state.vol.task.done) openDialog('doneTask', el); },
    volDoneConfirm: function () {
      if (state.vol.task) state.vol.task.done = true;
      state.dialog = null;
      state.dialogReturn = null;
      state.focusNext = '#screen-title';
      render();
    }
  };

  // ---------- Events ----------
  document.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('[data-act]') : null;
    if (!el || el.disabled || el.getAttribute('aria-disabled') === 'true') return;
    var fn = actions[el.getAttribute('data-act')];
    if (fn) fn(el.getAttribute('data-arg'), el);
  });

  document.addEventListener('change', function (e) {
    var name = e.target.getAttribute ? e.target.getAttribute('data-change') : null;
    if (name && actions[name]) actions[name]();
  });

  document.addEventListener('input', function (e) {
    var model = e.target.getAttribute ? e.target.getAttribute('data-model') : null;
    if (model) state.form[model] = e.target.value;
  });

  document.addEventListener('submit', function (e) {
    var name = e.target.getAttribute ? e.target.getAttribute('data-submit') : null;
    if (!name) return;
    e.preventDefault();
    if (actions[name]) actions[name]();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && state.dialog) closeDialog();
  });

  // Exposed for tools/check.js smoke test.
  window.__yasamhatti = { state: state, actions: actions, render: render, screens: SCREEN_LIST };

  // Deep links for reviews: index.html?lang=ar&theme=dark&net=offline&screen=map (also sim=quake|crash, dialog=afad).
  function applyQuery() {
    if (!window.location || !window.URLSearchParams) return;
    var q = new window.URLSearchParams(window.location.search);
    // clean=1 hides the review panel, for screenshots in the project report.
    if (q.get('clean') === '1') document.body.classList.add('clean');
    if (q.get('frame') === 'phone' || q.get('frame') === 'watch') {
      frameKind = q.get('frame');
      frameId = q.get('id');
      frozen = true;
      hold = q.get('hold') === '1';
      document.body.classList.add('frame', 'frame-' + frameKind);
    }
    if (I18N[q.get('lang')]) state.lang = q.get('lang');
    if (q.get('theme') === 'light' || q.get('theme') === 'dark') state.theme = q.get('theme');
    if (NET[q.get('net')]) state.net = q.get('net');
    if (SCREENS[q.get('screen')] && q.get('screen') !== 'countdown') state.screen = q.get('screen');
    if (q.get('step') === '2') { state.onbStep = 2; state.loginStep = 2; }
    // do=act:arg,act:arg replays UI actions to reach a state; set:field=value fills a form field first.
    (q.get('do') || '').split(',').forEach(function (step) {
      if (!step) return;
      var cut = step.indexOf(':');
      var name = cut === -1 ? step : step.slice(0, cut);
      var arg = cut === -1 ? null : step.slice(cut + 1);
      if (name === 'set') { var pair = arg.split('='); state.form[pair[0]] = pair[1] || ''; return; }
      if (actions[name]) actions[name](arg, null);
    });
    if (frozen) {
      if (state.countdown) state.countdown.remaining = 42;
      clearTimeout(toastTimer);
      if (q.get('toast') !== '1') toastEl.textContent = '';
    }
    if (q.get('report') === 'help' || q.get('report') === 'safe') {
      actions.setNet(state.net);
      createReport(q.get('report'), q.get('report') === 'help' ? 'quake' : null, false);
    }
    if (CAUSES[q.get('sim')]) startCountdown(q.get('sim'));
    if (q.get('dialog') === 'afad') actions.showAfad(null, null);
    // selftest=1 runs tools/selftest.js: real clicks and real layout measurements in this browser.
    if (q.get('selftest') === '1') {
      var script = document.createElement('script');
      script.src = 'tools/selftest.js';
      document.body.appendChild(script);
    }
  }

  // Tells board.html how tall this frame's content is, so each frame shows the full screen.
  function reportFrameSize() {
    function post() {
      var el = document.querySelector(frameKind === 'watch' ? '.watch-wrap' : '.phone');
      if (!el || !window.parent) return;
      var r = el.getBoundingClientRect();
      window.parent.postMessage({ source: 'yasamhatti-frame', id: frameId, width: Math.ceil(r.width) + 4, height: Math.ceil(r.height) + 4 }, '*');
    }
    post();
    window.addEventListener('load', post);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(post);
  }

  applyQuery();
  render();
  if (frameKind) reportFrameSize();
})();
