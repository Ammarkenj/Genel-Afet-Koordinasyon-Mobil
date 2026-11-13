import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from './Icon';
import { Num } from './parts';

interface Props {
  values: number[];
  labels: string[];
  title: string;
  /** Column header of the label column in the table view. */
  labelHeader: string;
  valueHeader: string;
  /** Highlight the last bar (today / now) with bold text. */
  hint?: string;
}

/** Simple bar chart with a "show as table" alternative, so the numbers never depend on seeing the chart. */
export function BarChart({ values, labels, title, labelHeader, valueHeader, hint }: Props) {
  const { t } = useTranslation();
  const [asTable, setAsTable] = useState(false);
  const max = Math.max(4, Math.ceil(Math.max(0, ...values) / 4) * 4);
  const w = 640, h = 200, pl = 30, pb = 24, pt = 20;
  const n = Math.max(1, values.length);
  const bw = Math.min(56, (w - pl - 8) / n - 12);
  const gap = (w - pl - 8 - n * bw) / Math.max(1, n - 1);

  return (
    <section className="card" aria-label={title}>
      <div className="card-h">
        <div><h2>{title}</h2>{hint && <div className="hint">{hint}</div>}</div>
        <span className="grow" />
        <button type="button" className="btn" aria-pressed={asTable} onClick={() => setAsTable((v) => !v)}>
          <Icon name={asTable ? 'chart' : 'clipboard'} />{asTable ? t('chart.chart') : t('chart.table')}
        </button>
      </div>
      {asTable ? (
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>{labelHeader}</th><th>{valueHeader}</th></tr></thead>
            <tbody>{values.map((v, i) => <tr key={i} style={{ cursor: 'default' }}><td>{labels[i]}</td><td><Num>{v}</Num></td></tr>)}</tbody>
          </table>
        </div>
      ) : (
        <svg className="chart" viewBox={`0 0 ${w} ${h}`} role="img" aria-label={title}>
          <title>{title}</title>
          {[0, 1, 2, 3, 4].map((i) => {
            const v = (max / 4) * i; // max is a multiple of 4, so every tick is a whole number
            const y = pt + (h - pt - pb) * (1 - v / max);
            return (
              <g key={i}>
                <line className="grid-l" x1={pl} x2={w} y1={y} y2={y} />
                <text x={pl - 6} y={y + 4} textAnchor="end">{Math.round(v)}</text>
              </g>
            );
          })}
          {values.map((v, i) => {
            const x = pl + i * (bw + gap);
            const bh = (h - pt - pb) * (v / max);
            const y = h - pb - bh;
            return (
              <g key={i}>
                <rect className="bar" x={x} y={y} width={bw} height={bh} rx={4} />
                <text className="val" x={x + bw / 2} y={y - 5} textAnchor="middle">{v}</text>
                <text x={x + bw / 2} y={h - 6} textAnchor="middle" direction="ltr" unicodeBidi="isolate">{labels[i]}</text>
              </g>
            );
          })}
        </svg>
      )}
    </section>
  );
}
