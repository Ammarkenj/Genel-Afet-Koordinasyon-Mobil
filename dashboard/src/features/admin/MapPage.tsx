import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAdminData } from '../../data/AdminData';
import { freeVehicleCount } from '../../domain/crew';
import { Icon } from '../../components/Icon';
import type { IconName } from '../../components/iconPaths';
import { CT_ICON, CenterStatusBadge, CenterTypeCell, Flags, INC_ICON, NEED_ICON, OpsBadge, TypeCell, Urgency } from '../../components/badges';
import { MapView, type MapMarker } from '../../components/MapView';
import { CapBar, DataGate, Num } from '../../components/parts';
import { minutesAgo, useNow } from '../../hooks/useNow';

type Layer = 'help' | 'safe' | 'areas' | 'needs' | 'centers';
const LAYERS: { key: Layer; icon: IconName }[] = [
  { key: 'help', icon: 'lifebuoy' }, { key: 'safe', icon: 'shieldCheck' }, { key: 'areas', icon: 'tent' }, { key: 'needs', icon: 'drop' }, { key: 'centers', icon: 'building' },
];

export function MapPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { reports, needs, areas, centers, assignments, loading, error, retry } = useAdminData();
  const now = useNow();
  const [layers, setLayers] = useState<Record<Layer, boolean>>({ help: true, safe: true, areas: true, needs: true, centers: true });
  const [sel, setSel] = useState<string | null>(null);

  const markers = useMemo<MapMarker[]>(() => {
    const m: MapMarker[] = [];
    if (layers.help) {
      reports.filter((r) => r.kind === 'help' && r.ops !== 'resolved').forEach((r) =>
        m.push({ id: `r:${r.id}`, lat: r.lat, lng: r.lng, cls: 'help', pulse: r.ops === 'new', icon: INC_ICON[r.type ?? 'other'], label: `${t(`inc.${r.type ?? 'other'}`)} · ${r.district}` }));
    }
    if (layers.safe) reports.filter((r) => r.kind === 'safe').forEach((r) => m.push({ id: `r:${r.id}`, lat: r.lat, lng: r.lng, cls: 'safe', icon: 'check', label: `${t('kind.safe')} · ${r.district}` }));
    if (layers.areas) areas.forEach((a) => m.push({ id: `a:${a.id}`, lat: a.lat, lng: a.lng, cls: 'area', icon: 'tent', label: `${t('ar.title')} ${a.number} · ${a.name}` }));
    if (layers.needs) needs.forEach((n) => m.push({ id: `n:${n.id}`, lat: n.lat, lng: n.lng, cls: 'need', icon: NEED_ICON[n.need], label: `${t(`need.${n.need}`)} · ${n.district}` }));
    if (layers.centers) centers.forEach((c) => m.push({ id: `k:${c.id}`, lat: c.lat, lng: c.lng, cls: `center ${c.status}`, icon: CT_ICON[c.type], label: `${t(`ctype.${c.type}`)} · ${c.name} · ${t(`cstat.${c.status}`)}` }));
    return m;
  }, [layers, reports, areas, needs, centers, t]);

  const open = reports.filter((r) => r.kind === 'help' && r.ops !== 'resolved').slice(0, 6);

  const info = () => {
    if (!sel) return <p className="muted"><Icon name="info" /> {t('map.pick')}</p>;
    const [k, id] = [sel.slice(0, 1), sel.slice(2)];
    if (k === 'r') {
      const r = reports.find((x) => x.id === id);
      if (!r) return null;
      return (
        <div className="grid">
          <div className="cell"><b><TypeCell r={r} /></b><OpsBadge ops={r.ops} /></div>
          <Flags r={r} />
          <div className="kv-row"><span>{t('col.district')}</span><b>{r.district}</b></div>
          <div className="kv-row"><span>{t('col.time')}</span><b>{t('feed.ago', { n: minutesAgo(r.createdAtMs, now) })}</b></div>
          <div className="kv-row"><span>{t('col.people')}</span><b><Num>{r.people}</Num></b></div>
          <button type="button" className="btn primary" onClick={() => navigate(`/admin/reports?r=${r.id}`)}>{t('dr.title', { n: r.no })}<Icon name="chevron" flip /></button>
        </div>
      );
    }
    if (k === 'a') {
      const a = areas.find((x) => x.id === id);
      return a ? <div className="grid"><b>{t('ar.title')} <Num>{a.number}</Num> · {a.name}</b><CapBar occupied={a.occupied} capacity={a.capacity} /></div> : null;
    }
    if (k === 'k') {
      const c = centers.find((x) => x.id === id);
      if (!c) return null;
      const open = assignments.filter((a) => a.centerId === c.id && a.status !== 'done' && a.status !== 'declined').length;
      return (
        <div className="grid">
          <b className="cell"><Icon name={CT_ICON[c.type]} />{c.name}</b>
          <div className="flags"><CenterStatusBadge status={c.status} /><CenterTypeCell type={c.type} /></div>
          <div className="kv-row"><span>{t('centers.vehiclesCol')}</span><b><Num>{freeVehicleCount(c, assignments)}</Num> / <Num>{c.stats.vehicles}</Num></b></div>
          <div className="kv-row"><span>{t('centers.staffCol')}</span><b><Num>{c.stats.staff}</Num></b></div>
          <div className="kv-row"><span>{t('centers.crewsCol')}</span><b><Num>{c.stats.crews}</Num></b></div>
          <div className="kv-row"><span>{t('col.phone')}</span><b dir="ltr">{c.phone}</b></div>
          <div className="kv-row"><span>{t('cf.address')}</span><b>{c.address}</b></div>
          <div className="kv-row"><span>{t('col.tasks')}</span><b><Num>{open}</Num></b></div>
        </div>
      );
    }
    const n = needs.find((x) => x.id === id);
    return n ? <div className="grid"><b className="cell"><Icon name={NEED_ICON[n.need]} />{t(`need.${n.need}`)}</b><Urgency level={n.urgency} /><div className="kv-row"><span>{t('col.district')}</span><b>{n.district}</b></div></div> : null;
  };

  return (
    <DataGate loading={loading} error={error} onRetry={retry}>
      <div className="map-layout">
        <section className="card" aria-labelledby="h-map" style={{ padding: 'var(--sp-3)' }}>
          <div className="card-h">
            <h2 id="h-map" className="sr-only">{t('map.title')}</h2>
            <div className="layer-toggles" role="group" aria-label={t('map.layers')}>
              {LAYERS.map((l) => (
                <button key={l.key} type="button" className="chip" aria-pressed={layers[l.key]} onClick={() => setLayers((s) => ({ ...s, [l.key]: !s[l.key] }))}>
                  <Icon name={l.icon} size="sm" />{t(`map.${l.key}`)}
                </button>
              ))}
            </div>
          </div>
          <MapView markers={markers} selectedId={sel} onSelect={setSel} fitKey="admin-map" ariaLabel={t('map.title')} />
          <div className="map-legend-row">
            {LAYERS.map((l) => <span key={l.key}><Icon name={l.icon} size="sm" />{t(`map.${l.key}`)}</span>)}
          </div>
        </section>
        <aside className="grid">
          <section className="card" aria-live="polite"><div className="card-h"><h2>{t('map.selected')}</h2></div>{info()}</section>
          <section className="card">
            <div className="card-h"><h2>{t('map.list')}</h2></div>
            {open.length === 0 ? <p className="empty">{t('rep.noReports')}</p> : (
              <ul className="side-list">
                {open.map((r) => (
                  <li key={r.id}>
                    <button type="button" aria-pressed={sel === `r:${r.id}`} onClick={() => setSel(`r:${r.id}`)}>
                      <span className="ev-ico"><Icon name={INC_ICON[r.type ?? 'other']} size="sm" /></span>
                      <span><b>{t(`inc.${r.type ?? 'other'}`)}</b><br /><span className="hint">{r.district} · {t('feed.ago', { n: minutesAgo(r.createdAtMs, now) })}</span></span>
                      <OpsBadge ops={r.ops} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </DataGate>
  );
}
