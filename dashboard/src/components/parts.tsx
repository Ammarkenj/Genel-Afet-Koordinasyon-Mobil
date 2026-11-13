import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';
import { Icon } from './Icon';
import type { IconName } from './iconPaths';
import { setLang, type Lang } from '../i18n';

export function LangSwitch() {
  const { t, i18n } = useTranslation();
  return (
    <div className="seg" role="group" aria-label={t('lang.switch')}>
      {(['tr', 'ar'] as Lang[]).map((l) => (
        <button key={l} type="button" aria-pressed={i18n.language === l} onClick={() => setLang(l)}>{l.toUpperCase()}</button>
      ))}
    </div>
  );
}

export function ThemeButton({ theme, onToggle }: { theme: 'light' | 'dark'; onToggle: () => void }) {
  const { t } = useTranslation();
  return (
    <button type="button" className="btn icon-only" onClick={onToggle} aria-label={theme === 'dark' ? t('theme.light') : t('theme.dark')}>
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
    </button>
  );
}

export function KpiCard({ icon, tone, label, value, sub, subIcon }: { icon: IconName; tone: 'danger' | 'safe' | 'info' | 'warn'; label: string; value: number; sub: string; subIcon: IconName }) {
  return (
    <div className="card kpi">
      <div className="kpi-top"><span className={`kpi-ico ${tone}`}><Icon name={icon} /></span>{label}</div>
      <div className="kpi-val"><span className="num">{value}</span></div>
      <div className="kpi-sub"><Icon name={subIcon} size="sm" />{sub}</div>
    </div>
  );
}

export function CapBar({ occupied, capacity }: { occupied: number; capacity: number }) {
  const { t } = useTranslation();
  const p = occupied / capacity;
  const cls = p >= 1 ? 'full' : p >= 0.85 ? 'high' : '';
  return (
    <div className="cap">
      <div className="track"><span className={`fill ${cls}`} style={{ inlineSize: `${Math.min(p, 1) * 100}%` }} /></div>
      <span className="hint">{t('ar.of', { a: occupied, b: capacity })}</span>
    </div>
  );
}

/** Loading and error states for data-backed pages. */
export function DataGate({ loading, error, onRetry, children }: { loading: boolean; error: Error | null; onRetry: () => void; children: ReactNode }) {
  const { t } = useTranslation();
  if (error) {
    return (
      <div className="card" role="alert">
        <div className="callout warn"><Icon name="wifiOff" /><span>{t('common.error')}</span></div>
        <button type="button" className="btn" style={{ marginBlockStart: 12 }} onClick={onRetry}><Icon name="sync" size="sm" />{t('common.retry')}</button>
      </div>
    );
  }
  if (loading) return <div className="card muted" role="status"><Icon name="clock" /> {t('common.loading')}</div>;
  return <>{children}</>;
}

export function Num({ children }: { children: ReactNode }) {
  return <span className="num">{children}</span>;
}
