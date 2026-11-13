/* YaşamHattı ops dashboard: design mockup. Vanilla JS, hash routes, TR/AR (RTL), light/dark. Sample data only. */
(function () {
  'use strict';
  const D = window.DATA;
  const S = {
    lang: 'tr', theme: 'light', route: 'overview', live: true, chartTable: false,
    sel: null,                      // selected report id (drawer)
    f: { q: '', type: '', kind: '', del: '', ops: '', injured: false, trapped: false },
    layers: { help: true, safe: true, areas: true, needs: true, centers: true }, pin: null,
    cdr: null,                      // center drawer: { mode, id, step, v, err, pass }
    confirm: null,                  // { kind: 'delete', id }
    sugSel: [], sugFor: null,       // report drawer: selected suggested centers
    cp: { center: 'c1', sel: null, net: true, notif: 'off', sound: true, confirmDone: false }
  };
  try { const p = JSON.parse(localStorage.getItem('yh-dash') || '{}'); if (p.lang) S.lang = p.lang; if (p.theme) S.theme = p.theme; } catch (e) { /* storage may be blocked */ }
  const q = new URLSearchParams(location.search);
  if (q.get('lang')) S.lang = q.get('lang');
  if (q.get('theme')) S.theme = q.get('theme');
  if (q.get('live') === '0') S.live = false;

  const $ = (s, r) => (r || document).querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const t = (k, v) => {
    let s = (I18N[S.lang] && I18N[S.lang][k]) || I18N.tr[k] || k;
    if (v) for (const n in v) s = s.replace('{' + n + '}', v[n]);
    return s;
  };
  const icon = (n, cls) => `<svg class="ic ${cls || ''}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ''}</svg>`;
  const num = n => `<span class="num">${n}</span>`;
  const save = () => { try { localStorage.setItem('yh-dash', JSON.stringify({ lang: S.lang, theme: S.theme })); } catch (e) { /* ignore */ } };

  const INC_ICON = { quake: 'quake', crash: 'car', fall: 'fall', fire: 'flame', other: 'alert' };
  const DEL_ICON = { sent: 'check', queued: 'clock', sending: 'sync' };
  const OPS_ICON = { new: 'bell', dispatched: 'route', resolved: 'checkCircle' };
  const NEED_ICON = { aid: 'firstAid', water: 'drop', shelter: 'tent' };
  const ROLE_ICON = { aid: 'firstAid', rescue: 'lifebuoy', logistics: 'box' };
  const CT_ICON = { fire: 'truck', rescue: 'helmet', sar: 'search', ems: 'ambulance' };
  const CSTAT_ICON = { ready: 'check', busy: 'clock', offline: 'wifiOff' };
  const ASTAT_ICON = { notified: 'bell', accepted: 'check', enroute: 'route', arrived: 'pin', done: 'checkCircle', declined: 'close' };
  const FLOW = ['notified', 'accepted', 'enroute', 'arrived', 'done'];
  const LG = window.LOGIC;
  const center = id => D.centers.find(c => c.id === id);
  const ctypeIco = ty => `<span class="ctype-ico">${icon(CT_ICON[ty])}</span>`;
  const ctypeCell = ty => `<span class="cell">${icon(CT_ICON[ty])}${t('ctype.' + ty)}</span>`;
  const cstatBadge = s => `<span class="badge ${s === 'ready' ? 'safe' : s === 'busy' ? 'warn' : ''}">${icon(CSTAT_ICON[s], 'sm')}${t('cstat.' + s)}</span>`;
  const astatBadge = s => `<span class="badge ${s === 'done' ? 'safe' : s === 'declined' ? 'warn' : s === 'notified' ? 'warn' : 'info'}">${icon(ASTAT_ICON[s], 'sm')}${t('astat.' + s)}</span>`;
  const openCount = c => D.reports.reduce((n, r) => n + r.assign.filter(a => a.c === c.id && a.s !== 'done' && a.s !== 'declined').length, 0);

  /* ---------- small components: every state = icon + text ---------- */
  const typeCell = r => r.kind === 'safe'
    ? `<span class="cell">${icon('shieldCheck')}${t('kind.safe')}</span>`
    : `<span class="cell">${icon(INC_ICON[r.type])}${t('inc.' + r.type)}</span>`;
  const delBadge = s => `<span class="badge ${s === 'sent' ? 'safe' : 'warn'}">${icon(DEL_ICON[s], 'sm')}${t('del.' + s)}</span>`;
  const opsBadge = o => `<span class="badge ${o === 'new' ? 'solid-danger' : o === 'dispatched' ? 'info' : ''}">${icon(OPS_ICON[o], 'sm')}${t('ops.' + o)}</span>`;
  const flags = r => {
    const o = [];
    if (r.injured) o.push(`<span class="badge danger">${icon('firstAid', 'sm')}${t('flag.injured')}</span>`);
    if (r.trapped) o.push(`<span class="badge danger">${icon('alert', 'sm')}${t('flag.trapped')}</span>`);
    if (r.auto) o.push(`<span class="badge">${icon('sensor', 'sm')}${t('flag.auto')}</span>`);
    return o.length ? `<span class="flags">${o.join('')}</span>` : `<span class="muted">${t('flag.none')}</span>`;
  };
  const urgency = u => `<span class="cell"><span class="dots u${u}" aria-hidden="true">${[1, 2, 3].map(i => `<i class="${i <= u ? 'on' : ''}"></i>`).join('')}</span>${t('urg.' + u)}</span>`;
  const ago = m => t('feed.ago', { n: m });
  const kpi = (ico, tone, label, val, sub) => `<div class="card kpi"><div class="kpi-top"><span class="kpi-ico ${tone}">${icon(ico)}</span>${label}</div><div class="kpi-val">${num(val)}</div><div class="kpi-sub">${sub}</div></div>`;

  /* ---------- pages ---------- */
  function chart() {
    const w = 640, h = 200, pl = 30, pb = 24, pt = 20, max = 36, bw = 32, gap = (w - pl - 8 - 12 * bw) / 11;
    let bars = '', grid = '';
    [0, 12, 24, 36].forEach(v => { const y = pt + (h - pt - pb) * (1 - v / max); grid += `<line class="grid-l" x1="${pl}" x2="${w}" y1="${y}" y2="${y}"/><text x="${pl - 6}" y="${y + 4}" text-anchor="end">${v}</text>`; });
    D.hourly.forEach((v, i) => {
      const x = pl + i * (bw + gap), bh = (h - pt - pb) * (v / max), y = h - pb - bh, last = i === 11;
      bars += `<rect class="bar" x="${x}" y="${y}" width="${bw}" height="${bh}" rx="4"/><text class="val" x="${x + bw / 2}" y="${y - 5}" text-anchor="middle">${v}</text>`;
      bars += `<text x="${x + bw / 2}" y="${h - 6}" text-anchor="middle" direction="ltr" unicode-bidi="isolate">${last ? t('chart.now') : '−' + (11 - i) + (S.lang === 'ar' ? ' س' : ' s')}</text>`;
    });
    const svg = `<svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="${t('ov.hourly')}"><title>${t('ov.hourly')}</title>${grid}${bars}</svg>`;
    const tbl = `<div class="tbl-wrap"><table><thead><tr><th>${t('chart.hour')}</th><th>${t('chart.count')}</th></tr></thead><tbody>${D.hourly.map((v, i) => `<tr style="cursor:default"><td>${i === 11 ? t('chart.now') : '-' + (11 - i)}</td><td>${num(v)}</td></tr>`).join('')}</tbody></table></div>`;
    return S.chartTable ? tbl : svg;
  }
  function byType() {
    const c = {}; D.reports.filter(r => r.kind === 'help').forEach(r => c[r.type] = (c[r.type] || 0) + 1);
    const m = Math.max(...Object.values(c));
    return `<div class="hbars">${Object.keys(c).sort((a, b) => c[b] - c[a]).map(k => `<div class="hbar">${icon(INC_ICON[k])}<span>${t('inc.' + k)}</span><span class="track"><span class="fill" style="inline-size:${c[k] / m * 100}%"></span></span><b>${num(c[k])}</b></div>`).join('')}</div>`;
  }
  function feedHtml(list) {
    return `<ul class="feed" aria-live="${S.live ? 'polite' : 'off'}">${list.map(r => `<li class="${r._fresh ? 'fresh' : ''}"><span class="ev-ico ${r.kind === 'safe' ? 'safe' : ''}">${icon(r.kind === 'safe' ? 'shieldCheck' : INC_ICON[r.type])}</span><div><div class="t">${r.kind === 'safe' ? t('kind.safe') : t('inc.' + r.type)} · ${esc(r.district)}</div><div class="m">${ago(r.min)} ${delBadge(r.state)}</div></div><button class="btn icon-only" data-open="${r.id}" aria-label="${t('dr.title', { n: r.id })}">${icon('chevron', 'flip')}</button></li>`).join('')}</ul>`;
  }
  function kpis() {
    const help = D.reports.filter(r => r.kind === 'help' && r.ops !== 'resolved');
    const urgentN = D.needs.filter(n => n.urgency >= 2).length;
    return `<div class="grid g-kpi">
      ${kpi('lifebuoy', 'danger', t('kpi.active'), help.length, `${icon('bell', 'sm')}${t('kpi.activeSub', { n: help.filter(r => r.ops === 'new').length })}`)}
      ${kpi('shieldCheck', 'safe', t('kpi.safe'), D.reports.filter(r => r.kind === 'safe').length, `${icon('clock', 'sm')}${t('kpi.safeSub')}`)}
      ${kpi('clock', 'warn', t('kpi.queued'), D.reports.filter(r => r.state !== 'sent').length, `${icon('wifiOff', 'sm')}${t('kpi.queuedSub')}`)}
      ${kpi('users', 'info', t('kpi.vol'), D.volunteersActive, `${icon('route', 'sm')}${t('kpi.volSub', { n: D.tasks.filter(x => !x.done).length })}`)}
      ${kpi('drop', 'warn', t('kpi.urgent'), urgentN, `${icon('alert', 'sm')}${t('kpi.urgentSub')}`)}
    </div>`;
  }
  function pageOverview() {
    const recent = D.reports.slice().sort((a, b) => a.min - b.min).slice(0, 7);
    const needs = D.needs.slice().sort((a, b) => b.urgency - a.urgency).slice(0, 4);
    return `${kpis()}
    <div class="grid g-2-1">
      <div class="grid" style="align-content:start">
        <section class="card" aria-labelledby="h-hourly"><div class="card-h"><div><h2 id="h-hourly">${t('ov.hourly')}</h2><div class="hint">${t('ov.hourlySub')}</div></div><span class="grow"></span>
          <button class="btn" id="toggle-chart" aria-pressed="${S.chartTable}">${icon(S.chartTable ? 'chevron' : 'clipboard')}${S.chartTable ? t('chart.chart') : t('chart.table')}</button></div>${chart()}</section>
        <div class="grid g-1-1">
          <section class="card" aria-labelledby="h-type"><div class="card-h"><h2 id="h-type">${t('ov.byType')}</h2></div>${byType()}</section>
          <section class="card" aria-labelledby="h-needs"><div class="card-h"><h2 id="h-needs">${t('ov.needs')}</h2></div>
            <ul class="feed">${needs.map(n => `<li style="grid-template-columns:36px 1fr auto"><span class="ev-ico" style="background:var(--warn-soft);color:var(--warn-text)">${icon(NEED_ICON[n.need])}</span><div><div class="t">${t('need.' + n.need)} · ${esc(n.district)}</div><div class="m">${urgency(n.urgency)}</div></div><span class="muted">${t('unit.m', { n: num(n.meters) })}</span></li>`).join('')}</ul></section>
        </div>
      </div>
      <section class="card" aria-labelledby="h-feed" style="align-self:start"><div class="card-h"><h2 id="h-feed">${t('ov.feed')}</h2><span class="grow"></span><span class="badge ${S.live ? 'safe' : 'warn'}">${icon(S.live ? 'wifi' : 'clock', 'sm')}${S.live ? t('live.on') : t('live.paused')}</span></div>${feedHtml(recent)}<a class="btn" style="margin-block-start:12px;inline-size:100%" href="#reports">${t('feed.openAll')}${icon('chevron', 'flip')}</a></section>
    </div>`;
  }

  function filtered() {
    const f = S.f, qq = f.q.trim().toLowerCase();
    return D.reports.filter(r =>
      (!qq || String(r.id).includes(qq) || r.district.toLowerCase().includes(qq)) &&
      (!f.type || (f.type === 'safe' ? r.kind === 'safe' : r.type === f.type)) &&
      (!f.kind || r.kind === f.kind) && (!f.del || r.state === f.del) && (!f.ops || r.ops === f.ops) &&
      (!f.injured || r.injured) && (!f.trapped || r.trapped)).sort((a, b) => a.min - b.min);
  }
  function assignCell(r) {
    if (r.kind !== 'help') return `<span class="muted">—</span>`;
    if (!r.assign.length) return `<span class="muted">${t('rep.noCenters')}</span>`;
    const types = [...new Set(r.assign.map(a => center(a.c).type))];
    return `<span class="cell">${types.map(ty => icon(CT_ICON[ty], 'sm')).join('')}${t('rep.centersN', { n: r.assign.length })}</span>`;
  }
  function reportRows() {
    const list = filtered();
    $('#rep-count') && ($('#rep-count').textContent = t('rep.results', { n: list.length }));
    if (!list.length) return `<tr style="cursor:default"><td colspan="9" class="muted" style="padding:32px;text-align:center">${icon('search')} ${t('rep.empty')}</td></tr>`;
    return list.map(r => `<tr tabindex="0" data-open="${r.id}" aria-selected="${S.sel === r.id}">
      <td><b>${num('#' + r.id)}</b></td><td>${typeCell(r)}</td><td>${ago(r.min)}</td><td>${esc(r.district)}</td><td>${num(r.people)}</td>
      <td>${flags(r)}</td><td>${delBadge(r.state)}</td><td>${assignCell(r)}</td><td>${opsBadge(r.ops)}</td></tr>`).join('');
  }
  function sel(id, label, opts, val) {
    return `<label class="field"><span>${label}</span><select class="select" id="${id}"><option value="">${t('rep.all')}</option>${opts.map(o => `<option value="${o[0]}" ${val === o[0] ? 'selected' : ''}>${o[1]}</option>`).join('')}</select></label>`;
  }
  function pageReports() {
    const f = S.f;
    return `<section class="card" aria-labelledby="h-rep"><div class="filters">
      <label class="field grow"><span>${t('rep.search')}</span><span class="input-wrap">${icon('search')}<input class="input" id="f-q" type="search" value="${esc(f.q)}"></span></label>
      ${sel('f-type', t('rep.type'), ['quake', 'crash', 'fall', 'fire', 'other'].map(k => [k, t('inc.' + k)]), f.type)}
      ${sel('f-del', t('rep.del'), ['sent', 'queued', 'sending'].map(k => [k, t('del.' + k)]), f.del)}
      ${sel('f-ops', t('rep.ops'), ['new', 'dispatched', 'resolved'].map(k => [k, t('ops.' + k)]), f.ops)}
      <div class="layer-toggles"><button class="chip" id="f-injured" aria-pressed="${f.injured}">${icon('firstAid', 'sm')}${t('rep.injured')}</button><button class="chip" id="f-trapped" aria-pressed="${f.trapped}">${icon('alert', 'sm')}${t('rep.trapped')}</button></div>
    </div><h2 id="h-rep" class="sr-only">${t('rep.title')}</h2><div class="result-count" id="rep-count" style="margin-block:12px 8px"></div>
    <div class="tbl-wrap"><table><thead><tr><th>${t('col.id')}</th><th>${t('col.type')}</th><th>${t('col.time')}</th><th>${t('col.district')}</th><th>${t('col.people')}</th><th>${t('col.notes')}</th><th>${t('col.del')}</th><th>${t('col.centers')}</th><th>${t('col.ops')}</th></tr></thead><tbody id="rep-body">${reportRows()}</tbody></table></div></section>`;
  }

  function pins() {
    const L = S.layers; let h = '';
    if (L.help) D.reports.filter(r => r.kind === 'help' && r.ops !== 'resolved').forEach(r => h += pin('r' + r.id, r.x, r.y, 'pulse' + (r.ops === 'new' ? '' : ''), INC_ICON[r.type], t('inc.' + r.type) + ' · ' + r.district));
    if (L.safe) D.reports.filter(r => r.kind === 'safe').forEach(r => h += pin('r' + r.id, r.x, r.y, 'safe', 'check', t('kind.safe') + ' · ' + r.district));
    if (L.areas) D.areas.forEach(a => h += pin('a' + a.number, a.x, a.y, 'area', 'tent', t('ar.title') + ' ' + a.number + ' · ' + a.name));
    if (L.needs) D.needs.forEach((n, i) => h += pin('n' + i, n.x, n.y, 'need', NEED_ICON[n.need], t('need.' + n.need) + ' · ' + n.district));
    if (L.centers) D.centers.forEach(c => h += pin('k' + c.id, c.x, c.y, 'center ' + c.status, CT_ICON[c.type], t('ctype.' + c.type) + ' · ' + c.name + ' · ' + t('cstat.' + c.status)));
    return h;
  }
  function pin(key, x, y, cls, ic, label) {
    return `<button class="pin ${cls}" style="left:${x}%;top:${y}%" data-pin="${key}" aria-pressed="${S.pin === key}" aria-label="${esc(label)}"><span>${icon(ic, 'sm')}</span></button>`;
  }
  function mapBg() {
    return `<svg class="map-svg" viewBox="0 0 1000 625" preserveAspectRatio="none" aria-hidden="true">
      <path class="water" d="M0 300 C180 280 300 330 470 300 C620 270 700 190 1000 210 L1000 255 C720 235 640 320 480 350 C320 380 190 330 0 360 Z"/>
      ${[0, 1, 2, 3, 4, 5, 6, 7].map(i => [0, 1, 2, 3, 4].map(j => `<rect class="block" x="${30 + i * 120}" y="${24 + j * 118}" width="92" height="84" rx="6"/>`).join('')).join('')}
      <path class="road main" d="M0 120 L1000 160 M0 520 L1000 470 M250 0 L330 625 M700 0 L640 625"/>
      <path class="road" d="M0 60 L1000 90 M0 440 L1000 420 M120 0 L160 625 M480 0 L470 625 M860 0 L830 625"/>
      <text x="520" y="318">Boğaz</text></svg>`;
  }
  function pinInfo() {
    if (!S.pin) return `<p class="muted">${icon('info')} ${t('map.pick')}</p>`;
    const k = S.pin[0], id = S.pin.slice(1);
    if (k === 'r') { const r = D.reports.find(x => String(x.id) === id); return `<div class="grid"><div class="cell"><b>${typeCell(r)}</b>${opsBadge(r.ops)}</div>${flags(r)}<div class="kv-row"><span>${t('col.district')}</span><b>${esc(r.district)}</b></div><div class="kv-row"><span>${t('col.time')}</span><b>${ago(r.min)}</b></div><div class="kv-row"><span>${t('col.people')}</span><b>${num(r.people)}</b></div><button class="btn primary" data-open="${r.id}">${t('dr.title', { n: r.id })}${icon('chevron', 'flip')}</button></div>`; }
    if (k === 'a') { const a = D.areas.find(x => String(x.number) === id); return `<div class="grid"><b>${t('ar.title')} ${num(a.number)} · ${esc(a.name)}</b>${capBar(a)}<div class="kv-row"><span>${t('col.dist')}</span><b>${t('ar.walk', { m: num(a.meters), min: num(a.minutes) })}</b></div></div>`; }
    if (k === 'k') { const c = center(id); return `<div class="grid"><b class="cell">${icon(CT_ICON[c.type])}${esc(c.name)}</b><div class="flags">${cstatBadge(c.status)}<span class="badge">${ctypeCell(c.type)}</span></div><div class="kv-row"><span>${t('col.units')}</span><b>${num(c.units)}</b></div><div class="kv-row"><span>${t('col.phone')}</span><b dir="ltr">${esc(c.phone)}</b></div><div class="kv-row"><span>${t('cf.address')}</span><b>${esc(c.address)}</b></div><div class="kv-row"><span>${t('col.tasks')}</span><b>${num(openCount(c))}</b></div></div>`; }
    const n = D.needs[+id]; return `<div class="grid"><b class="cell">${icon(NEED_ICON[n.need])}${t('need.' + n.need)}</b>${urgency(n.urgency)}<div class="kv-row"><span>${t('col.district')}</span><b>${esc(n.district)}</b></div><div class="kv-row"><span>${t('col.dist')}</span><b>${t('unit.m', { n: num(n.meters) })}</b></div></div>`;
  }
  function pageMap() {
    const L = S.layers, chip = (k, ic) => `<button class="chip" data-layer="${k}" aria-pressed="${L[k]}">${icon(ic, 'sm')}${t('map.' + k)}</button>`;
    return `<div class="map-layout"><section class="card" aria-labelledby="h-map" style="padding:var(--sp-3)"><div class="card-h"><h2 id="h-map" class="sr-only">${t('map.title')}</h2><div class="layer-toggles" role="group" aria-label="${t('map.layers')}">${chip('help', 'lifebuoy')}${chip('safe', 'shieldCheck')}${chip('areas', 'tent')}${chip('needs', 'drop')}${chip('centers', 'building')}</div></div>
      <div class="map-box">${mapBg()}<div id="pins">${pins()}</div>
      <div class="map-legend" aria-label="${t('map.layers')}"><span><i class="ev-ico" style="inline-size:20px;block-size:20px;background:var(--danger);color:var(--on-danger)">${icon('lifebuoy', 'sm')}</i>${t('map.help')}</span><span>${icon('shieldCheck', 'sm')}${t('map.safe')}</span><span>${icon('tent', 'sm')}${t('map.areas')}</span><span>${icon('drop', 'sm')}${t('map.needs')}</span><span>${icon('building', 'sm')}${t('map.centers')}</span></div></div>
      <p class="hint" style="margin-block-start:8px">${t('map.note')}</p></section>
      <aside class="grid"><section class="card" aria-live="polite"><div class="card-h"><h2>${t('map.selected')}</h2></div><div id="pin-info">${pinInfo()}</div></section>
      <section class="card"><div class="card-h"><h2>${t('map.list')}</h2></div><ul class="side-list">${D.reports.filter(r => r.kind === 'help' && r.ops !== 'resolved').sort((a, b) => a.min - b.min).slice(0, 6).map(r => `<li><button data-pin="r${r.id}" aria-pressed="${S.pin === 'r' + r.id}"><span class="ev-ico">${icon(INC_ICON[r.type], 'sm')}</span><span><b>${t('inc.' + r.type)}</b><br><span class="hint">${esc(r.district)} · ${ago(r.min)}</span></span>${opsBadge(r.ops)}</button></li>`).join('')}</ul></section></aside></div>`;
  }

  function pageVolunteers() {
    const tot = Object.values(D.roles).reduce((a, b) => a + b, 0);
    return `<div class="grid g-2-1">
      <section class="card"><div class="card-h"><h2>${t('vol.needs')}</h2><span class="grow"></span><button class="btn primary" data-toast="1">${icon('plus')}${t('vol.add')}</button></div>
      <div class="tbl-wrap"><table><thead><tr><th>${t('col.need')}</th><th>${t('col.district')}</th><th>${t('col.dist')}</th><th>${t('col.urg')}</th></tr></thead><tbody>${D.needs.slice().sort((a, b) => b.urgency - a.urgency).map(n => `<tr style="cursor:default"><td><span class="cell">${icon(NEED_ICON[n.need])}<b>${t('need.' + n.need)}</b></span></td><td>${esc(n.district)}</td><td>${t('unit.m', { n: num(n.meters) })}</td><td>${urgency(n.urgency)}</td></tr>`).join('')}</tbody></table></div></section>
      <section class="card"><div class="card-h"><h2>${t('vol.roles')}</h2></div><div class="hbars">${Object.keys(D.roles).map(k => `<div class="hbar">${icon(ROLE_ICON[k])}<span>${t('role.' + k)}</span><span class="track"><span class="fill" style="inline-size:${D.roles[k] / tot * 100}%"></span></span><b>${num(D.roles[k])}</b></div>`).join('')}</div></section></div>
      <section class="card"><div class="card-h"><h2>${t('vol.tasks')}</h2></div>
      <div class="tbl-wrap"><table><thead><tr><th>${t('col.need')}</th><th>${t('col.vol')}</th><th>${t('col.time')}</th><th>${t('col.del')}</th><th>${t('col.state')}</th></tr></thead><tbody>${D.tasks.map(x => `<tr style="cursor:default"><td><span class="cell">${icon(NEED_ICON[x.need])}<b>${t('need.' + x.need)}</b></span></td><td>${num(x.vol)}</td><td>${ago(x.min)}</td><td>${delBadge(x.state)}</td><td>${x.done ? `<span class="badge safe">${icon('checkCircle', 'sm')}${t('vol.done')}</span>` : `<span class="badge info">${icon('route', 'sm')}${t('vol.accepted')}</span>`}</td></tr>`).join('')}</tbody></table></div></section>`;
  }
  function capBar(a) {
    const p = a.occupied / a.capacity, cls = p >= 1 ? 'full' : p >= .85 ? 'high' : '';
    return `<div class="cap"><div class="track"><span class="fill ${cls}" style="inline-size:${Math.min(p, 1) * 100}%"></span></div><span class="hint">${t('ar.of', { a: num(a.occupied), b: num(a.capacity) })}</span></div>`;
  }
  function pageAreas() {
    return `<section class="card"><div class="card-h"><h2>${t('ar.title')}</h2><span class="grow"></span><button class="btn primary" data-toast="1">${icon('plus')}${t('ar.add')}</button></div>
    <div class="tbl-wrap"><table><thead><tr><th>${t('col.area')}</th><th>${t('col.place')}</th><th>${t('col.dist')}</th><th>${t('col.cap')}</th><th>${t('col.open')}</th><th></th></tr></thead><tbody>${D.areas.map(a => {
      const p = a.occupied / a.capacity, b = p >= 1 ? `<span class="badge danger">${icon('alert', 'sm')}${t('ar.full')}</span>` : p >= .85 ? `<span class="badge warn">${icon('alert', 'sm')}${t('ar.high')}</span>` : `<span class="badge safe">${icon('check', 'sm')}${t('ar.open')}</span>`;
      return `<tr style="cursor:default"><td><b>${num(a.number)}</b></td><td><span class="cell">${icon('tent')}${esc(a.name)}</span></td><td>${t('ar.walk', { m: num(a.meters), min: num(a.minutes) })}</td><td>${capBar(a)}</td><td>${b}</td><td><button class="btn" data-toast="1">${icon('edit', 'sm')}${t('ar.edit')}</button></td></tr>`;
    }).join('')}</tbody></table></div></section>`;
  }
  function pageLogin() {
    return `<main class="login" id="main"><section class="login-card" aria-labelledby="h-login"><div class="login-tools"><div class="brand" style="padding:0"><span class="brand-mark">${icon('lifebuoy', 'lg')}</span><div><b>${t('app.name')}</b><small>${t('app.sub')}</small></div></div><div class="seg" role="group" aria-label="${t('lang.switch')}"><button data-lang="tr" aria-pressed="${S.lang === 'tr'}">TR</button><button data-lang="ar" aria-pressed="${S.lang === 'ar'}">AR</button></div></div>
      <div><h1 id="h-login" style="font:var(--text-headline)">${t('login.title')}</h1><p class="muted">${t('login.sub')}</p></div>
      <label class="field"><span>${t('login.email')}</span><input class="input" type="email" autocomplete="username" value="koordinator@ornek.org" dir="ltr"></label>
      <label class="field"><span>${t('login.pass')}</span><input class="input" type="password" autocomplete="current-password" value="••••••••••" dir="ltr"><span class="hint">${icon('lock', 'sm')} ${t('login.hint')}</span></label>
      <a class="btn primary" href="#overview" style="min-block-size:52px">${t('login.go')}</a>
      <a class="btn" href="#center" style="min-block-size:52px">${icon(CT_ICON.ems, 'sm')}${t('login.asCenter')}</a></section></main>`;
  }

  /* ---------- centers (admin) ---------- */
  function pageCenters() {
    return `<section class="card"><div class="card-h"><h2>${t('centers.title')}</h2><span class="grow"></span><button class="btn primary" data-cadd="1">${icon('plus')}${t('centers.add')}</button></div>
    <div class="tbl-wrap"><table><thead><tr><th>${t('cf.name')}</th><th>${t('col.type')}</th><th>${t('cf.status')}</th><th>${t('col.units')}</th><th>${t('col.tasks')}</th><th>${t('col.account')}</th><th></th></tr></thead><tbody>${D.centers.map(c => `<tr style="cursor:default">
      <td><b>${esc(c.name)}</b><div class="hint">${esc(c.address)}</div><div class="hint" dir="ltr" style="text-align:start">${esc(c.phone)}</div></td><td>${ctypeCell(c.type)}</td><td>${cstatBadge(c.status)}</td><td>${num(c.units)}</td><td>${num(openCount(c))}</td>
      <td><span class="badge ${c.active ? 'safe' : ''}">${icon(c.active ? 'check' : 'lock', 'sm')}${t(c.active ? 'acc.active' : 'acc.disabled')}</span></td>
      <td><div class="flags" style="flex-wrap:nowrap"><button class="btn" data-cedit="${c.id}">${icon('edit', 'sm')}${t('ar.edit')}</button><button class="btn" data-ctoggle="${c.id}">${icon(c.active ? 'lock' : 'check', 'sm')}${t(c.active ? 'centers.disable' : 'centers.enable')}</button><button class="btn icon-only" data-cdel="${c.id}" aria-label="${t('centers.delete')}: ${esc(c.name)}">${icon('trash', 'sm')}</button></div></td></tr>`).join('')}</tbody></table></div></section>`;
  }
  const blankForm = () => ({ name: '', type: 'ems', status: 'ready', units: '2', phone: '', address: '', email: '', lat: '', lng: '' });
  function openCenterForm(id) {
    if (id) { const c = center(id), ll = LG.toLatLng(c); S.cdr = { mode: 'edit', id, step: 'form', err: {}, v: { name: c.name, type: c.type, status: c.status, units: String(c.units), phone: c.phone, address: c.address, email: c.email, lat: String(ll.lat), lng: String(ll.lng) } }; }
    else S.cdr = { mode: 'add', id: null, step: 'form', err: {}, v: blankForm() };
    render();
  }
  function validateCenter(v, mode) {
    const e = {}, n = x => (String(x).trim() === '' ? NaN : Number(x));
    if (!v.name.trim()) e.name = 'err.required';
    if (!(n(v.units) >= 1)) e.units = 'err.units';
    if (mode === 'add' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) e.email = 'err.email';
    if (String(v.lat).trim() === '' && String(v.lng).trim() === '') e.lat = 'err.pick';
    else {
      if (!(n(v.lat) >= -90 && n(v.lat) <= 90)) e.lat = 'err.lat';
      if (!(n(v.lng) >= -180 && n(v.lng) <= 180)) e.lng = 'err.lng';
    }
    return e;
  }
  const fieldErr = (e, k) => e[k] ? `<span class="err-text" id="e-${k}">${icon('alert', 'sm')}${t(e[k])}</span>` : '';
  const genPass = () => { const a = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'; let s = ''; for (let i = 0; i < 12; i++) s += a[Math.floor(Math.random() * a.length)]; return s.slice(0, 4) + '-' + s.slice(4, 8) + '-' + s.slice(8); };
  function pickMap(v) {
    const lat = parseFloat(v.lat), lng = parseFloat(v.lng), ok = isFinite(lat) && isFinite(lng);
    const p = ok ? LG.fromLatLng(lat, lng) : null, inside = p && p.x >= 0 && p.x <= 100 && p.y >= 0 && p.y <= 100;
    return `<div class="map-box pick" id="pick-map" aria-label="${t('cf.pick')}">${mapBg()}${D.centers.map(c => `<span class="pin center ${c.status}" style="left:${c.x}%;top:${c.y}%;opacity:.45;pointer-events:none"><span>${icon(CT_ICON[c.type], 'sm')}</span></span>`).join('')}
      <button type="button" class="pin center me" id="pick-pin" style="left:${inside ? p.x : 50}%;top:${inside ? p.y : 50}%;${inside ? '' : 'display:none'}" aria-label="${t('cf.loc')}"><span>${icon('crosshair', 'sm')}</span></button></div>`;
  }
  function centerDrawer() {
    const d = S.cdr; if (!d) return '';
    const v = d.v, e = d.err, inv = k => e[k] ? ` aria-invalid="true" aria-describedby="e-${k}"` : '';
    if (d.step === 'created') {
      return `<div class="drawer-scrim" data-cclose="1"></div><aside class="drawer" role="dialog" aria-modal="true" aria-labelledby="cr-t"><div class="drawer-h"><h2 id="cr-t">${t('cr.title')}</h2></div>
        <div class="drawer-b"><div class="callout info">${icon('check')}<span>${esc(v.name)}</span></div><p>${t('cr.desc')}</p>
        <div class="cred"><span class="hint">${t('cr.email')}</span><code>${esc(v.email)}</code><span class="hint">${t('cr.pass')}</span><code id="cred-pass">${esc(d.pass)}</code>
        <button class="btn" id="copy-pass">${icon('copy', 'sm')}${t('cr.copy')}</button></div>
        <div class="callout warn">${icon('alert')}<span>${t('cr.warn')}</span></div></div>
        <div class="drawer-f"><button class="btn primary" data-cclose="1" style="min-block-size:52px">${t('cr.done')}</button></div></aside>`;
    }
    const opt = (list, cur, key) => list.map(k => `<option value="${k}" ${cur === k ? 'selected' : ''}>${t(key + '.' + k)}</option>`).join('');
    return `<div class="drawer-scrim" data-cclose="1"></div><aside class="drawer" role="dialog" aria-modal="true" aria-labelledby="cf-t" style="inline-size:min(520px,100vw)">
      <div class="drawer-h"><h2 id="cf-t">${t(d.mode === 'add' ? 'cf.addTitle' : 'cf.editTitle')}</h2><button class="btn icon-only" data-cclose="1" aria-label="${t('dr.close')}">${icon('close')}</button></div>
      <div class="drawer-b">
        <label class="field ${e.name ? 'err' : ''}"><span>${t('cf.name')}</span><input class="input" id="cf-name" value="${esc(v.name)}"${inv('name')}>${fieldErr(e, 'name')}</label>
        <div class="grid-2"><label class="field"><span>${t('cf.type')}</span><select class="select" id="cf-type">${opt(['ems', 'fire', 'rescue', 'sar'], v.type, 'ctype')}</select></label>
          <label class="field"><span>${t('cf.status')}</span><select class="select" id="cf-status">${opt(['ready', 'busy', 'offline'], v.status, 'cstat')}</select></label></div>
        <div class="grid-2"><label class="field ${e.units ? 'err' : ''}"><span>${t('cf.units')}</span><input class="input" id="cf-units" inputmode="numeric" value="${esc(v.units)}"${inv('units')}>${fieldErr(e, 'units')}</label>
          <label class="field"><span>${t('cf.phone')}</span><input class="input" id="cf-phone" type="tel" dir="ltr" value="${esc(v.phone)}"></label></div>
        <label class="field"><span>${t('cf.address')}</span><input class="input" id="cf-address" value="${esc(v.address)}"></label>
        <label class="field ${e.email ? 'err' : ''}"><span>${t('cf.email')}</span><input class="input" id="cf-email" type="email" dir="ltr" value="${esc(v.email)}" ${d.mode === 'edit' ? 'disabled' : ''}${inv('email')}><span class="hint">${t(d.mode === 'edit' ? 'cf.emailLocked' : 'cf.emailHint')}</span>${fieldErr(e, 'email')}</label>
        <div class="field ${e.lat || e.lng ? 'err' : ''}"><span>${t('cf.loc')}: ${t('cf.pick')}</span>${pickMap(v)}<span class="hint">${t('cf.pickHint')}</span>
          <div class="grid-2"><label class="field"><span>${t('cf.lat')}</span><input class="input" id="cf-lat" inputmode="decimal" dir="ltr" value="${esc(v.lat)}"${inv('lat')}>${fieldErr(e, 'lat')}</label>
            <label class="field"><span>${t('cf.lng')}</span><input class="input" id="cf-lng" inputmode="decimal" dir="ltr" value="${esc(v.lng)}"${inv('lng')}>${fieldErr(e, 'lng')}</label></div></div>
      </div>
      <div class="drawer-f"><button class="btn primary" id="cf-save" style="min-block-size:52px">${icon('check')}${t(d.mode === 'add' ? 'cf.save' : 'cf.saveEdit')}</button><button class="btn" data-cclose="1" style="min-block-size:52px">${t('cf.cancel')}</button></div></aside>`;
  }
  function confirmModal() {
    const c = S.confirm && center(S.confirm.id); if (!c) return '';
    const busy = openCount(c) > 0;
    return `<div class="modal-scrim"><div class="modal" role="alertdialog" aria-modal="true" aria-labelledby="cm-t"><h2 id="cm-t">${t('del.title')}</h2><p><b>${esc(c.name)}</b></p><p class="muted">${t('del.desc')}</p>
      ${busy ? `<div class="callout warn">${icon('alert')}<span>${t('del.busy')}</span></div>` : ''}
      <div class="actions"><button class="btn primary" id="cm-keep" style="min-block-size:52px">${t('del.keep')}</button><button class="btn" id="cm-yes" style="min-block-size:52px" ${busy ? 'disabled' : ''}>${icon('trash', 'sm')}${t('del.yes')}</button></div></div></div>`;
  }

  /* ---------- center panel (role: center) ---------- */
  const myAssigns = () => D.reports.flatMap(r => r.assign.filter(a => a.c === S.cp.center).map(a => ({ r, a })));
  const isActive = a => a.s !== 'done' && a.s !== 'declined';
  const nextStep = s => FLOW[FLOW.indexOf(s) + 1];
  const NEXT_LABEL = { accepted: 'cp.accept', enroute: 'cp.enroute', arrived: 'cp.arrive', done: 'cp.finish' };
  const NEXT_ICON = { accepted: 'check', enroute: 'route', arrived: 'pin', done: 'checkCircle' };
  function acard({ r, a }) {
    const c = center(S.cp.center), k = LG.km(r, c), fresh = a.s === 'notified' && !a.seen;
    return `<button class="acard ${fresh ? 'new' : ''}" data-cpopen="${r.id}"><span class="ev-ico">${icon(INC_ICON[r.type])}</span>
      <span><span class="t">${t('inc.' + r.type)} · ${esc(r.district)}</span><span class="m" style="margin-block-start:4px">${astatBadge(a.s)}${LG.priority(r) ? `<span class="badge solid-danger">${icon('alert', 'sm')}${t('cp.priority')}</span>` : ''}<span>${t('cp.assignedAgo', { n: a.min })}</span><span>${t('sug.km', { n: k.toFixed(1), m: LG.eta(k) })}</span></span></span>${icon('chevron', 'flip')}</button>`;
  }
  function notifCard() {
    const n = S.cp.notif, c = center(S.cp.center);
    const body = n === 'on'
      ? `<span class="badge safe">${icon('bell', 'sm')}${t('cp.notifOn')}</span><div class="push-card"><span class="ctype-ico">${icon('siren')}</span><span><b>${t('cp.pushTitle', { t: t('inc.fall') })}</b>${t('cp.pushBody', { d: 'Kadıköy', km: '2.4' })}<span class="hint-btn">${t('cp.pushPreview')}</span></span></div>`
      : n === 'blocked'
        ? `<span class="badge warn">${icon('bellOff', 'sm')}${t('cp.notifBlocked')}</span><div class="callout warn">${icon('info')}<span>${t('cp.notifBlockedDesc')}</span></div>`
        : `<span class="badge warn">${icon('bellOff', 'sm')}${t('cp.notifOff')}</span><p class="muted">${t('cp.notifOffDesc')}</p><button class="btn primary" id="cp-enable" style="min-block-size:52px">${icon('bell')}${t('cp.notifEnable')}</button>`;
    return `<section class="card" aria-labelledby="h-notif"><div class="card-h"><h2 id="h-notif">${t('cp.notif')}</h2><span class="grow"></span><button class="chip" id="cp-sound" aria-pressed="${S.cp.sound}">${icon(S.cp.sound ? 'volume' : 'volumeOff', 'sm')}${t(S.cp.sound ? 'cp.soundOn' : 'cp.soundOff')}</button></div><div class="grid">${body}<span class="hint">${icon('info', 'sm')} ${t('cp.notifIos')}</span></div></section>`;
  }
  function cpHeader(c) {
    return `<header class="cp-top"><span class="brand-mark">${icon(CT_ICON[c.type], 'lg')}</span><div class="grow"><h1>${esc(c.name)}</h1><span class="hint">${t('cp.title')} · ${t('ctype.' + c.type)}</span></div>
      <div class="seg" role="group" aria-label="${t('lang.switch')}"><button data-lang="tr" aria-pressed="${S.lang === 'tr'}">TR</button><button data-lang="ar" aria-pressed="${S.lang === 'ar'}">AR</button></div>
      <button class="btn icon-only" id="theme-btn" aria-label="${S.theme === 'dark' ? t('theme.light') : t('theme.dark')}">${icon(S.theme === 'dark' ? 'sun' : 'moon')}</button></header>`;
  }
  function previewBox() {
    const sb = (k, label) => `<button data-cpnotif="${k}" aria-pressed="${S.cp.notif === k}">${label}</button>`;
    return `<section class="preview-box" aria-label="${t('cp.preview')}"><h2>${t('cp.preview')}</h2>
      <button class="btn" id="cp-sim">${icon('bell', 'sm')}${t('cp.sim')}</button>
      <div class="field"><span>${t('cp.notifState')}</span><div class="seg wide" role="group">${sb('off', t('cp.notifOff'))}${sb('on', t('cp.notifOn'))}${sb('blocked', t('cp.notifBlocked'))}</div></div>
      <button class="btn" id="cp-net">${icon(S.cp.net ? 'wifiOff' : 'wifi', 'sm')}${t(S.cp.net ? 'cp.netOff' : 'cp.netOn')}</button>
      <div class="row-between"><a class="btn" href="#center-pass">${icon('lock', 'sm')}${t('cp.first')}</a><a class="btn" href="#login">${t('cp.logout')}</a></div></section>`;
  }
  function pageCenterList() {
    const c = center(S.cp.center), all = myAssigns().sort((x, y) => x.a.min - y.a.min), act = all.filter(x => isActive(x.a)), past = all.filter(x => !isActive(x.a));
    const fresh = act.filter(x => x.a.s === 'notified' && !x.a.seen);
    const banner = fresh.length ? `<div class="alert-banner" role="alert"><span class="ev-ico" style="background:var(--on-info);color:var(--info)">${icon('bell')}</span><b>${t('cp.alert', { t: t('inc.' + fresh[0].r.type), d: esc(fresh[0].r.district) })}</b><button class="btn" data-cpopen="${fresh[0].r.id}">${t('cp.open')}</button></div>` : '';
    const st = (k) => `<button data-cpstatus="${k}" aria-pressed="${c.status === k}">${icon(CSTAT_ICON[k], 'sm')}${t('cstat.' + k)}</button>`;
    return `<div class="cp">${cpHeader(c)}${banner}
      <section class="card" aria-labelledby="h-st"><div class="card-h"><h2 id="h-st">${t('cp.statusLabel')}</h2></div><div class="seg wide" role="group" aria-labelledby="h-st">${st('ready')}${st('busy')}${st('offline')}</div></section>
      <section aria-labelledby="h-my" class="grid"><h2 id="h-my" style="font:var(--text-title)">${t('cp.my')} · ${t('cp.active')} ${num(act.length)}</h2>${act.length ? act.map(acard).join('') : `<div class="card muted">${icon('info')} ${t('cp.empty')}</div>`}</section>
      ${past.length ? `<section class="grid" aria-labelledby="h-past"><h2 id="h-past" style="font:var(--text-title)">${t('cp.past')} ${num(past.length)}</h2>${past.map(acard).join('')}</section>` : ''}
      ${notifCard()}${previewBox()}</div>`;
  }
  function routeMap(r, c) {
    const a = { x: r.x, y: r.y }, b = { x: c.x, y: c.y };
    return `<div class="map-box route-map">${mapBg()}<svg class="map-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path class="line" vector-effect="non-scaling-stroke" d="M${b.x} ${b.y} L${a.x} ${a.y}"/></svg>
      <span class="pin center" style="left:${b.x}%;top:${b.y}%"><span>${icon(CT_ICON[c.type], 'sm')}</span></span>
      <span class="pin pulse" style="left:${a.x}%;top:${a.y}%"><span>${icon(INC_ICON[r.type], 'sm')}</span></span></div>`;
  }
  function pageCenterDetail() {
    const c = center(S.cp.center), id = S.cp.sel, r = D.reports.find(x => x.id === id), a = r && r.assign.find(x => x.c === c.id);
    if (!a) { S.cp.sel = null; return pageCenterList(); }
    const k = LG.km(r, c), ll = LG.toLatLng(r), idx = FLOW.indexOf(a.s), nxt = nextStep(a.s), declined = a.s === 'declined';
    const steps = FLOW.map((s, i) => `<li class="${i < idx || a.s === 'done' ? 'done' : i === idx ? 'cur' : ''}"><span class="dot">${icon(i < idx || a.s === 'done' ? 'check' : ASTAT_ICON[s], 'sm')}</span><span>${t('astat.' + s)}</span></li>`).join('');
    const net = S.cp.net;
    const actions = declined || a.s === 'done' ? '' : `${nxt ? `<button class="btn primary lg" data-cpnext="1" ${net ? '' : 'disabled'}>${icon(NEXT_ICON[nxt])}${t(NEXT_LABEL[nxt])}</button>` : ''}
      ${a.s === 'notified' ? `<button class="btn" data-cpdecline="1" style="min-block-size:52px" ${net ? '' : 'disabled'}>${icon('close', 'sm')}${t('cp.decline')}</button>` : ''}
      ${net ? '' : `<div class="callout warn">${icon('wifiOff')}<span>${t('cp.noNet')}</span></div>`}`;
    return `<div class="cp">${cpHeader(c)}
      <button class="btn" data-cpback="1" style="justify-self:start">${icon('back', 'sm flip')}${t('cp.back')}</button>
      <section class="card"><div class="cell" style="gap:12px;flex-wrap:wrap"><b style="font:var(--text-headline);font-size:22px">${icon(INC_ICON[r.type], 'lg')} ${t('inc.' + r.type)} · ${esc(r.district)}</b>${astatBadge(a.s)}</div>
        ${LG.priority(r) ? `<div class="callout danger" style="margin-block-start:12px">${icon('alert')}<span><b>${t('cp.priority')}</b>: ${t('cp.auto')}</span></div>` : ''}
        ${r.trapped ? `<div class="callout danger" style="margin-block-start:12px">${icon('alert')}<span>${t('dr.trappedNote')}</span></div>` : ''}</section>
      <section class="card" aria-label="${t('cp.step')}"><ol class="stepper">${steps}</ol></section>
      ${routeMap(r, c)}
      <section class="card"><div class="row-between"><b class="cell">${icon('route')}${t('cp.dist', { km: k.toFixed(1), min: LG.eta(k) })}</b><a class="btn" href="https://www.google.com/maps/dir/?api=1&destination=${ll.lat},${ll.lng}" target="_blank" rel="noopener">${icon('external', 'sm')}${t('cp.maps')}</a></div></section>
      <section class="card"><div class="card-h"><h2>${t('cp.details')}</h2></div><div><div class="kv-row"><span>${t('dr.where')}</span><b>${esc(r.district)}</b></div><div class="kv-row"><span>${t('dr.who')}</span><b>${num(r.people)}</b></div><div class="kv-row"><span>${t('col.notes')}</span>${flags(r)}</div><div class="kv-row"><span>${t('dr.when')}</span><b>${t('cp.assignedAgo', { n: a.min })}</b></div></div><p class="hint" style="margin-block-start:8px">${icon('lock', 'sm')} ${t('cp.priv')}</p></section>
      <div class="grid">${actions}</div>${S.cp.confirmDone ? `<div class="modal-scrim"><div class="modal" role="alertdialog" aria-modal="true" aria-labelledby="cd-t"><h2 id="cd-t">${t('cp.confirmTitle')}</h2><p class="muted">${t('cp.confirmDesc')}</p><div class="actions"><button class="btn primary" id="cd-keep" style="min-block-size:52px">${t('cp.confirmKeep')}</button><button class="btn" id="cd-yes" style="min-block-size:52px">${t('cp.confirmYes')}</button></div></div></div>` : ''}</div>`;
  }
  function pageCenterPass() {
    const d = S.passErr || {};
    return `<main class="login" id="main"><section class="login-card" aria-labelledby="h-pass"><div><h1 id="h-pass" style="font:var(--text-headline)">${t('pass.title')}</h1><p class="muted">${t('pass.desc')}</p><span class="hint">${icon('info', 'sm')} ${t('cp.step')}: 1/2</span></div>
      <label class="field"><span>${t('pass.cur')}</span><input class="input" id="pw-cur" type="password" dir="ltr" value="Kx7m-Q4pz-92Zt" autocomplete="current-password"></label>
      <label class="field ${d.n ? 'err' : ''}"><span>${t('pass.new')}</span><input class="input" id="pw-new" type="password" dir="ltr" autocomplete="new-password" ${d.n ? 'aria-invalid="true" aria-describedby="e-pwn"' : ''}><span class="hint">${t('pass.rule')}</span>${d.n ? `<span class="err-text" id="e-pwn">${icon('alert', 'sm')}${t(d.n)}</span>` : ''}</label>
      <label class="field ${d.r ? 'err' : ''}"><span>${t('pass.rep')}</span><input class="input" id="pw-rep" type="password" dir="ltr" autocomplete="new-password" ${d.r ? 'aria-invalid="true" aria-describedby="e-pwr"' : ''}>${d.r ? `<span class="err-text" id="e-pwr">${icon('alert', 'sm')}${t(d.r)}</span>` : ''}</label>
      <button class="btn primary" id="pw-save" style="min-block-size:52px">${t('pass.save')}</button></section></main>`;
  }

  /* ---------- drawer ---------- */
  function assignSection(r) {
    const done = new Set(r.assign.map(a => a.c));
    const list = r.assign.length ? r.assign.map(a => { const c = center(a.c); return `<div class="asg">${ctypeIco(c.type)}<div><b>${esc(c.name)}</b><div class="hint">${t('ctype.' + c.type)} · ${t('cp.assignedAgo', { n: a.min })}</div></div>${astatBadge(a.s)}</div>`; }).join('') : `<p class="muted">${t('as.none')}</p>`;
    let sug = '';
    if (r.kind === 'help' && r.ops !== 'resolved') {
      const picks = LG.suggest(r, D.centers.filter(c => c.active), { skip: [...done] });
      if (S.sugFor !== r.id) { S.sugFor = r.id; S.sugSel = picks.filter(p => !p.busy).map(p => p.center.id); }
      sug = `<div><h3>${t('sug.title')}</h3><p class="hint" style="margin-block-end:8px">${t('sug.hint')}</p><div class="sug-list">${picks.length ? picks.map(p => `<label class="sug">
        <input type="checkbox" data-sug="${p.center.id}" ${S.sugSel.includes(p.center.id) ? 'checked' : ''}>${ctypeIco(p.type)}
        <span><span class="t">${esc(p.center.name)}</span><span class="m">${cstatBadge(p.center.status)}<span>${t('sug.km', { n: p.km, m: p.eta })}</span><span>${t('why.' + p.why)}</span>${p.busy ? `<span>${icon('clock', 'sm')} ${t('sug.busy')}</span>` : ''}</span></span></label>`).join('') : `<p class="muted">${t('sug.none')}</p>`}</div></div>`;
    }
    return { block: `${LG.priority(r) && r.ops !== 'resolved' ? `<div class="callout danger">${icon('alert')}<span>${t('sug.priority')}</span></div>` : ''}<div><h3>${t('as.title')}</h3>${list}</div>${sug}`, picks: S.sugSel.length };
  }
  function drawer() {
    const r = D.reports.find(x => x.id === S.sel);
    if (!r) return '';
    const as = assignSection(r), n = as.picks, open = r.kind === 'help' && r.ops !== 'resolved';
    return `<div class="drawer-scrim" data-close="1"></div><aside class="drawer" role="dialog" aria-modal="true" aria-labelledby="dr-t">
      <div class="drawer-h"><h2 id="dr-t">${t('dr.title', { n: num(r.id) })}</h2><button class="btn icon-only" data-close="1" aria-label="${t('dr.close')}">${icon('close')}</button></div>
      <div class="drawer-b"><div class="cell" style="gap:12px;flex-wrap:wrap"><b style="font:var(--text-title)">${typeCell(r)}</b>${opsBadge(r.ops)}${delBadge(r.state)}</div>
      ${r.trapped ? `<div class="callout danger">${icon('alert')}<span>${t('dr.trappedNote')}</span></div>` : ''}
      ${r.state !== 'sent' ? `<div class="callout warn">${icon('clock')}<span>${t('dr.queuedNote')}</span></div>` : ''}
      <div><div class="kv-row"><span>${t('dr.where')}</span><b>${esc(r.district)}</b></div><div class="kv-row"><span>${t('dr.when')}</span><b>${ago(r.min)}</b></div><div class="kv-row"><span>${t('dr.who')}</span><b>${num(r.people)}</b></div><div class="kv-row"><span>${t('dr.how')}</span><b>${r.auto ? t('flag.auto') : t('dr.manual')}</b></div><div class="kv-row"><span>${t('col.notes')}</span>${flags(r)}</div></div>${as.block}</div>
      <div class="drawer-f">${open ? `<button class="btn primary" data-act="assign" style="min-block-size:52px" ${n ? '' : 'disabled aria-describedby="assign-hint"'}>${icon('building')}${t('sug.assign', { n })}</button>${n ? '' : `<span class="hint-btn" id="assign-hint">${t('sug.pickOne')}</span>`}<button class="btn" data-act="dispatch" style="min-block-size:52px" ${r.ops === 'dispatched' ? 'disabled' : ''}>${icon('route')}${t('dr.dispatch')}</button><button class="btn safe" data-act="resolve" style="min-block-size:52px">${icon('checkCircle')}${t('dr.resolve')}</button>` : `<button class="btn" data-act="reopen" style="min-block-size:52px">${icon('sync')}${t('dr.reopen')}</button>`}</div></aside>`;
  }

  /* ---------- shell ---------- */
  const ROUTES = [['overview', 'grid', 'ops'], ['map', 'map', 'ops'], ['reports', 'clipboard', 'ops'], ['volunteers', 'users', 'manage'], ['centers', 'building', 'manage'], ['areas', 'tent', 'manage']];
  function shell(body) {
    const newN = D.reports.filter(r => r.kind === 'help' && r.ops === 'new').length;
    const nav = ['ops', 'manage'].map(sec => `<div class="nav-label">${t('nav.' + sec)}</div>` + ROUTES.filter(r => r[2] === sec).map(r =>
      `<a href="#${r[0]}" ${S.route === r[0] ? 'aria-current="page"' : ''}>${icon(r[1])}<span class="t">${t('nav.' + r[0])}</span>${r[0] === 'reports' && newN ? `<span class="badge solid-danger" aria-label="${t('ops.new')}: ${newN}">${num(newN)}</span>` : ''}</a>`).join('')).join('');
    return `<button class="skip-link" data-skip="1">${t('skip')}</button><div class="shell">
      <aside class="side"><div class="brand"><span class="brand-mark">${icon('lifebuoy', 'lg')}</span><div><b>${t('app.name')}</b><small>${t('app.sub')}</small></div></div>
      <nav class="nav" aria-label="${t('app.sub')}">${nav}</nav>
      <div class="side-foot"><div class="sample-note">${icon('info')}<span>${t('sample.note')}</span></div><a class="btn" href="#login">${icon('lock', 'sm')}${t('nav.login')}</a></div></aside>
      <div class="main"><header class="top"><h1>${t('nav.' + S.route)}</h1><span class="grow"></span>
        <button class="btn" id="live-btn" aria-pressed="${!S.live}">${icon(S.live ? 'clock' : 'sync')}${S.live ? t('live.pause') : t('live.resume')}</button>
        <div class="seg" role="group" aria-label="${t('lang.switch')}"><button data-lang="tr" aria-pressed="${S.lang === 'tr'}">TR</button><button data-lang="ar" aria-pressed="${S.lang === 'ar'}">AR</button></div>
        <button class="btn icon-only" id="theme-btn" aria-label="${S.theme === 'dark' ? t('theme.light') : t('theme.dark')}">${icon(S.theme === 'dark' ? 'sun' : 'moon')}</button>
        <span class="badge info" title="${t('user.role')}">${icon('user', 'sm')}${t('user.role')}</span></header>
        <main class="page" id="main" tabindex="-1">${body}</main></div></div>${drawer()}${centerDrawer()}${confirmModal()}`;
  }

  function render() {
    const root = document.documentElement;
    root.lang = S.lang; root.dir = S.lang === 'ar' ? 'rtl' : 'ltr'; root.dataset.theme = S.theme;
    document.title = t('app.name') + ' · ' + t('app.sub');
    const pages = { overview: pageOverview, map: pageMap, reports: pageReports, volunteers: pageVolunteers, centers: pageCenters, areas: pageAreas };
    const solo = { login: pageLogin, center: () => (S.cp.sel ? pageCenterDetail() : pageCenterList()), 'center-pass': pageCenterPass };
    if (solo[S.route]) { $('#app').innerHTML = solo[S.route](); document.title = t('cp.title') + ' · ' + t('app.name'); if (S.route === 'center' && S.cp.confirmDone) { const k = $('#cd-keep'); k && k.focus(); } return; }
    $('#app').innerHTML = shell((pages[S.route] || pageOverview)());
    if (S.route === 'reports') $('#rep-count').textContent = t('rep.results', { n: filtered().length });
    if (S.confirm) { const k = $('#cm-keep'); k && k.focus(); }
    else if (S.cdr) { const bad = $('[aria-invalid="true"]'); const f = bad || (S.cdr.step === 'form' && !S.cdr.touched ? $('#cf-name') : null); f && f.focus(); if (S.cdr.step === 'created') { const b = $('#copy-pass'); b && b.focus(); } }
    else if (S.sel) { const b = $('.drawer .btn'); b && b.focus(); }
  }
  function route() { const h = (location.hash || "#overview").slice(1); S.route = ['overview', 'map', 'reports', 'volunteers', 'centers', 'areas', 'login', 'center', 'center-pass'].includes(h) ? h : 'overview'; S.sel = null; S.pin = null; S.cdr = null; S.confirm = null; S.cp.sel = null; S.cp.confirmDone = false; render(); window.scrollTo(0, 0); }
  function toast(msg) { const e = document.createElement('div'); e.className = 'toast'; e.setAttribute('role', 'status'); e.innerHTML = icon('check') + esc(msg); document.body.appendChild(e); setTimeout(() => e.remove(), 2200); }

  /* ---------- events (delegated) ---------- */
  const FIELD = { 'cf-name': 'name', 'cf-type': 'type', 'cf-status': 'status', 'cf-units': 'units', 'cf-phone': 'phone', 'cf-address': 'address', 'cf-email': 'email', 'cf-lat': 'lat', 'cf-lng': 'lng' };
  const closeTop = () => {
    if (S.confirm) { S.confirm = null; return true; }
    if (S.cdr) { S.cdr = null; return true; }
    if (S.cp.confirmDone) { S.cp.confirmDone = false; return true; }
    if (S.sel) { S.sel = null; return true; }
    return false;
  };
  function saveCenter() {
    const d = S.cdr, v = d.v; d.err = validateCenter(v, d.mode); d.touched = true;
    if (Object.keys(d.err).length) { render(); return; }
    const p = LG.fromLatLng(parseFloat(v.lat), parseFloat(v.lng)), x = Math.min(100, Math.max(0, p.x)), y = Math.min(100, Math.max(0, p.y));
    if (d.mode === 'add') {
      const id = 'c' + (D.centers.reduce((m, c) => Math.max(m, +c.id.slice(1)), 0) + 1);
      D.centers.push({ id, type: v.type, name: v.name.trim(), status: v.status, units: +v.units, phone: v.phone.trim(), address: v.address.trim(), x, y, email: v.email.trim(), active: true });
      d.step = 'created'; d.pass = genPass(); render();
    } else {
      Object.assign(center(d.id), { type: v.type, name: v.name.trim(), status: v.status, units: +v.units, phone: v.phone.trim(), address: v.address.trim(), x, y });
      S.cdr = null; render(); toast(t('dr.saved'));
    }
  }
  function setPickXY(x, y) {
    const m = $('#pick-map'), pn = $('#pick-pin'); if (!m || !S.cdr) return;
    x = Math.min(100, Math.max(0, x)); y = Math.min(100, Math.max(0, y));
    const ll = LG.toLatLng({ x, y }); S.cdr.v.lat = String(ll.lat); S.cdr.v.lng = String(ll.lng); S.cdr.touched = true;
    pn.style.display = ''; pn.style.left = x + '%'; pn.style.top = y + '%';
    $('#cf-lat').value = S.cdr.v.lat; $('#cf-lng').value = S.cdr.v.lng;
  }
  const pickFromEvent = ev => { const rc = $('#pick-map').getBoundingClientRect(); setPickXY((ev.clientX - rc.left) / rc.width * 100, (ev.clientY - rc.top) / rc.height * 100); };
  let picking = false;
  document.addEventListener('pointerdown', e => { if (S.cdr && e.target.closest && e.target.closest('#pick-map')) { picking = true; pickFromEvent(e); } });
  document.addEventListener('pointermove', e => { if (picking) pickFromEvent(e); });
  document.addEventListener('pointerup', () => { picking = false; });

  function cpAdvance() {
    const r = D.reports.find(x => x.id === S.cp.sel), a = r && r.assign.find(x => x.c === S.cp.center); if (!a) return;
    const n = nextStep(a.s); if (!n) return;
    if (n === 'done') { S.cp.confirmDone = true; render(); return; }
    a.s = n; a.seen = true; render(); toast(t('astat.' + n));
  }
  function simulate() {
    const r = D.reports.find(x => x.kind === 'help' && x.ops === 'new' && !x.assign.length);
    if (!r) return;
    r.assign.push({ c: S.cp.center, s: 'notified', min: 0, seen: false }); r.ops = 'dispatched';
    S.cp.sel = null; render();
  }
  const copyText = txt => { try { navigator.clipboard.writeText(txt).then(() => toast(t('cr.copied')), () => selectPass()); } catch (e) { selectPass(); } };
  const selectPass = () => { const el = $('#cred-pass'); if (el) { const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); } };

  document.addEventListener('click', e => {
    const g = s => e.target.closest(s);
    let el;
    if (g('[data-skip]')) { const m = $('#main'); m && m.focus(); }
    else if (g('[data-cadd]')) openCenterForm(null);
    else if ((el = g('[data-cedit]'))) openCenterForm(el.dataset.cedit);
    else if ((el = g('[data-ctoggle]'))) { const c = center(el.dataset.ctoggle); c.active = !c.active; render(); toast(t('dr.saved')); }
    else if ((el = g('[data-cdel]'))) { S.confirm = { kind: 'delete', id: el.dataset.cdel }; render(); }
    else if (g('#cm-keep')) { S.confirm = null; render(); }
    else if (g('#cm-yes')) { const id = S.confirm.id; D.centers.splice(D.centers.findIndex(c => c.id === id), 1); D.reports.forEach(r => { r.assign = r.assign.filter(a => a.c !== id); }); S.confirm = null; render(); toast(t('dr.saved')); }
    else if (g('[data-cclose]')) { S.cdr = null; render(); }
    else if (g('#cf-save')) saveCenter();
    else if (g('#copy-pass')) copyText(S.cdr.pass);
    else if (g('[data-cpback]')) { S.cp.sel = null; render(); }
    else if ((el = g('[data-cpopen]'))) { const id = +el.dataset.cpopen, r = D.reports.find(x => x.id === id), a = r && r.assign.find(x => x.c === S.cp.center); if (a) a.seen = true; S.cp.sel = id; render(); window.scrollTo(0, 0); }
    else if ((el = g('[data-cpstatus]'))) { center(S.cp.center).status = el.dataset.cpstatus; render(); toast(t('dr.saved')); }
    else if (g('[data-cpnext]')) cpAdvance();
    else if (g('[data-cpdecline]')) { const r = D.reports.find(x => x.id === S.cp.sel); r.assign.find(x => x.c === S.cp.center).s = 'declined'; S.cp.sel = null; render(); toast(t('astat.declined')); }
    else if (g('#cd-keep')) { S.cp.confirmDone = false; render(); }
    else if (g('#cd-yes')) { const r = D.reports.find(x => x.id === S.cp.sel); r.assign.find(x => x.c === S.cp.center).s = 'done'; S.cp.confirmDone = false; render(); toast(t('astat.done')); }
    else if (g('#cp-enable')) { S.cp.notif = 'on'; render(); toast(t('cp.notifOn')); }
    else if (g('#cp-sound')) { S.cp.sound = !S.cp.sound; render(); }
    else if ((el = g('[data-cpnotif]'))) { S.cp.notif = el.dataset.cpnotif; render(); }
    else if (g('#cp-net')) { S.cp.net = !S.cp.net; render(); }
    else if (g('#cp-sim')) simulate();
    else if (g('#pw-save')) {
      const n = $('#pw-new').value, r = $('#pw-rep').value; S.passErr = {};
      if (n.length < 12) S.passErr.n = 'pass.errShort'; else if (n !== r) S.passErr.r = 'pass.errMatch';
      if (S.passErr.n || S.passErr.r) { render(); const bad = $('[aria-invalid="true"]'); bad && bad.focus(); } else { S.passErr = null; location.hash = '#center'; }
    }
    else if ((el = g('[data-lang]'))) { S.lang = el.dataset.lang; save(); render(); }
    else if (g('#theme-btn')) { S.theme = S.theme === 'dark' ? 'light' : 'dark'; save(); render(); }
    else if (g('#live-btn')) { S.live = !S.live; render(); }
    else if (g('#toggle-chart')) { S.chartTable = !S.chartTable; render(); $('#toggle-chart').focus(); }
    else if (g('[data-close]')) { S.sel = null; render(); }
    else if ((el = g('[data-open]'))) { S.sel = +el.dataset.open; S.sugFor = null; render(); }
    else if ((el = g('[data-layer]'))) { S.layers[el.dataset.layer] = !S.layers[el.dataset.layer]; render(); }
    else if ((el = g('[data-pin]'))) { S.pin = el.dataset.pin; render(); }
    else if (g('#f-injured')) { S.f.injured = !S.f.injured; render(); }
    else if (g('#f-trapped')) { S.f.trapped = !S.f.trapped; render(); }
    else if (g('[data-toast]')) toast(t('dr.saved'));
    else if ((el = g('[data-act]'))) {
      const r = D.reports.find(x => x.id === S.sel), a = el.dataset.act;
      if (a === 'assign') {
        if (!S.sugSel.length) return;
        S.sugSel.forEach(id => r.assign.push({ c: id, s: 'notified', min: 0, seen: false }));
        const n = S.sugSel.length; r.ops = 'dispatched'; S.sugFor = null; render(); toast(t('sug.sent', { n })); return;
      }
      r.ops = a === 'dispatch' ? 'dispatched' : a === 'resolve' ? 'resolved' : 'new'; render(); toast(t('dr.saved'));
    }
  });
  document.addEventListener('change', e => {
    const c = e.target.dataset && e.target.dataset.sug; if (!c) return;
    S.sugSel = e.target.checked ? [...new Set([...S.sugSel, c])] : S.sugSel.filter(x => x !== c);
    render(); const el = $(`[data-sug="${c}"]`); el && el.focus();
  });
  document.addEventListener('input', e => {
    const id = e.target.id, f = S.f;
    if (FIELD[id] && S.cdr) {
      S.cdr.v[FIELD[id]] = e.target.value; S.cdr.touched = true;
      if (id === 'cf-lat' || id === 'cf-lng') {
        const lat = parseFloat(S.cdr.v.lat), lng = parseFloat(S.cdr.v.lng), pn = $('#pick-pin');
        if (pn && isFinite(lat) && isFinite(lng)) { const p = LG.fromLatLng(lat, lng); if (p.x >= 0 && p.x <= 100 && p.y >= 0 && p.y <= 100) { pn.style.display = ''; pn.style.left = p.x + '%'; pn.style.top = p.y + '%'; } }
      }
      return;
    }
    if (id === 'f-q') f.q = e.target.value; else if (id === 'f-type') f.type = e.target.value; else if (id === 'f-del') f.del = e.target.value; else if (id === 'f-ops') f.ops = e.target.value; else return;
    $('#rep-body').innerHTML = reportRows();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && closeTop()) { render(); return; }
    if (e.target.id === 'pick-pin' && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
      e.preventDefault(); const pn = e.target, x = parseFloat(pn.style.left), y = parseFloat(pn.style.top), s = e.shiftKey ? 3 : 0.8;
      setPickXY(x + (e.key === 'ArrowRight' ? s : e.key === 'ArrowLeft' ? -s : 0), y + (e.key === 'ArrowDown' ? s : e.key === 'ArrowUp' ? -s : 0)); return;
    }
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('tr[data-open]')) { e.preventDefault(); S.sel = +e.target.dataset.open; S.sugFor = null; render(); }
  });
  window.addEventListener('hashchange', route);

  /* simulated live arrivals (paused by the live button) */
  const NEWTYPES = ['quake', 'crash', 'fall', 'fire'], DIST = ['Kadıköy', 'Fatih', 'Üsküdar', 'Maltepe', 'Bakırköy'];
  let nid = 1049;
  if (q.get('sim') !== '0') setInterval(() => {
    if (!S.live || S.sel || S.cdr || S.confirm || !['overview', 'map'].includes(S.route)) return;
    D.reports.forEach(r => { delete r._fresh; });
    D.reports.unshift({ id: nid++, kind: 'help', type: NEWTYPES[nid % 4], min: 0, state: 'sent', auto: nid % 3 === 0, injured: null, trapped: null, people: 1 + nid % 3, ops: 'new', district: DIST[nid % 5], x: 20 + (nid * 17) % 60, y: 25 + (nid * 29) % 50, _fresh: true, assign: [] });
    D.hourly[11]++; render();
  }, 9000);

  if (q.get('center') && center(q.get('center'))) S.cp.center = q.get('center');
  route();
  /* review helpers (screenshots): ?open=1048  ?pin=r1048  ?cdr=add|edit|err|created  ?cpsel=1041  ?notif=on|blocked  ?net=0  ?done=1 */
  if (q.get('open')) { S.sel = +q.get('open'); S.sugFor = null; render(); }
  if (q.get('pin')) { S.pin = q.get('pin'); render(); }
  if (q.get('notif')) { S.cp.notif = q.get('notif'); render(); }
  if (q.get('net') === '0') { S.cp.net = false; render(); }
  if (q.get('cpsel')) { S.cp.sel = +q.get('cpsel'); const rr = D.reports.find(x => x.id === S.cp.sel), aa = rr && rr.assign.find(x => x.c === S.cp.center); if (aa) aa.seen = true; if (q.get('done') === '1') S.cp.confirmDone = true; render(); }
  if (q.get('cdr')) {
    const m = q.get('cdr');
    if (m === 'edit') openCenterForm('c1');
    else {
      openCenterForm(null);
      if (m === 'err') { S.cdr.v.units = '0'; S.cdr.v.email = 'koordinator'; S.cdr.v.lat = '95'; S.cdr.v.lng = ''; S.cdr.err = validateCenter(S.cdr.v, 'add'); S.cdr.touched = true; render(); }
      if (m === 'created') { Object.assign(S.cdr.v, { name: 'Maltepe 112 Acil Ambulans İstasyonu', type: 'ems', email: 'maltepe.112@ornek.org', lat: '40.93', lng: '29.13', units: '2' }); saveCenter(); }
      if (m === 'filled') { Object.assign(S.cdr.v, { name: 'Pendik İtfaiye Grubu', type: 'fire', email: 'pendik.itfaiye@ornek.org', lat: '40.9', lng: '29.2', units: '3', phone: '+90 216 555 11 10', address: 'Yenişehir Mh., Pendik' }); S.cdr.touched = true; render(); }
    }
  }
})();
