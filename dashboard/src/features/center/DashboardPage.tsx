import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCenterData } from '../../data/CenterData';
import { setOwnCenterStatus } from '../../data/repos';
import { CENTER_STATUSES } from '../../domain/types';
import { Icon } from '../../components/Icon';
import { AssignmentBadge, CSTAT_ICON, INC_ICON } from '../../components/badges';
import { BarChart } from '../../components/BarChart';
import { KpiCard, Num } from '../../components/parts';
import { useToast } from '../../components/Toast';
import { useOnline } from '../../hooks/useOnline';
import { minutesAgo, useNow } from '../../hooks/useNow';
import { useState } from 'react';
import { useCenterDerived } from './centerUi';

const DAY_MS = 86_400_000;

export function DashboardPage() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const online = useOnline();
  const now = useNow();
  const { center, centerId, assignments } = useCenterData();
  const { stats, fleet, team } = useCenterDerived();
  const [failure, setFailure] = useState(false);

  const labels = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(i18n.language, { weekday: 'short' });
    return stats.perDay.map((_, i) => (i === stats.perDay.length - 1 ? t('cd.today') : fmt.format(new Date(now - (stats.perDay.length - 1 - i) * DAY_MS))));
  }, [stats.perDay, now, i18n.language, t]);

  if (!center) return null;
  const recent = assignments.slice(0, 6);
  const min = (v: number | null) => (v === null ? t('ck.noData') : t('ck.minutes', { n: v }));

  const setStatus = async (status: (typeof CENTER_STATUSES)[number]) => {
    setFailure(false);
    try {
      await setOwnCenterStatus(centerId, status);
      toast.show(t('common.saved'));
    } catch {
      setFailure(true);
    }
  };

  return (
    <>
      <div className="page-h"><h1>{t('cnav.dashboard')}</h1></div>

      <section className="card" aria-labelledby="h-st">
        <div className="card-h"><h2 id="h-st">{t('cd.status')}</h2></div>
        {failure && <div className="callout danger" role="alert" style={{ marginBlockEnd: 12 }}><Icon name="alert" /><span>{t('cp.updateFail')}</span></div>}
        <div className="seg wide" role="group" aria-labelledby="h-st">
          {CENTER_STATUSES.map((k) => (
            <button key={k} type="button" aria-pressed={center.status === k} disabled={!online} onClick={() => void setStatus(k)}>
              <Icon name={CSTAT_ICON[k]} size="sm" />{t(`cstat.${k}`)}
            </button>
          ))}
        </div>
        {!online && <p className="hint" style={{ marginBlockStart: 8 }}><Icon name="wifiOff" size="sm" /> {t('cp.noNet')}</p>}
      </section>

      <div className="g-auto">
        <KpiCard icon="bell" tone="info" label={t('ck.active')} value={stats.active} subIcon="clock" sub={t('ck.receivedToday')+': '+stats.receivedToday} />
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
        <Link to="/center/vehicles" className="card kpi" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="kpi-top"><span className="kpi-ico info"><Icon name="truck" /></span>{t('ck.vehicles')}</div>
          <div className="kpi-val"><span className="num">{fleet.ready}</span><span className="muted" style={{ fontSize: 18 }}> / <Num>{fleet.total}</Num></span></div>
          <div className="kpi-sub"><Icon name="check" size="sm" />{t('ck.vehiclesSub', { r: fleet.ready, m: fleet.onMission })}</div>
        </Link>
        <Link to="/center/staff" className="card kpi" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="kpi-top"><span className="kpi-ico info"><Icon name="users" /></span>{t('ck.staff')}</div>
          <div className="kpi-val"><span className="num">{team.onDuty}</span><span className="muted" style={{ fontSize: 18 }}> / <Num>{team.total}</Num></span></div>
          <div className="kpi-sub"><Icon name="check" size="sm" />{t('ck.staffSub', { d: team.onDuty, m: team.onMission })}</div>
        </Link>
      </div>

      <div className="grid g-2-1">
        <BarChart values={stats.perDay} labels={labels} title={t('cd.perDay')} labelHeader={t('col.time')} valueHeader={t('chart.count')} />
        <section className="card" aria-labelledby="h-bytype">
          <div className="card-h"><h2 id="h-bytype">{t('cd.byType')}</h2></div>
          {stats.byType.length === 0 ? (
            <p className="empty">{t('common.noData')}</p>
          ) : (
            <div className="hbars">
              {stats.byType.map(([type, n]) => (
                <div className="hbar" key={type}>
                  <Icon name={INC_ICON[type as keyof typeof INC_ICON] ?? 'alert'} />
                  <span>{t(`inc.${type}`)}</span>
                  <span className="track"><span className="fill" style={{ inlineSize: `${(n / (stats.byType[0]?.[1] ?? 1)) * 100}%` }} /></span>
                  <b><Num>{n}</Num></b>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="card" aria-labelledby="h-recent">
        <div className="card-h">
          <h2 id="h-recent">{t('cd.recent')}</h2>
          <span className="grow" />
          <Link className="btn" to="/center/reports">{t('cd.openAll')}<Icon name="chevron" flip /></Link>
        </div>
        {recent.length === 0 ? (
          <p className="empty">{t('cd.noRecent')}</p>
        ) : (
          <ul className="feed">
            {recent.map((a) => (
              <li key={a.id}>
                <span className="ev-ico"><Icon name={INC_ICON[a.snapshot.type ?? 'other']} /></span>
                <div>
                  <div className="t">{t(`inc.${a.snapshot.type ?? 'other'}`)} · {a.snapshot.district}</div>
                  <div className="m">{t('cp.assignedAgo', { n: minutesAgo(a.createdAtMs, now) })} <AssignmentBadge status={a.status} /></div>
                </div>
                <Link className="btn icon-only" to={`/center/reports/${a.id}`} aria-label={`${t('cp.open')}: ${t(`inc.${a.snapshot.type ?? 'other'}`)} ${a.snapshot.district}`}><Icon name="chevron" flip /></Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
