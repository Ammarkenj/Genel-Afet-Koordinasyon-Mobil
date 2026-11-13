/* Pure logic for center suggestions (no DOM). The React version ports this to src/domain/suggestCenters.ts.
   Map coordinates are percentages of the sample map; KM_X / KM_Y turn them into rough kilometres. */
(function (root) {
  'use strict';
  const KM_X = 0.46, KM_Y = 0.245, KM_PER_MIN = 0.7;
  const km = (a, b) => Math.hypot((a.x - b.x) * KM_X, (a.y - b.y) * KM_Y);
  const eta = k => Math.max(2, Math.round(k / KM_PER_MIN) + 1);
  const toLatLng = p => ({ lat: +(41.10 - p.y * 0.0022).toFixed(5), lng: +(28.70 + p.x * 0.0055).toFixed(5) });
  const fromLatLng = (lat, lng) => ({ x: (lng - 28.70) / 0.0055, y: (41.10 - lat) / 0.0022 });

  /* Which center types a report needs, most important first, with the reason (an i18n key suffix).
     fall -> ambulance first; auto-detected fall = possible loss of consciousness (priority). */
  function needs(r) {
    const out = [];
    const add = (type, why) => { if (!out.some(o => o.type === type)) out.push({ type, why }); };
    if (r.type === 'fall') add('ems', 'fall');
    else if (r.type === 'crash') { add('ems', 'crash'); add('fire', 'crash'); add('rescue', 'crash'); }
    else if (r.type === 'fire') add('fire', 'fire');
    else if (r.type === 'quake') { const why = r.trapped ? 'trapped' : 'quake'; add('rescue', why); add('sar', why); }
    if (r.injured) add('ems', 'injured');
    return out;
  }
  const priority = r => r.kind === 'help' && r.type === 'fall' && !!r.auto;
  const usable = c => c.active !== false && c.status !== 'offline';

  /* Up to `max` suggestions: one nearest center per needed type; ready ones first, busy ones last (flagged). */
  function suggest(r, centers, opts) {
    const max = (opts && opts.max) || 3, skip = new Set((opts && opts.skip) || []);
    const pool = centers.filter(c => usable(c) && !skip.has(c.id));
    const dist = c => km(r, c);
    const best = (list) => {
      const ready = list.filter(c => c.status === 'ready').sort((a, b) => dist(a) - dist(b));
      const busy = list.filter(c => c.status === 'busy').sort((a, b) => dist(a) - dist(b));
      return ready[0] || busy[0] || null;
    };
    const picked = [];
    const need = needs(r);
    if (!need.length) {                                   // other: nearest centers of any type
      const ordered = pool.slice().sort((a, b) => (a.status === 'busy') - (b.status === 'busy') || dist(a) - dist(b));
      ordered.slice(0, max).forEach(c => picked.push({ center: c, why: 'any' }));
    } else {
      need.forEach(n => { const c = best(pool.filter(x => x.type === n.type)); if (c && !picked.some(p => p.center.id === c.id)) picked.push({ center: c, why: n.why }); });
    }
    return picked
      .map((p, i) => ({ center: p.center, type: p.center.type, why: p.why, km: +dist(p.center).toFixed(1), eta: eta(dist(p.center)), busy: p.center.status === 'busy', order: i }))
      .sort((a, b) => (a.busy - b.busy) || (a.order - b.order))
      .slice(0, max);
  }

  const api = { km, eta, toLatLng, fromLatLng, needs, priority, suggest, usable };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.LOGIC = api;
})(typeof window !== 'undefined' ? window : globalThis);
