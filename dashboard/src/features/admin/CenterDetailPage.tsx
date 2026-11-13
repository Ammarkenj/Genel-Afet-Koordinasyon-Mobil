import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAdminData } from '../../data/AdminData';
import { useCenterRecords } from '../../data/useCenterRecords';
import { centerStats } from '../../domain/centerStats';
import { busyIds, fleetCounts, staffState, teamCounts, teamReadiness, teamStatus, vehicleState } from '../../domain/crew';
import { Icon } from '../../components/Icon';
import { AssignmentBadge, CenterStatusBadge, CenterTypeCell, INC_ICON } from '../../components/badges';
import { BarChart } from '../../components/BarChart';
import { StaffBadge, TeamStatusBadge, VehicleBadge, WorkDays } from '../../components/crewBadges';
import { isoDay } from '../../domain/workdays';
import { DataGate, KpiCard, Num } from '../../components/parts';
import { minutesAgo, useNow } from '../../hooks/useNow';

const DAY_MS = 86_400_000;

/** Read-only view of one center for the operations room: the same numbers the center sees on its own dashboard. */
export function CenterDetailPage() {
  const { t, i18n } = useTranslation();
  const { id = '' } = useParams();
  const { centers, assignments, loading, error, retry } = useAdminData();
  const now = useNow(60_000);
  const center = centers.find((c) => c.id === id);
  const mine = useMemo(() => assignments.filter((a) => a.centerId === id), [assignments, id]);
  const { staff, vehicles, teams } = useCenterRecords(id);

  const busy = useMemo(() => busyIds(mine), [mine]);
  const stats = useMemo(() => centerStats(mine, now), [mine, now]);
  const fleet = useMemo(() => fleetCounts(vehicles.data, busy), [vehicles.data, busy]);
  const team = useMemo(() => teamCounts(staff.data, busy, now), [staff.data, busy, now]);
  const crewRows = useMemo(() => teams.data.map((x) => teamReadiness(x, vehicles.data, staff.data, busy, now)), [teams.data, vehicles.data, staff.data, busy, now]);
  const labels = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(i18n.language, { weekday: 'short' });
    return stats.perDay.map((_, i) => (i === stats.perDay.length - 1 ? t('cd.today') : fmt.format(new Date(now - (stats.perDay.length - 1 - i) * DAY_MS))));
  }, [stats.perDay, now, i18n.language, t]);

  const min = (v: number | null) => (v === null ? t('ck.noData') : t('ck.minutes', { n: v }));

  return (
    <DataGate loading={loading} error={error} onRetry={retry}>
      <Link className="btn" to="/admin/centers" style={{ justifySelf: 'start' }}><Icon name="back" size="sm" flip />{t('cdt.back')}</Link>
      {!center ? (
        <div className="card"><div className="callout warn"><Icon name="alert" /><span>{t('cdt.notFound')}</span></div></div>
      ) : (
        <>
          <section className="card">
            <div className="cell" style={{ gap: 12, flexWrap: 'wrap' }}>
              <b style={{ font: 'var(--text-headline)', fontSize: 22 }}>{center.name}</b>
              <CenterTypeCell type={center.type} />
              <CenterStatusBadge status={center.status} />
              {!center.active && <span className="badge"><Icon name="lock" size="sm" />{t('acc.disabled')}</span>}
            </div>
            <div className="kv-row" style={{ marginBlockStart: 12 }}><span>{t('cf.phone')}</span><b dir="ltr">{center.phone || '—'}</b></div>
            <div className="kv-row"><span>{t('cf.address')}</span><b>{center.address || '—'}</b></div>
            <div className="kv-row"><span>{t('cf.email')}</span><b dir="ltr">{center.email}</b></div>
            <p className="hint" style={{ marginBlockStart: 8 }}><Icon name="lock" size="sm" /> {t('cdt.readOnly')}</p>
          </section>

          <div className="g-auto">
            <KpiCard icon="bell" tone="info" label={t('ck.active')} value={stats.active} subIcon="clock" sub={`${t('ck.receivedToday')}: ${stats.receivedToday}`} />
            <KpiCard icon="checkCircle" tone="safe" label={t('ck.doneToday')} value={stats.doneToday} subIcon="calendar" sub={t('cd.today')} />
            <div className="card kpi">
              <div className="kpi-top"><span className="kpi-ico warn"><Icon name="timer" /></span>{t('ck.accept')}</div>
              <div className="kpi-val"><span className="num">{min(stats.avgAcceptMin)}</span></div>
              <div className="kpi-sub"><Icon name="calendar" size="sm" />{t('ck.last7')}</div>
            </div>
            <div className="card kpi">
              <div className="kpi-top"><span className="kpi-ico warn"><Icon name="route" /></span>{t('ck.arrive')}</div>
              <div className="kpi-val"><span className="num">{min(stats.avgArriveMin)}</span></div>
              <div className="kpi-sub"><Icon name="calendar" size="sm" />{t('ck.last7')}</div>
            </div>
            <div className="card kpi">
              <div className="kpi-top"><span className="kpi-ico info"><Icon name="truck" /></span>{t('ck.vehicles')}</div>
              <div className="kpi-val"><span className="num">{fleet.ready}</span><span className="muted" style={{ fontSize: 18 }}> / <Num>{fleet.total}</Num></span></div>
              <div className="kpi-sub"><Icon name="check" size="sm" />{t('ck.vehiclesSub', { r: fleet.ready, m: fleet.onMission })}</div>
            </div>
            <div className="card kpi">
              <div className="kpi-top"><span className="kpi-ico info"><Icon name="users" /></span>{t('ck.staff')}</div>
              <div className="kpi-val"><span className="num">{team.onDuty}</span><span className="muted" style={{ fontSize: 18 }}> / <Num>{team.total}</Num></span></div>
              <div className="kpi-sub"><Icon name="check" size="sm" />{t('ck.staffSub', { d: team.onDuty, m: team.onMission })}</div>
            </div>
          </div>

          <BarChart values={stats.perDay} labels={labels} title={t('cd.perDay')} labelHeader={t('col.time')} valueHeader={t('chart.count')} />

          <div className="grid g-1-1">
            <section className="card" aria-labelledby="h-veh">
              <div className="card-h"><h2 id="h-veh">{t('cdt.vehicles')}</h2></div>
              {vehicles.data.length === 0 ? <p className="empty">{t('vh.empty')}</p> : (
                <div className="tbl-wrap"><table>
                  <thead><tr><th>{t('vh.code')}</th><th>{t('vh.kind')}</th><th>{t('vh.seats')}</th><th>{t('vh.status')}</th></tr></thead>
                  <tbody>{vehicles.data.map((v) => (
                    <tr key={v.id} style={{ cursor: 'default' }}><td><b dir="ltr">{v.code}</b></td><td>{t(`vkind.${v.kind}`)}</td><td><Num>{v.seats}</Num></td><td><VehicleBadge state={vehicleState(v, busy)} /></td></tr>
                  ))}</tbody>
                </table></div>
              )}
            </section>
            <section className="card" aria-labelledby="h-staff">
              <div className="card-h"><h2 id="h-staff">{t('cdt.staff')}</h2></div>
              {staff.data.length === 0 ? <p className="empty">{t('st.empty')}</p> : (
                <div className="tbl-wrap"><table>
                  <thead><tr><th>{t('st.name')}</th><th>{t('st.role')}</th><th>{t('st.days')}</th><th>{t('cf.phone')}</th><th>{t('st.status')}</th></tr></thead>
                  <tbody>{staff.data.map((m) => (
                    <tr key={m.id} style={{ cursor: 'default' }}><td><b>{m.name}</b></td><td>{t(`srole.${m.role}`)}</td><td><WorkDays days={m.workDays} today={isoDay(now)} /></td><td><span dir="ltr">{m.phone || '—'}</span></td><td><StaffBadge state={staffState(m, busy, now)} /></td></tr>
                  ))}</tbody>
                </table></div>
              )}
            </section>
          </div>

          <section className="card" aria-labelledby="h-crews">
            <div className="card-h"><h2 id="h-crews">{t('crw.title')}</h2></div>
            {crewRows.length === 0 ? <p className="empty">{t('crw.empty')}</p> : (
              <div className="tbl-wrap"><table>
                <thead><tr><th>{t('crw.name')}</th><th>{t('crw.vehicle')}</th><th>{t('crw.members')}</th><th>{t('crw.days')}</th><th>{t('crw.todayCol')}</th></tr></thead>
                <tbody>{crewRows.map((r) => (
                  <tr key={r.team.id} style={{ cursor: 'default' }}>
                    <td><b>{r.team.name}</b></td>
                    <td>{r.vehicle ? <span dir="ltr">{r.vehicle.code}</span> : <span className="muted">{r.team.vehicleId ? t('crw.noVehicle') : t('crw.noVehicleByDesign')}</span>}</td>
                    <td><span className="crew-chips">{r.members.map((m) => <span className="badge" key={m.member.id}>{m.isLeader && <Icon name="idCard" size="sm" />}{m.member.name}</span>)}</span></td>
                    <td><WorkDays days={r.team.workDays} today={isoDay(now)} /></td>
                    <td><TeamStatusBadge status={teamStatus(r)} /></td>
                  </tr>
                ))}</tbody>
              </table></div>
            )}
          </section>

          <section className="card" aria-labelledby="h-rec">
            <div className="card-h"><h2 id="h-rec">{t('cdt.recent')}</h2></div>
            {mine.length === 0 ? <p className="empty">{t('cd.noRecent')}</p> : (
              <div className="tbl-wrap"><table>
                <thead><tr><th>{t('col.id')}</th><th>{t('col.type')}</th><th>{t('col.district')}</th><th>{t('col.time')}</th><th>{t('col.state')}</th><th>{t('crp.crew')}</th></tr></thead>
                <tbody>{mine.slice(0, 12).map((a) => (
                  <tr key={a.id} style={{ cursor: 'default' }}>
                    <td><Link to={`/admin/reports?r=${a.reportId}`}><b><Num>#{a.snapshot.no}</Num></b></Link></td>
                    <td><span className="cell"><Icon name={INC_ICON[a.snapshot.type ?? 'other']} />{t(`inc.${a.snapshot.type ?? 'other'}`)}</span></td>
                    <td>{a.snapshot.district}</td>
                    <td>{t('feed.ago', { n: minutesAgo(a.createdAtMs, now) })}</td>
                    <td><AssignmentBadge status={a.status} /></td>
                    <td>{a.crew.vehicles.length || a.crew.staff.length
                      ? <span className="crew-chips">{a.crew.teams.map((n) => <span className="badge" key={n}><Icon name="users" size="sm" />{n}</span>)}{a.crew.vehicles.map((v) => <span className="badge info" key={v.id}><Icon name="truck" size="sm" /><span dir="ltr">{v.code}</span></span>)}<span className="badge"><Icon name="users" size="sm" /><Num>{a.crew.staff.length}</Num></span></span>
                      : <span className="muted">{t('cdt.noCrew')}</span>}</td>
                  </tr>
                ))}</tbody>
              </table></div>
            )}
          </section>
        </>
      )}
    </DataGate>
  );
}
