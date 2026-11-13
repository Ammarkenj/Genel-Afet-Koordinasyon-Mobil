import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCenterData } from '../../data/CenterData';
import { markAssignmentSeen, setAssignmentStatus } from '../../data/repos';
import { CREW_EDITABLE_STATUSES } from '../../domain/crew';
import { distanceKm, etaMinutes, googleMapsDirections } from '../../domain/geo';
import { isPriorityReport } from '../../domain/suggestCenters';
import { ASSIGNMENT_FLOW, type AssignmentStatus } from '../../domain/types';
import { ConfirmDialog } from '../../components/Dialog';
import { Icon } from '../../components/Icon';
import type { IconName } from '../../components/iconPaths';
import { ASTAT_ICON, AssignmentBadge, CT_ICON, Flags, INC_ICON } from '../../components/badges';
import { MapView, type MapMarker } from '../../components/MapView';
import { Num } from '../../components/parts';
import { useToast } from '../../components/Toast';
import { useOnline } from '../../hooks/useOnline';
import { minutesAgo, useNow } from '../../hooks/useNow';
import { CrewDrawer } from './CrewDrawer';

const NEXT_LABEL: Partial<Record<AssignmentStatus, string>> = { accepted: 'crew.accept', enroute: 'cp.enroute', arrived: 'cp.arrive', done: 'cp.finish' };
const NEXT_ICON: Partial<Record<AssignmentStatus, IconName>> = { accepted: 'check', enroute: 'route', arrived: 'pin', done: 'checkCircle' };

