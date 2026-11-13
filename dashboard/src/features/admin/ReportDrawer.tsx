import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAdminData } from '../../data/AdminData';
import { assignReport, setReportOps } from '../../data/repos';
import { freeVehicleCount } from '../../domain/crew';
import { isPriorityReport, suggestCenters } from '../../domain/suggestCenters';
import type { Report } from '../../domain/types';
import { Drawer } from '../../components/Dialog';
import { Icon } from '../../components/Icon';
import { AssignmentBadge, CenterStatusBadge, CenterTypeIco, DelBadge, Flags, OpsBadge, TypeCell } from '../../components/badges';
import { Num } from '../../components/parts';
import { useToast } from '../../components/Toast';
import { minutesAgo, useNow } from '../../hooks/useNow';

/** Report details, who it is assigned to, suggested centers and the operator's actions. */
export function ReportDrawer({ report, onClose }: { report: Report; onClose: () => void }) {
  const { t } = useTranslation();
  const toast = useToast();
  const now = useNow();
  const { centers, assignments } = useAdminData();
  const [picked, setPicked] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mine = useMemo(() => assignments.filter((a) => a.reportId === report.id), [assignments, report.id]);
  const open = report.kind === 'help' && report.ops !== 'resolved';
  const suggestions = useMemo(
    () => (open ? suggestCenters(report, centers, { skip: mine.map((a) => a.centerId), freeVehicles: (c) => freeVehicleCount(c, assignments) }) : []),
    [open, report, centers, mine, assignments],
  );
  const selected = (picked ?? suggestions.filter((s) => !s.busy).map((s) => s.center.id)).filter((id) => suggestions.some((s) => s.center.id === id));
  const priority = isPriorityReport(report) && open;

  const toggle = (id: string) => setPicked(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  const run = async (fn: () => Promise<void>, done?: () => void) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      done?.();
    } catch {
      setError('sug.failed');
    } finally {
      setBusy(false);
    }
  };

  const assign = () =>
    run(
      () => assignReport(report, selected),
      () => {
        toast.show(t('sug.sent', { n: selected.length }));
        setPicked(null);
      },
    );
  const setOps = (ops: Report['ops']) => run(() => setReportOps(report.id, ops), () => toast.show(t('common.saved')));

  return (
    <Drawer
      titleId="dr-t"
      onClose={onClose}
      title={t('dr.title', { n: report.no })}
      footer={
        open ? (
          <>
            <button type="button" className="btn primary" style={{ minBlockSize: 52 }} onClick={assign} disabled={busy || selected.length === 0} aria-describedby={selected.length === 0 ? 'assign-hint' : undefined}>
              <Icon name="building" />{t('sug.assign', { n: selected.length })}
            </button>
            {selected.length === 0 && <span className="hint-btn" id="assign-hint">{suggestions.length ? t('sug.pickOne') : t('sug.none')}</span>}
            <button type="button" className="btn" style={{ minBlockSize: 52 }} onClick={() => setOps('dispatched')} disabled={busy || report.ops === 'dispatched'}><Icon name="route" />{t('dr.dispatch')}</button>
            <button type="button" className="btn safe" style={{ minBlockSize: 52 }} onClick={() => setOps('resolved')} disabled={busy}><Icon name="checkCircle" />{t('dr.resolve')}</button>
          </>
        ) : (
          <button type="button" className="btn" style={{ minBlockSize: 52 }} onClick={() => setOps('new')} disabled={busy}><Icon name="sync" />{t('dr.reopen')}</button>
        )
      }
    >
      <div className="cell" style={{ gap: 12, flexWrap: 'wrap' }}>
        <b style={{ font: 'var(--text-title)' }}><TypeCell r={report} /></b>
        <OpsBadge ops={report.ops} />
        <DelBadge state={report.state} />
      </div>
      {report.trapped && <div className="callout danger"><Icon name="alert" /><span>{t('dr.trappedNote')}</span></div>}
      {report.state !== 'sent' && <div className="callout warn"><Icon name="clock" /><span>{t('dr.queuedNote')}</span></div>}
      {error && <div className="callout danger" role="alert"><Icon name="alert" /><span>{t(error)}</span></div>}
      <div>
        <div className="kv-row"><span>{t('dr.where')}</span><b>{report.district}</b></div>
        <div className="kv-row"><span>{t('dr.when')}</span><b>{t('feed.ago', { n: minutesAgo(report.createdAtMs, now) })}</b></div>
        <div className="kv-row"><span>{t('dr.who')}</span><b><Num>{report.people}</Num></b></div>
        <div className="kv-row"><span>{t('dr.how')}</span><b>{report.auto ? t('flag.auto') : t('dr.manual')}</b></div>
        <div className="kv-row"><span>{t('col.notes')}</span><Flags r={report} /></div>
      </div>

      {priority && <div className="callout danger"><Icon name="alert" /><span>{t('sug.priority')}</span></div>}

      <div>
        <h3>{t('as.title')}</h3>
        {mine.length === 0 ? (
          <p className="muted">{t('as.none')}</p>
        ) : (
          mine.map((a) => {
            const c = centers.find((x) => x.id === a.centerId);
            return (
              <div className="asg" key={a.id}>
                {c ? <CenterTypeIco type={c.type} /> : <span />}
                <div><b>{c?.name ?? a.centerId}</b><div className="hint">{c ? t(`ctype.${c.type}`) : ''} · {t('cp.assignedAgo', { n: minutesAgo(a.createdAtMs, now) })}</div>{(a.crew.vehicles.length > 0 || a.crew.staff.length > 0) && <div className="crew-chips" style={{ marginBlockStart: 6 }}>{a.crew.teams.map((n) => <span className="badge" key={n}><Icon name="users" size="sm" />{n}</span>)}{a.crew.vehicles.map((v) => <span className="badge info" key={v.id}><Icon name="truck" size="sm" /><span dir="ltr">{v.code}</span></span>)}<span className="badge"><Icon name="users" size="sm" /><Num>{a.crew.staff.length}</Num></span></div>}</div>
                <AssignmentBadge status={a.status} />
              </div>
            );
          })
        )}
      </div>

      {open && (
        <div>
          <h3>{t('sug.title')}</h3>
          <p className="hint" style={{ marginBlockEnd: 8 }}>{t('sug.hint')}</p>
          <div className="sug-list">
            {suggestions.length === 0 ? (
              <p className="muted">{t('sug.none')}</p>
            ) : (
              suggestions.map((s) => (
                <label className="sug" key={s.center.id}>
                  <input type="checkbox" checked={selected.includes(s.center.id)} onChange={() => toggle(s.center.id)} />
                  <CenterTypeIco type={s.type} />
                  <span>
                    <span className="t">{s.center.name}</span>
                    <span className="m">
                      <CenterStatusBadge status={s.center.status} />
                      <span>{t('sug.km', { n: s.km, m: s.etaMin })}</span>
                      <span>{t(`why.${s.reason}`)}</span>
                      {s.freeVehicles !== null && <span><Icon name="truck" size="sm" /> {t('sug.vehicles', { free: s.freeVehicles, ready: s.readyVehicles ?? 0 })}</span>}
                      {s.busy && <span><Icon name="clock" size="sm" /> {t(s.noFreeVehicle ? 'sug.noVehicle' : 'sug.busy')}</span>}
                    </span>
                  </span>
                </label>
              ))
            )}
          </div>
        </div>
      )}
    </Drawer>
  );
}
