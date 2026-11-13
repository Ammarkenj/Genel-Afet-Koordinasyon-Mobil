import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAdminData } from '../../data/AdminData';
import { chartMax, countByType, hourlyCounts } from '../../domain/stats';
import { Icon } from '../../components/Icon';
import { DelBadge, INC_ICON, NEED_ICON, Urgency } from '../../components/badges';
import { DataGate, KpiCard, Num } from '../../components/parts';
import { minutesAgo, useNow } from '../../hooks/useNow';
import type { IncidentType } from '../../domain/types';

function HourlyChart({ counts }: { counts: number[] }) {
  const { t, i18n } = useTranslation();
  const w = 640, h = 200, pl = 30, pb = 24, pt = 20, bw = 32;
  const max = chartMax(counts);
  const gap = (w - pl - 8 - 12 * bw) / 11;
  const unit = i18n.language === 'ar' ? ' س' : ' s';
  return (
    <svg className="chart" viewBox={`0 0 ${w} ${h}`} role="img" aria-label={t('ov.hourly')}>
      <title>{t('ov.hourly')}</title>
      {[0, 1, 2, 3, 4].map((i) => {
        const v = (max / 4) * i;
        const y = pt + (h - pt - pb) * (1 - v / max);
        return (
          <g key={i}>
            <line className="grid-l" x1={pl} x2={w} y1={y} y2={y} />
            <text x={pl - 6} y={y + 4} textAnchor="end">{Math.round(v)}</text>
          </g>
        );
      })}
      {counts.map((v, i) => {
        const x = pl + i * (bw + gap);
        const bh = (h - pt - pb) * (v / max);
        const y = h - pb - bh;
        return (
          <g key={i}>
            <rect className="bar" x={x} y={y} width={bw} height={bh} rx={4} />
            <text className="val" x={x + bw / 2} y={y - 5} textAnchor="middle">{v}</text>
            <text x={x + bw / 2} y={h - 6} textAnchor="middle" direction="ltr" unicodeBidi="isolate">
              {i === counts.length - 1 ? t('chart.now') : `−${counts.length - 1 - i}${unit}`}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function OverviewPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { reports, needs, tasks, volunteers, loading, error, retry, live } = useAdminData();
  const now = useNow();
  const [asTable, setAsTable] = useState(false);

  const counts = useMemo(() => hourlyCounts(reports, now), [reports, now]);
  const byType = useMemo(() => countByType(reports), [reports]);
  const recent = reports.slice(0, 7);
  const topNeeds = useMemo(() => needs.slice().sort((a, b) => b.urgency - a.urgency).slice(0, 4), [needs]);

  const activeHelp = reports.filter((r) => r.kind === 'help' && r.ops !== 'resolved');
  const dayAgo = now - 24 * 3_600_000;

  return (
    <DataGate loading={loading} error={error} onRetry={retry}>
      <div className="grid g-kpi">
        <KpiCard icon="lifebuoy" tone="danger" label={t('kpi.active')} value={activeHelp.length} subIcon="bell" sub={t('kpi.activeSub', { n: activeHelp.filter((r) => r.ops === 'new').length })} />
        <KpiCard icon="shieldCheck" tone="safe" label={t('kpi.safe')} value={reports.filter((r) => r.kind === 'safe' && r.createdAtMs >= dayAgo).length} subIcon="clock" sub={t('kpi.safeSub')} />
        <KpiCard icon="clock" tone="warn" label={t('kpi.queued')} value={reports.filter((r) => r.state !== 'sent').length} subIcon="wifiOff" sub={t('kpi.queuedSub')} />
        <KpiCard icon="users" tone="info" label={t('kpi.vol')} value={volunteers.filter((v) => v.active).length} subIcon="route" sub={t('kpi.volSub', { n: tasks.filter((x) => !x.done).length })} />
        <KpiCard icon="drop" tone="warn" label={t('kpi.urgent')} value={needs.filter((n) => n.urgency >= 2).length} subIcon="alert" sub={t('kpi.urgentSub')} />
      </div>

      <div className="grid g-2-1">
        <div className="grid" style={{ alignContent: 'start' }}>
          <section className="card" aria-labelledby="h-hourly">
            <div className="card-h">
              <div><h2 id="h-hourly">{t('ov.hourly')}</h2><div className="hint">{t('ov.hourlySub')}</div></div>
              <span className="grow" />
              <button type="button" className="btn" aria-pressed={asTable} onClick={() => setAsTable((v) => !v)}>
                <Icon name={asTable ? 'chevron' : 'clipboard'} />{asTable ? t('chart.chart') : t('chart.table')}
              </button>
            </div>
            {asTable ? (
              <div className="tbl-wrap">
                <table>
                  <thead><tr><th>{t('chart.hour')}</th><th>{t('chart.count')}</th></tr></thead>
                  <tbody>
                    {counts.map((v, i) => (
                      <tr key={i} style={{ cursor: 'default' }}><td>{i === counts.length - 1 ? t('chart.now') : `−${counts.length - 1 - i}`}</td><td><Num>{v}</Num></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <HourlyChart counts={counts} />
            )}
          </section>

          <div className="grid g-1-1">
            <section className="card" aria-labelledby="h-type">
              <div className="card-h"><h2 id="h-type">{t('ov.byType')}</h2></div>
              {byType.length === 0 ? (
                <p className="empty">{t('common.noData')}</p>
              ) : (
                <div className="hbars">
                  {byType.map(([type, n]) => (
                    <div className="hbar" key={type}>
                      <Icon name={INC_ICON[type as IncidentType]} />
                      <span>{t(`inc.${type}`)}</span>
                      <span className="track"><span className="fill" style={{ inlineSize: `${(n / (byType[0]?.[1] ?? 1)) * 100}%` }} /></span>
                      <b><Num>{n}</Num></b>
                    </div>
                  ))}
                </div>
              )}
            </section>
            <section className="card" aria-labelledby="h-needs">
              <div className="card-h"><h2 id="h-needs">{t('ov.needs')}</h2></div>
              {topNeeds.length === 0 ? (
                <p className="empty">{t('common.noData')}</p>
              ) : (
                <ul className="feed">
                  {topNeeds.map((n) => (
                    <li key={n.id}>
                      <span className="ev-ico" style={{ background: 'var(--warn-soft)', color: 'var(--warn-text)' }}><Icon name={NEED_ICON[n.need]} /></span>
                      <div><div className="t">{t(`need.${n.need}`)} · {n.district}</div><div className="m"><Urgency level={n.urgency} /></div></div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>

        <section className="card" aria-labelledby="h-feed" style={{ alignSelf: 'start' }}>
          <div className="card-h">
            <h2 id="h-feed">{t('ov.feed')}</h2>
            <span className="grow" />
            <span className={`badge ${live ? 'safe' : 'warn'}`}><Icon name={live ? 'wifi' : 'clock'} size="sm" />{live ? t('live.on') : t('live.paused')}</span>
          </div>
          {recent.length === 0 ? (
            <p className="empty">{t('ov.noFeed')}</p>
          ) : (
            <ul className="feed" aria-live={live ? 'polite' : 'off'}>
              {recent.map((r) => (
                <li key={r.id}>
                  <span className={`ev-ico ${r.kind === 'safe' ? 'safe' : ''}`}><Icon name={r.kind === 'safe' ? 'shieldCheck' : INC_ICON[r.type ?? 'other']} /></span>
                  <div>
                    <div className="t">{r.kind === 'safe' ? t('kind.safe') : t(`inc.${r.type ?? 'other'}`)} · {r.district}</div>
                    <div className="m">{t('feed.ago', { n: minutesAgo(r.createdAtMs, now) })} <DelBadge state={r.state} /></div>
                  </div>
                  <button type="button" className="btn icon-only" onClick={() => navigate(`/admin/reports?r=${r.id}`)} aria-label={t('dr.title', { n: r.no })}><Icon name="chevron" flip /></button>
                </li>
              ))}
            </ul>
          )}
          <Link className="btn" style={{ marginBlockStart: 12, inlineSize: '100%' }} to="/admin/reports">{t('feed.openAll')}<Icon name="chevron" flip /></Link>
        </section>
      </div>
    </DataGate>
  );
}