export function CenterAssignmentPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const online = useOnline();
  const now = useNow();
  const { id } = useParams();
  const { center, assignments } = useCenterData();
  const a = assignments.find((x) => x.id === id);
  const [confirmDone, setConfirmDone] = useState(false);
  const [crewMode, setCrewMode] = useState<'accept' | 'edit' | null>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  // Opening an assignment turns off its "new" alert.
  useEffect(() => {
    if (a && !a.seen && a.status === 'notified') void markAssignmentSeen(a.id).catch(() => undefined);
  }, [a]);

  const snap = a?.snapshot;
  const markers = useMemo<MapMarker[]>(() => {
    if (!snap || !center) return [];
    return [
      { id: 'center', lat: center.lat, lng: center.lng, cls: `center ${center.status}`, icon: CT_ICON[center.type], label: center.name },
      { id: 'incident', lat: snap.lat, lng: snap.lng, cls: 'help', pulse: true, icon: INC_ICON[snap.type ?? 'other'], label: `${t(`inc.${snap.type ?? 'other'}`)} · ${snap.district}` },
    ];
  }, [snap, center, t]);

  if (!center) return null;
  if (!a || !snap) {
    return (
      <>
        <div className="card"><div className="callout warn"><Icon name="alert" /><span>{t('cp.notFound')}</span></div></div>
        <Link className="btn" to="/center/reports" style={{ justifySelf: 'start' }}><Icon name="back" size="sm" flip />{t('cp.back')}</Link>
      </>
    );
  }

  const km = distanceKm(snap, center);
  const idx = ASSIGNMENT_FLOW.indexOf(a.status);
  const declined = a.status === 'declined';
  const next = !declined ? ASSIGNMENT_FLOW[idx + 1] : undefined;
  const hasCrew = a.crew.vehicles.length > 0 || a.crew.staff.length > 0;
  const canEditCrew = a.status === 'accepted' || a.status === 'enroute';

  const update = async (status: AssignmentStatus) => {
    setBusy(true);
    setFailure(null);
    try {
      await setAssignmentStatus(a.id, status);
      toast.show(t(`astat.${status}`));
    } catch {
      setFailure('cp.updateFail');
    } finally {
      setBusy(false);
      setConfirmDone(false);
    }
  };

  const onNext = () => {
    if (!next) return;
    if (next === 'accepted') setCrewMode('accept'); // choosing who goes is part of accepting
    else if (next === 'done') setConfirmDone(true);
    else void update(next);
  };

  return (
    <>
      <Link className="btn" to="/center/reports" style={{ justifySelf: 'start' }}><Icon name="back" size="sm" flip />{t('cp.back')}</Link>

      <section className="card">
        <div className="cell" style={{ gap: 12, flexWrap: 'wrap' }}>
          <b style={{ font: 'var(--text-headline)', fontSize: 22 }}><Icon name={INC_ICON[snap.type ?? 'other']} size="lg" /> {t(`inc.${snap.type ?? 'other'}`)} · {snap.district}</b>
          <AssignmentBadge status={a.status} />
        </div>
        {isPriorityReport(snap) && <div className="callout danger" style={{ marginBlockStart: 12 }}><Icon name="alert" /><span><b>{t('cp.priority')}</b>: {t('cp.auto')}</span></div>}
        {snap.trapped && <div className="callout danger" style={{ marginBlockStart: 12 }}><Icon name="alert" /><span>{t('dr.trappedNote')}</span></div>}
      </section>

      {!declined && (
        <section className="card" aria-label={t('cp.step')}>
          <ol className="stepper">
            {ASSIGNMENT_FLOW.map((s, i) => {
              const done = i < idx || a.status === 'done';
              const cur = i === idx && a.status !== 'done';
              return (
                <li key={s} className={done ? 'done' : cur ? 'cur' : ''} aria-current={cur ? 'step' : undefined}>
                  <span className="dot"><Icon name={done ? 'check' : ASTAT_ICON[s]} size="sm" /></span>
                  <span>{t(`astat.${s}`)}</span>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {failure && <div className="callout danger" role="alert"><Icon name="alert" /><span>{t(failure)}</span></div>}
      {!declined && a.status !== 'done' && (
        <div className="grid">
          {next && (
            <button type="button" className="btn primary lg" disabled={!online || busy} onClick={onNext}>
              <Icon name={NEXT_ICON[next] ?? 'check'} />{t(NEXT_LABEL[next] ?? 'cp.accept')}
            </button>
          )}
          {a.status === 'notified' && (
            <button type="button" className="btn" style={{ minBlockSize: 52 }} disabled={!online || busy} onClick={() => void update('declined')}><Icon name="close" size="sm" />{t('cp.decline')}</button>
          )}
          {!online && <div className="callout warn"><Icon name="wifiOff" /><span>{t('cp.noNet')}</span></div>}
        </div>
      )}

      <section className="card" aria-labelledby="h-crew">
        <div className="card-h">
          <h2 id="h-crew">{t('crew.title')}</h2>
          <span className="grow" />
          {canEditCrew && CREW_EDITABLE_STATUSES.includes(a.status) && (
            <button type="button" className="btn" disabled={!online} onClick={() => setCrewMode('edit')}><Icon name="edit" size="sm" />{t('crew.edit')}</button>
          )}
        </div>
        {hasCrew ? (
          <div className="grid">
            {a.crew.teams.length > 0 && (
              <div><div className="hint">{t('crw.sent')}</div><div className="crew-chips">{a.crew.teams.map((n) => <span className="badge" key={n}><Icon name="users" size="sm" />{n}</span>)}</div></div>
            )}
            {a.crew.vehicles.length > 0 && (
              <div><div className="hint">{t('crew.vehicles')}</div><div className="crew-chips">{a.crew.vehicles.map((v) => <span className="badge info" key={v.id}><Icon name="truck" size="sm" /><span dir="ltr">{v.code}</span></span>)}</div></div>
            )}
            {a.crew.staff.length > 0 && (
              <div><div className="hint">{t('crew.staff')}</div><div className="crew-chips">{a.crew.staff.map((m) => <span className="badge" key={m.id}><Icon name="user" size="sm" />{m.name} · {t(`srole.${m.role}`)}</span>)}</div></div>
            )}
          </div>
        ) : (
          <p className="empty">{t('crew.none')}</p>
        )}
      </section>

      <MapView className="map-box route-map" markers={markers} fitKey={a.id} line={[center, snap]} ariaLabel={t('map.title')} />

      <section className="card">
        <div className="row-between">
          <b className="cell"><Icon name="route" />{t('cp.dist', { km: (Math.round(km * 10) / 10).toFixed(1), min: etaMinutes(km) })}</b>
          <a className="btn" href={googleMapsDirections(snap)} target="_blank" rel="noopener noreferrer"><Icon name="external" size="sm" />{t('cp.maps')}</a>
        </div>
      </section>

      <section className="card">
        <div className="card-h"><h2>{t('cp.details')}</h2></div>
        <div>
          <div className="kv-row"><span>{t('dr.where')}</span><b>{snap.district}</b></div>
          <div className="kv-row"><span>{t('dr.who')}</span><b><Num>{snap.people}</Num></b></div>
          <div className="kv-row"><span>{t('col.notes')}</span><Flags r={snap} /></div>
          <div className="kv-row"><span>{t('dr.when')}</span><b>{t('cp.assignedAgo', { n: minutesAgo(a.createdAtMs, now) })}</b></div>
        </div>
        <p className="hint" style={{ marginBlockStart: 8 }}><Icon name="lock" size="sm" /> {t('cp.priv')}</p>
      </section>

      {crewMode && <CrewDrawer assignment={a} mode={crewMode} onClose={() => setCrewMode(null)} />}
      {confirmDone && (
        <ConfirmDialog
          titleId="cd-t"
          title={t('cp.confirmTitle')}
          keepLabel={t('cp.confirmKeep')}
          confirmLabel={t('cp.confirmYes')}
          onKeep={() => setConfirmDone(false)}
          onConfirm={() => void update('done')}
          busy={busy}
        >
          <p className="muted">{t('cp.confirmDesc')}</p>
        </ConfirmDialog>
      )}
    </>
  );
}
