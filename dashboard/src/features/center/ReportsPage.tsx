import { useMemo, useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCenterData } from '../../data/CenterData';
import { distanceKm } from '../../domain/geo';
import { isPriorityReport } from '../../domain/suggestCenters';
import { ACTIVE_ASSIGNMENT } from '../../domain/centerStats';
import { INCIDENT_TYPES, type Assignment } from '../../domain/types';
import { Icon } from '../../components/Icon';
import { AssignmentBadge, Flags, TypeCell } from '../../components/badges';
import { Num } from '../../components/parts';
import { LiveReportsPanel } from './LiveReportsPanel';
import { minutesAgo, useNow } from '../../hooks/useNow';

type Group = 'all' | 'active' | 'done' | 'declined';
type Range = 'today' | '7' | '30' | 'all';
const DAY = 86_400_000;

export function CenterReportsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const now = useNow();
  const { center, assignments } = useCenterData();
  const [group, setGroup] = useState<Group>('all');
  const [type, setType] = useState('');
  const [range, setRange] = useState<Range>('all');
  const [q, setQ] = useState('');

  const rows = useMemo(() => {
    const since = range === 'all' ? 0 : range === 'today' ? new Date(now).setHours(0, 0, 0, 0) : now - Number(range) * DAY;
    const text = q.trim().toLowerCase();
    return assignments.filter((a: Assignment) => {
      if (group === 'active' && !ACTIVE_ASSIGNMENT.includes(a.status)) return false;
      if (group === 'done' && a.status !== 'done') return false;
      if (group === 'declined' && a.status !== 'declined') return false;
      if (type && (a.snapshot.type ?? 'other') !== type) return false;
      if (a.createdAtMs < since) return false;
      if (text && !String(a.snapshot.no).includes(text) && !a.snapshot.district.toLowerCase().includes(text)) return false;
      return true;
    });
  }, [assignments, group, type, range, q, now]);

  if (!center) return null;
  const open = (id: string) => navigate(`/center/reports/${id}`);
  const onKey = (e: KeyboardEvent, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      open(id);
    }
  };
  const groups: [Group, string][] = [['all', t('rep.all')], ['active', t('crp.g.active')], ['done', t('crp.g.done')], ['declined', t('crp.g.declined')]];

  return (
    <>
      <div className="page-h"><h1>{t('cnav.reports')}</h1></div>
      <div className="live-layout">
      <LiveReportsPanel />
      <section className="card" aria-label={t('cnav.reports')}>
        <div className="filters">
          <div className="field">
            <span>{t('crp.status')}</span>
            <div className="seg" role="group" aria-label={t('crp.status')}>
              {groups.map(([k, label]) => <button key={k} type="button" aria-pressed={group === k} onClick={() => setGroup(k)}>{label}</button>)}
            </div>
          </div>
          <label className="field">
            <span>{t('rep.type')}</span>
            <select className="select" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">{t('rep.all')}</option>
              {INCIDENT_TYPES.map((k) => <option key={k} value={k}>{t(`inc.${k}`)}</option>)}
            </select>
          </label>
          <label className="field">
            <span>{t('crp.range')}</span>
            <select className="select" value={range} onChange={(e) => setRange(e.target.value as Range)}>
              {(['all', 'today', '7', '30'] as Range[]).map((k) => <option key={k} value={k}>{t(`crp.r.${k}`)}</option>)}
            </select>
          </label>
          <label className="field grow">
            <span>{t('rep.search')}</span>
            <span className="input-wrap"><Icon name="search" /><input className="input" type="search" value={q} onChange={(e) => setQ(e.target.value)} /></span>
          </label>
        </div>
        <div className="result-count" role="status" style={{ marginBlock: '12px 8px' }}>{t('crp.results', { n: rows.length })}</div>
        <div className="tbl-wrap">
          <table className="resp">
            <thead>
              <tr><th>{t('col.id')}</th><th>{t('col.type')}</th><th>{t('col.district')}</th><th>{t('col.time')}</th><th>{t('col.state')}</th><th>{t('crp.crew')}</th><th>{t('col.notes')}</th><th>{t('col.dist')}</th></tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr style={{ cursor: 'default' }}><td colSpan={8} className="muted" style={{ padding: 32, textAlign: 'center' }}><Icon name="search" /> {assignments.length === 0 ? t('crp.none') : t('crp.empty')}</td></tr>
              ) : (
                rows.map((a) => (
                  <tr key={a.id} tabIndex={0} onClick={() => open(a.id)} onKeyDown={(e) => onKey(e, a.id)}>
                    <td data-label={t('col.id')}><b><Num>#{a.snapshot.no}</Num></b></td>
                    <td data-label={t('col.type')}><TypeCell r={a.snapshot} />{isPriorityReport(a.snapshot) && <span className="badge solid-danger" style={{ marginInlineStart: 8 }}><Icon name="alert" size="sm" />{t('cp.priority')}</span>}</td>
                    <td data-label={t('col.district')}>{a.snapshot.district}</td>
                    <td data-label={t('col.time')}>{t('feed.ago', { n: minutesAgo(a.createdAtMs, now) })}</td>
                    <td data-label={t('col.state')}><AssignmentBadge status={a.status} /></td>
                    <td data-label={t('crp.crew')}>{a.crew.vehicles.length || a.crew.staff.length ? <span className="crew-chips">{a.crew.vehicles.map((v) => <span className="badge" key={v.id}><Icon name="truck" size="sm" />{v.code}</span>)}<span className="badge"><Icon name="users" size="sm" /><Num>{a.crew.staff.length}</Num></span></span> : <span className="muted">—</span>}</td>
                    <td data-label={t('col.notes')}><Flags r={a.snapshot} /></td>
                    <td data-label={t('col.dist')}><Num>{(Math.round(distanceKm(a.snapshot, center) * 10) / 10).toFixed(1)}</Num> km</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
      </div>
    </>
  );
}
