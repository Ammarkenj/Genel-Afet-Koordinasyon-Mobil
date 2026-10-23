/* In-browser self-test. Open index.html?selftest=1 and read the report under the devices.
   Unlike check.js (stub DOM), this drives the real page: real click/input/submit/keyboard events,
   real focus, and real layout measurements (touch-target sizes, overflow, heading count). */
(function () {
  'use strict';

  var app = window.__yasamhatti;
  var I18N = window.I18N;
  var results = [];
  var MIN_TARGET = 48;

  function ok(cond, msg) { results.push((cond ? 'PASS  ' : 'FAIL  ') + msg); return !!cond; }
  function wait(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function q(sel) { return document.querySelector(sel); }
  function control(region, fid) { return q('[data-region="' + region + '"] [data-fid="' + fid + '"]'); }
  function screenId() { var s = q('#screen'); return s ? s.getAttribute('data-screen') : null; }
  function focusFid() { var a = document.activeElement; return a ? (a.getAttribute('data-fid') || a.id || a.tagName) : null; }
  function phoneText() { return q('#phone-view').textContent; }
  function toastText() { return q('#toast').textContent; }

  function click(region, fid) {
    var el = control(region, fid);
    if (!el) { ok(false, 'control exists: ' + region + ' / ' + fid); return false; }
    el.focus();
    el.click();
    return true;
  }

  function type(sel, value) {
    var el = q(sel);
    if (!el) { ok(false, 'input exists: ' + sel); return; }
    el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function submit() {
    var btn = q('#phone-view form button[type="submit"]');
    if (!btn) { ok(false, 'submit button exists'); return; }
    btn.click();
  }

  // Measures what is actually on screen: heading count, overflow, target sizes, names, labels.
  function audit(label) {
    var view = q('#phone-view');
    var sc = q('#screen');
    ok(view.querySelectorAll('h1').length === 1, label + ': exactly one h1');
    ok(document.querySelectorAll('h1').length === 1, label + ': one h1 in the whole document');
    ok(sc.scrollWidth <= sc.clientWidth, label + ': no horizontal overflow (' + sc.scrollWidth + ' <= ' + sc.clientWidth + ')');
    var small = [];
    var unnamed = [];
    view.querySelectorAll('button, input').forEach(function (el) {
      var target = el.type === 'checkbox' ? (el.closest('label') || el) : el;
      var r = target.getBoundingClientRect();
      if (!r.width && !r.height) return;
      if (r.width < MIN_TARGET - 0.5 || r.height < MIN_TARGET - 0.5) small.push((el.getAttribute('data-fid') || el.id) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
      if (el.tagName === 'BUTTON' && !(el.getAttribute('aria-label') || el.textContent.trim())) unnamed.push(el.getAttribute('data-fid'));
    });
    ok(!small.length, label + ': touch targets >= ' + MIN_TARGET + 'px' + (small.length ? ' -> ' + small.join(', ') : ''));
    ok(!unnamed.length, label + ': every button has an accessible name' + (unnamed.length ? ' -> ' + unnamed.join(', ') : ''));
    view.querySelectorAll('input:not([type="checkbox"])').forEach(function (input) {
      ok(!!view.querySelector('label[for="' + input.id + '"]'), label + ': input #' + input.id + ' has a visible label');
    });
    view.querySelectorAll('svg[role="img"]').forEach(function (svg) {
      ok(!!svg.getAttribute('aria-label'), label + ': informative image has a text alternative');
    });
  }

  function auditWatch(label) {
    var small = [];
    q('#watch-view').querySelectorAll('button').forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.width < MIN_TARGET - 0.5 || r.height < MIN_TARGET - 0.5) small.push(el.getAttribute('data-fid') + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
    });
    ok(!small.length, label + ': watch targets >= ' + MIN_TARGET + 'px' + (small.length ? ' -> ' + small.join(', ') : ''));
  }

  // Largest system text: scales every font in the phone view by `factor` (like Android font scale / Dynamic Type)
  // and reports anything that pokes out of the screen sideways or makes it scroll horizontally.
  function auditLarge(label, factor) {
    var view = q('#phone-view');
    var sc = q('#screen');
    var els = Array.prototype.slice.call(view.querySelectorAll('*'));
    var sizes = els.map(function (el) { return parseFloat(getComputedStyle(el).fontSize); });
    els.forEach(function (el, i) { el.style.fontSize = (sizes[i] * factor) + 'px'; });
    var box = sc.getBoundingClientRect();
    var bad = [];
    if (sc.scrollWidth > sc.clientWidth) {
      var widest = null;
      var widestRight = -1;
      sc.querySelectorAll('*').forEach(function (el) {
        if (el.closest('svg')) return;
        var right = el.getBoundingClientRect().right - box.left;
        if (right > widestRight) { widestRight = right; widest = el; }
      });
      bad.push('horizontal scroll ' + sc.scrollWidth + ' > ' + sc.clientWidth + ' (widest: ' + (widest ? (widest.getAttribute('data-fid') || widest.className || widest.tagName) + ' ' + widest.tagName + ' right=' + Math.round(widestRight) : 'none') + ')');
    }
    sc.querySelectorAll('*').forEach(function (el) {
      if (el.classList.contains('sr-only') || el.closest('svg')) return;
      var r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      // Text wider than its own box (e.g. a long word in a nowrap button) does not show up in any rect.
      if (el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflowX === 'visible' && el.children.length === 0) bad.push('text overflows ' + (el.getAttribute('data-fid') || el.className || el.tagName) + ' ' + el.scrollWidth + '>' + el.clientWidth + ' "' + el.textContent.trim().slice(0, 24) + '"');
      if (r.right > box.right + 1 || r.left < box.left - 1) bad.push((el.getAttribute('data-fid') || el.className || el.tagName) + ' ' + Math.round(r.left - box.left) + '..' + Math.round(r.right - box.left));
    });
    els.forEach(function (el) { el.style.fontSize = ''; });
    ok(!bad.length, label + ': nothing is cut off at ' + Math.round(factor * 100) + '% text' + (bad.length ? ' -> ' + bad.slice(0, 4).join('; ') : ''));
  }

  var SWEEP = ['onboarding', 'login', 'home', 'select', 'status', 'map', 'tools', 'donate', 'profile', 'volJoin', 'volHub', 'volNeed', 'volTask'];

  function sweep(label, narrow) {
    var device = q('.device-phone');
    if (narrow) device.style.inlineSize = narrow + 'px';
    SWEEP.forEach(function (id) {
      click('panel', 'jump-' + id);
      if (narrow) audit(label + ' ' + id + ' @' + (narrow - 20) + 'px');
      else { auditLarge(label + ' ' + id, 1.5); auditLarge(label + ' ' + id, 2); }
    });
    if (narrow) device.style.inlineSize = '';
  }

  async function run() {
    var tr = I18N.tr;

    // ----- Onboarding -----
    click('panel', 'jump-onboarding');
    click('panel', 'setLang-tr');
    ok(screenId() === 'onboarding', 'starts on onboarding');
    audit('onboarding step 1');
    auditWatch('watch home');
    click('phone', 'setLang-ar');
    ok(document.documentElement.dir === 'rtl' && document.documentElement.lang === 'ar', 'choosing Arabic switches the document to RTL');
    ok(focusFid() === 'setLang-ar', 'focus stays on the language button after re-render');
    click('phone', 'setLang-tr');
    ok(document.documentElement.dir === 'ltr', 'choosing Turkish switches back to LTR');
    click('phone', 'onbNext');
    ok(focusFid() === 'screen-title', 'focus moves to the screen title on step change');
    audit('onboarding step 2');
    click('phone', 'togglePerm-location');
    ok(control('phone', 'togglePerm-location').getAttribute('aria-checked') === 'true', 'permission switch reports checked');
    click('phone', 'onbDone');
    ok(!!q('#kvkk-error') && screenId() === 'onboarding', 'continuing without consent shows an inline error and stays');
    ok(focusFid() === 'kvkk', 'focus moves to the consent checkbox');
    q('[data-fid="kvkk"]').click();
    click('phone', 'onbDone');
    ok(screenId() === 'login', 'consent given -> login');

    // ----- Login -----
    audit('login step 1');
    submit();
    ok(!!q('#phone-error') && q('#f-phone').getAttribute('aria-invalid') === 'true', 'empty phone -> inline error tied to the field');
    ok(document.activeElement === q('#f-phone'), 'focus moves to the invalid phone field');
    type('#f-phone', '532 111 22 33');
    submit();
    ok(!!q('#f-code') && document.activeElement === q('#f-code'), 'valid phone -> code step with focus in the code field');
    audit('login step 2');
    type('#f-code', '12');
    submit();
    ok(!!q('#code-error'), 'short code -> inline error');
    type('#f-code', '123456');
    submit();
    ok(screenId() === 'home', 'valid code -> home');

    // ----- Help report -----
    audit('home');
    q('#screen').scrollTop = 120;
    var scrolled = q('#screen').scrollTop;
    click('phone', 'needHelp');
    ok(screenId() === 'select', '"I need help" opens disaster selection');
    audit('select');
    click('phone', 'back');
    ok(screenId() === 'home' && q('#screen').scrollTop === scrolled, 'back restores the previous scroll position (' + scrolled + 'px)');
    click('phone', 'needHelp');
    click('phone', 'pickType-quake');
    ok(screenId() === 'status' && phoneText().indexOf(tr['status.sentTitle']) !== -1, 'picking a type sends the report (2 taps)');
    audit('status (sent)');
    auditWatch('watch status');
    click('phone', 'detail-injured_yes');
    ok(control('phone', 'detail-injured_yes').getAttribute('aria-pressed') === 'true' && focusFid() === 'detail-injured_yes', 'detail choice is pressed and keeps focus');
    click('phone', 'people-1');
    ok(q('.stepper-val').textContent === '2', 'people stepper increments');
    click('phone', 'undoReport');
    ok(!!q('.dialog') && q('#screen').hasAttribute('inert'), 'undo opens a confirm dialog and makes the screen inert');
    ok(focusFid() === 'closeDialog', 'dialog focuses the safe choice ("keep the report")');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    ok(!q('.dialog') && focusFid() === 'undoReport', 'Escape closes the dialog and returns focus to its opener');
    click('phone', 'undoReport');
    click('phone', 'confirmUndo');
    ok(screenId() === 'home' && toastText().length > 0, 'confirming removes the report, returns home and announces it');

    // ----- Offline queue -----
    click('panel', 'setNet-offline');
    click('phone', 'imSafe');
    ok(phoneText().indexOf(tr['status.queuedTitle']) !== -1, 'offline report is shown as saved, not failed');
    audit('status (queued)');
    click('phone', 'go-home');
    ok(phoneText().indexOf(tr['net.offline']) !== -1 && /1/.test(q('.banner-q') ? q('.banner-q').textContent : ''), 'home shows offline banner with 1 queued report');
    click('panel', 'setNet-online');
    ok(app.state.reports[app.state.reports.length - 1].state === 'sent' && toastText().length > 0, 'network return sends the queue and announces it');

    // ----- Weak network: sending -> sent -----
    click('panel', 'setNet-weak');
    click('phone', 'imSafe');
    ok(phoneText().indexOf(tr['status.sendingTitle']) !== -1, 'weak network shows "sending"');
    audit('status (sending)');
    await wait(2700);
    ok(phoneText().indexOf(tr['status.sentTitle']) !== -1, '"sending" resolves to "sent"');
    click('panel', 'setNet-online');

    // ----- Countdown -----
    click('phone', 'go-profile');
    q('#screen').scrollTop = 200;
    var profileScroll = q('#screen').scrollTop;
    click('panel', 'setSpeed-10');
    click('panel', 'simulate-quake');
    ok(screenId() === 'countdown' && !q('.bottom-nav'), 'sensor trigger opens the countdown without bottom navigation');
    ok(focusFid() === 'cdCancel', 'countdown focuses the cancel button');
    ok(!!q('#w-cd-num'), 'watch shows the countdown too');
    audit('countdown');
    auditWatch('watch countdown');
    await wait(1100);
    ok(Number(q('#cd-num').textContent) < 60 && q('#cd-num').textContent === q('#w-cd-num').textContent, 'phone and watch count down together (' + q('#cd-num').textContent + ')');
    click('watch', 'cdCancel');
    ok(screenId() === 'profile' && q('#screen').scrollTop === profileScroll, 'cancelling from the watch returns to the previous screen and scroll position');
    ok(!app.state.countdown && toastText().length > 0, 'cancel stops the timer and announces that nothing was sent');
    var before = app.state.reports.length;
    click('panel', 'simulate-crash');
    await wait(6600);
    var last = app.state.reports[app.state.reports.length - 1];
    ok(screenId() === 'status' && app.state.reports.length === before + 1 && last.auto && last.type === 'crash', 'unanswered countdown sends an automatic help report');
    ok(phoneText().indexOf(tr['status.auto']) !== -1, 'status explains it was sent automatically');
    click('panel', 'setSpeed-1');

    // ----- AFAD dialog -----
    click('phone', 'go-home');
    click('phone', 'showAfad');
    ok(!!q('.dialog[role="alertdialog"]') && app.state.watch === 'alert', 'AFAD alert opens on phone and watch');
    auditWatch('watch alert');
    var dialogSmall = [];
    q('.dialog').querySelectorAll('button').forEach(function (b) { var r = b.getBoundingClientRect(); if (r.width < 47.5 || r.height < 47.5) dialogSmall.push(b.getAttribute('data-fid')); });
    ok(!dialogSmall.length, 'AFAD dialog targets >= 48px' + (dialogSmall.length ? ' -> ' + dialogSmall.join(', ') : ''));
    click('phone', 'closeDialog');
    ok(!q('.dialog') && focusFid() === 'showAfad' && app.state.watch === 'home', 'closing returns focus to the bell and clears the watch alert');

    // ----- Sudden fall -----
    click('panel', 'simulate-fall');
    ok(screenId() === 'countdown' && phoneText().indexOf(tr['cd.fall']) !== -1, 'fall detection opens the countdown with its own title');
    ok(q('#watch-view').textContent.indexOf(tr['cd.fall']) !== -1, 'the watch names the fall as the cause');
    audit('countdown (fall)');
    auditWatch('watch countdown (fall)');
    click('phone', 'cdCancel');
    click('phone', 'go-home');
    click('phone', 'needHelp');
    ok(!!control('phone', 'pickType-fall') && !!control('phone', 'pickType-quake') && !!control('phone', 'pickType-crash') && !!control('phone', 'pickType-fire'), 'disaster selection offers quake, crash, fall and fire');
    audit('select (4 types)');
    click('phone', 'back');

    // ----- Volunteer -----
    click('phone', 'volStart');
    ok(screenId() === 'volJoin', 'the Home entry opens sign-up for a new volunteer');
    audit('volunteer join');
    click('phone', 'volRole-rescue');
    ok(control('phone', 'volRole-rescue').getAttribute('aria-pressed') === 'true' && focusFid() === 'volRole-rescue', 'role choice is pressed and keeps focus');
    click('phone', 'volJoin');
    ok(screenId() === 'volHub' && toastText().length > 0, 'joining opens the hub and announces it');
    audit('volunteer hub');
    ok(control('phone', 'volAvail').getAttribute('aria-checked') === 'true' && phoneText().indexOf(tr['vol.urgency']) !== -1, 'available: the needs list states urgency in words, not colour only');
    click('phone', 'volAvail');
    ok(!control('phone', 'volNeed-water') && phoneText().indexOf(tr['vol.unavailable']) !== -1, 'unavailable: the list is hidden and the reason is written');
    click('phone', 'volAvail');
    click('phone', 'volNeed-water');
    ok(screenId() === 'volNeed', 'a need opens its detail');
    audit('volunteer need');
    click('panel', 'setNet-offline');
    click('phone', 'volAccept');
    ok(screenId() === 'volTask' && app.state.vol.task.state === 'queued' && phoneText().indexOf(tr['vol.taskQueued']) !== -1, 'offline: accepting is saved as queued, not shown as an error');
    audit('volunteer task (queued)');
    click('phone', 'go-volHub');
    ok(phoneText().indexOf(tr['vol.taskWaiting']) !== -1, 'the offline hub shows the waiting acceptance');
    audit('volunteer hub (offline)');
    click('panel', 'setNet-online');
    ok(app.state.vol.task.state === 'sent' && toastText().length > 0, 'network return sends the accepted task and announces it');
    click('phone', 'go-volTask');
    click('phone', 'volDone');
    ok(!!q('.dialog[role="alertdialog"]') && !app.state.vol.task.done && q('#screen').hasAttribute('inert'), 'completing a task asks for confirmation first and does not complete it yet');
    ok(focusFid() === 'closeDialog', 'the safe answer ("no, keep the task") has the focus');
    var doneSmall = [];
    q('.dialog').querySelectorAll('button').forEach(function (b) { var r = b.getBoundingClientRect(); if (r.width < 47.5 || r.height < 47.5) doneSmall.push(b.getAttribute('data-fid')); });
    ok(!doneSmall.length, 'confirmation dialog targets >= 48px' + (doneSmall.length ? ' -> ' + doneSmall.join(', ') : ''));
    click('phone', 'closeDialog');
    ok(!q('.dialog') && !app.state.vol.task.done && focusFid() === 'volDone', 'declining keeps the task open and returns focus to the button');
    click('phone', 'volDone');
    click('phone', 'volDoneConfirm');
    ok(phoneText().indexOf(tr['vol.taskDone']) !== -1 && app.state.vol.task.done && !q('.dialog'), 'confirming marks the task done');
    audit('volunteer task (done)');
    click('phone', 'go-volHub');
    click('phone', 'back');
    ok(screenId() === 'home', 'back from the hub returns to where the volunteer flow started');
    click('phone', 'go-profile');
    click('phone', 'volStart');
    ok(screenId() === 'volHub', 'the Profile entry opens the hub for a registered volunteer');
    click('phone', 'back');
    ok(screenId() === 'profile', 'back from the hub returns to Profile');

    // ----- Map, tools, donate, profile -----
    click('phone', 'go-map');
    audit('map');
    click('phone', 'toggleRoute');
    ok(!!q('.m-route'), 'starting the route draws it on the map');
    click('phone', 'pickArea-2');
    ok(control('phone', 'pickArea-2').getAttribute('aria-pressed') === 'true', 'another assembly area can be selected');
    click('phone', 'go-tools');
    audit('tools');
    click('phone', 'toggleSiren');
    ok(control('phone', 'toggleSiren').getAttribute('aria-pressed') === 'true' && phoneText().indexOf(tr['tools.sirenOn']) !== -1, 'siren state is shown as text, not colour only');
    audit('tools (siren on)');
    click('phone', 'toggleSiren');
    click('phone', 'go-donate');
    audit('donate');
    type('#f-custom', '5');
    click('phone', 'donateConfirm');
    ok(!!q('#custom-error') && document.activeElement === q('#f-custom'), 'amount below minimum -> inline error and focus on the field');
    var field = q('#f-custom').getBoundingClientRect();
    var frame = q('#screen').getBoundingClientRect();
    ok(field.top >= frame.top && field.bottom <= frame.bottom, 'the invalid field is scrolled into view, not hidden above the fold');
    type('#f-custom', '75');
    click('phone', 'donateConfirm');
    ok(control('phone', 'donateConfirm').getAttribute('aria-disabled') === 'true' && phoneText().indexOf(tr['donate.processing']) !== -1, 'confirm shows a processing state and blocks double submit');
    click('phone', 'donateConfirm');
    await wait(1400);
    ok(phoneText().indexOf(tr['donate.doneTitle']) !== -1 && phoneText().indexOf('75') !== -1, 'donation completes once with the custom amount');
    audit('donate (receipt)');
    click('phone', 'donateAgain');
    click('panel', 'setNet-offline');
    ok(control('phone', 'donateConfirm').disabled && phoneText().indexOf(tr['donate.offline']) !== -1, 'offline: donate is disabled and the reason is explained');
    click('panel', 'setNet-online');
    click('phone', 'go-profile');
    audit('profile');

    // ----- Arabic + dark: every screen again -----
    click('phone', 'setLang-ar');
    click('phone', 'setTheme-dark');
    ok(document.documentElement.dir === 'rtl' && document.documentElement.getAttribute('data-theme') === 'dark', 'profile settings switch language and theme');
    ['home', 'map', 'tools', 'donate', 'profile'].forEach(function (id) {
      click('phone', 'go-' + id);
      audit('ar/dark ' + id);
    });
    click('phone', 'go-home');
    click('phone', 'needHelp');
    audit('ar/dark select');
    click('phone', 'pickType-fire');
    audit('ar/dark status');
    click('panel', 'jump-onboarding');
    audit('ar/dark onboarding 1');
    click('phone', 'onbNext');
    audit('ar/dark onboarding 2');
    click('panel', 'jump-login');
    audit('ar/dark login');
    click('panel', 'jump-volJoin');
    audit('ar/dark volunteer join');
    click('panel', 'jump-volHub');
    audit('ar/dark volunteer hub');
    click('phone', 'volNeed-aid');
    audit('ar/dark volunteer need');
    click('phone', 'volAccept');
    audit('ar/dark volunteer task');
    click('panel', 'simulate-fall');
    audit('ar/dark countdown (fall)');
    click('phone', 'cdCancel');
    click('panel', 'jump-countdown');
    audit('ar/dark countdown');
    click('phone', 'cdCancel');

    // ----- Checklist gaps: largest text, and a 320px-wide phone (inner width), in both languages -----
    click('phone', 'go-profile');
    click('phone', 'setTheme-light');
    ['ar', 'tr'].forEach(function (lang) {
      click('panel', 'setLang-' + lang);
      sweep(lang + ' large text');
      sweep(lang + ' narrow', 340);
    });
  }

  function report(error) {
    if (error) results.push('FAIL  self-test crashed: ' + (error && error.message ? error.message : error));
    var failed = results.filter(function (r) { return r.indexOf('FAIL') === 0; }).length;
    var summary = 'SELFTEST ' + (failed ? 'FAILED' : 'PASSED') + ': ' + (results.length - failed) + ' passed, ' + failed + ' failed';
    var pre = document.createElement('pre');
    pre.id = 'selftest-report';
    pre.dir = 'ltr';
    pre.style.cssText = 'margin:24px;padding:16px;white-space:pre-wrap;font:13px/1.5 monospace;background:var(--surface);color:var(--text);border:2px solid var(--border-strong);border-radius:12px';
    pre.textContent = summary + '\n' + results.join('\n');
    document.body.appendChild(pre);
    document.title = summary;
  }

  run().then(function () { report(null); }, report);
})();
