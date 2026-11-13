import { useMemo, useState, type KeyboardEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAdminData } from '../../data/AdminData';
import { INCIDENT_TYPES, type DeliveryState, type OpsStatus, type Report } from '../../domain/types';
import { Icon } from '../../components/Icon';
import { CT_ICON, DelBadge, Flags, OpsBadge, TypeCell } from '../../components/badges';
import { DataGate, Num } from '../../components/parts';
import { minutesAgo, useNow } from '../../hooks/useNow';
import { ReportDrawer } from './ReportDrawer';

interface Filters {
  q: string;
  type: string;
  del: '' | DeliveryState;
  ops: '' | OpsStatus;
  injured: boolean;
  trapped: boolean;
}
const EMPTY: Filters = { q: '', type: '', del: '', ops: '', injured: false, trapped: false };

function matches(r: Report, f: Filters): boolean {
  const q = f.q.trim().toLowerCase();
  if (q && !String(r.no).includes(q) && !r.district.toLowerCase().includes(q)) return false;
  if (f.type && (f.type === 'safe' ? r.kind !== 'safe' : r.type !== f.type)) return false;
  if (f.del && r.state !== f.del) return false;
  if (f.ops && r.ops !== f.ops) return false;
  if (f.injured && !r.injured) return false;
  if (f.trapped && !r.trapped) return false;
  return true;
}

export function ReportsPage() {
  const { t } = useTranslation();
  const { reports, assignments, centers, loading, error, retry } = useAdminData();
  const now = useNow();
  const [params, setParams] = useSearchParams();
  const [f, setF] = useState<Filters>(EMPTY);
  const openId = params.get('r');

  const rows = useMemo(() => reports.filter((r) => matches(r, f)), [reports, f]);
  const selected = openId ? reports.find((r) => r.id === openId) : undefined;

  const open = (id: string) => setParams({ r: id });
  const close = () => setParams({});
  const onKey = (e: KeyboardEvent, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      open(id);
    }
  };

  const select = (id: string, label: string, value: string, set: (v: string) => void, opts: [string, string][]) => (
    <label className="field">
      <span>{label}</span>
      <select className="select" id={id} value={value} onChange={(e) => set(e.target.value)}>
        <option value="">{t('rep.all')}</option>
        {opts.map(([v, text]) => <option key={v} value={v}>{text}</option>)}
      </select>
    </label>
  );

  const assignCell = (r: Report) => {
    if (r.kind !== 'help') return <span className="muted">—</span>;
    const mine = assignments.filter((a) => a.reportId === r.id);
    if (mine.length === 0) return <span className="muted">{t('rep.noCenters')}</span>;
    const types = [...new Set(mine.map((a) => centers.find((c) => c.id === a.centerId)?.type).filter((x): x is NonNullable<typeof x> => !!x))];
    return <span className="cell">{types.map((ty) => <Icon key={ty} name={CT_ICON[ty]} size="sm" />)}{t('rep.centersN', { n: mine.length })}</span>;
  };

  return (
    <DataGate loading={loading} error={error} onRetry={retry}>
      <section className="card" aria-labelledby="h-rep">
        <h2 id="h-rep" className="sr-only">{t('rep.title')}</h2>
        <div className="filters">
          <label className="field grow">
            <span>{t('rep.search')}</span>
            <span className="input-wrap"><Icon name="search" /><input className="input" id="f-q" type="search" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} /></span>
          </label>
          {select('f-type', t('rep.type'), f.type, (v) => setF({ ...f, type: v }), [...INCIDENT_TYPES.map((k) => [k, t(`inc.${k}`)] as [string, string]), ['safe', t('kind.safe')]])}
          {select('f-del', t('rep.del'), f.del, (v) => setF({ ...f, del: v as Filters['del'] }), (['sent', 'queued', 'sending'] as const).map((k) => [k, t(`del.${k}`)]))}
          {select('f-ops', t('rep.ops'), f.ops, (v) => setF({ ...f, ops: v as Filters['ops'] }), (['new', 'dispatched', 'resolved'] as const).map((k) => [k, t(`ops.${k}`)]))}
          <div className="layer-toggles">
            <button type="button" className="chip" aria-pressed={f.injured} onClick={() => setF({ ...f, injured: !f.injured })}><Icon name="firstAid" size="sm" />{t('rep.injured')}</button>
            <button type="button" className="chip" aria-pressed={f.trapped} onClick={() => setF({ ...f, trapped: !f.trapped })}><Icon name="alert" size="sm" />{t('rep.trapped')}</button>
          </div>
        </div>
        <div className="result-count" style={{ marginBlock: '12px 8px' }} role="status">{t('rep.results', { n: rows.length })}</div>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('col.id')}</th><th>{t('col.type')}</th><th>{t('col.time')}</th><th>{t('col.district')}</th><th>{t('col.people')}</th>
                <th>{t('col.notes')}</th><th>{t('col.del')}</th><th>{t('col.centers')}</th><th>{t('col.ops')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr style={{ cursor: 'default' }}><td colSpan={9} className="muted" style={{ padding: 32, textAlign: 'center' }}><Icon name="search" /> {reports.length === 0 ? t('rep.noReports') : t('rep.empty')}</td></tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} tabIndex={0} aria-selected={selected?.id === r.id} onClick={() => open(r.id)} onKeyDown={(e) => onKey(e, r.id)}>
                    <td><b><Num>#{r.no}</Num></b></td>
                    <td><TypeCell r={r} /></td>
                    <td>{t('feed.ago', { n: minutesAgo(r.createdAtMs, now) })}</td>
                    <td>{r.district}</td>
                    <td><Num>{r.people}</Num></td>
                    <td><Flags r={r} /></td>
                    <td><DelBadge state={r.state} /></td>
                    <td>{assignCell(r)}</td>
                    <td><OpsBadge ops={r.ops} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
      {selected && <ReportDrawer key={selected.id} report={selected} onClose={close} />}
    </DataGate>
  );
}
