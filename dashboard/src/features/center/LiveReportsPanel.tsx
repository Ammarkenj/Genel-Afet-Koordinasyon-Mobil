import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCenterData } from '../../data/CenterData';
import { distanceKm } from '../../domain/geo';
import { liveAssignments } from '../../domain/live';
import { isPriorityReport } from '../../domain/suggestCenters';
import { Icon } from '../../components/Icon';
import { AssignmentBadge, CT_ICON, INC_ICON } from '../../components/badges';
import { MapView, type MapMarker } from '../../components/MapView';
import { Num } from '../../components/parts';
import { useOnline } from '../../hooks/useOnline';
import { minutesAgo, useNow } from '../../hooks/useNow';
import { CrewDrawer } from './CrewDrawer';

/** Open assignments of this center on a small map and as a list, updating live (the data is already a Firestore listener).
 *  Independent of the table filters: it always shows what is still open. */
export function LiveReportsPanel() {
  const { t } = useTranslation();
  const now = useNow(30_000);
  const online = useOnline();
  const { center, assignments } = useCenterData();
  const live = useMemo(() => liveAssignments(assignments), [assignments]);
  const [sel, setSel] = useState<string | null>(null);
  const rows = useRef(new Map<string, HTMLLIElement>());
  // Accepting from the list opens the same crew picker as the detail page, without leaving this page.
  const [accepting, setAccepting] = useState<string | null>(null);
  const acceptTarget = live.find((a) => a.id === accepting && a.status === 'notified') ?? null; // closes by itself if the job changed elsewhere

  const markers = useMemo<MapMarker[]>(() => {
    if (!center) return [];
    const list: MapMarker[] = [{ id: 'center', lat: center.lat, lng: center.lng, cls: `center ${center.status}`, icon: CT_ICON[center.type], label: center.name }];
    for (const a of live) {
      const type = a.snapshot.type ?? 'other';
      list.push({
        id: a.id,
        lat: a.snapshot.lat,
        lng: a.snapshot.lng,
        cls: a.status === 'notified' ? 'help' : 'need',
        pulse: a.status === 'notified',
        icon: INC_ICON[type],
        label: `#${a.snapshot.no} · ${t(`inc.${type}`)} · ${a.snapshot.district}`,
      });
    }
    return list;
  }, [center, live, t]);

  // A marker click highlights its row and brings it into view.
  useEffect(() => {
    if (sel) rows.current.get(sel)?.scrollIntoView({ block: 'nearest' });
  }, [sel]);

  if (!center) return null;
  const fitKey = `live:${live.map((a) => a.id).join(',')}`;

  return (
    <section className="card live-panel" aria-labelledby="h-live">
      <div className="card-h">
        <h2 id="h-live">{t('live.title')}</h2>
        <span className="live-dot"><i aria-hidden="true" />{t('live.now')}</span>
      </div>
      <div className="result-count" role="status">{t('live.count', { n: live.length })}</div>
      <MapView className="map-box live-map" markers={markers} selectedId={sel} onSelect={(id) => setSel(id === 'center' ? null : id)} fitKey={fitKey} ariaLabel={t('map.title')} />
      {live.length === 0 ? (
        <p className="empty"><Icon name="checkCircle" /> {t('live.empty')}</p>
      ) : (
        <ul className="feed live-list" aria-label={t('live.title')}>
          {live.map((a) => {
            const type = a.snapshot.type ?? 'other';
            const fresh = a.status === 'notified' && !a.seen;
            return (
              <li
                key={a.id}
                ref={(el) => { if (el) rows.current.set(a.id, el); else rows.current.delete(a.id); }}
                className={`live-row${fresh ? ' fresh' : ''}${sel === a.id ? ' sel' : ''}`}
                onMouseEnter={() => setSel(a.id)}
              >
                <span className="ctype-ico"><Icon name={INC_ICON[type]} /></span>
                <div>
                  <div className="t"><Num>#{a.snapshot.no}</Num> · {t(`inc.${type}`)}</div>
                  <div className="m">
                    <span>{a.snapshot.district}</span>
                    <span>{t('feed.ago', { n: minutesAgo(a.createdAtMs, now) })}</span>
                    <span><Num>{(Math.round(distanceKm(a.snapshot, center) * 10) / 10).toFixed(1)}</Num> km</span>
                  </div>
                  <div className="m" style={{ marginBlockStart: 4 }}>
                    <AssignmentBadge status={a.status} />
                    {isPriorityReport(a.snapshot) && <span className="badge solid-danger"><Icon name="alert" size="sm" />{t('cp.priority')}</span>}
                  </div>
                </div>
                <div className="live-actions">
                  {a.status === 'notified' && (
                    <button type="button" className="btn primary live-accept" disabled={!online} onClick={() => setAccepting(a.id)} aria-label={`${t('crew.accept')}: #${a.snapshot.no}`}>
                      <Icon name="check" size="sm" />{t('crew.accept')}
                    </button>
                  )}
                  <Link className="btn" to={`/center/reports/${a.id}`} aria-label={`${t('live.open')}: #${a.snapshot.no}`}>{t('live.open')}<Icon name="chevron" size="sm" flip /></Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {live.some((a) => a.status === 'notified') && !online && <div className="callout warn"><Icon name="wifiOff" /><span>{t('cp.noNet')}</span></div>}
      {acceptTarget && <CrewDrawer assignment={acceptTarget} mode="accept" onClose={() => setAccepting(null)} />}
    </section>
  );
}
