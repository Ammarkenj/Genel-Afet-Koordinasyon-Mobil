import { useEffect, useRef } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCenterData } from '../../data/CenterData';
import { useAuth } from '../../firebase/auth';
import { playAlertSound } from '../../firebase/messaging';
import { Icon } from '../../components/Icon';
import type { IconName } from '../../components/iconPaths';
import { CT_ICON, CenterStatusBadge } from '../../components/badges';
import { Num } from '../../components/parts';
import { useOnline } from '../../hooks/useOnline';
import { useCenterUi } from './centerUi';

const NAV: { to: string; end?: boolean; also?: string[]; icon: IconName; key: string }[] = [
  { to: '/center', end: true, icon: 'grid', key: 'dashboard' },
  { to: '/center/reports', icon: 'clipboard', key: 'reports' },
  { to: '/center/crews', also: ['/center/staff'], icon: 'users', key: 'team' },
  { to: '/center/vehicles', icon: 'truck', key: 'vehicles' },
  { to: '/center/settings', icon: 'settings', key: 'settings' },
];

/** Frame of the center console: side navigation on a desktop, bottom navigation on a phone, and the live
 *  new-assignment alert (banner, sound, page title) that must work on every page, not just one. */
export function CenterLayout() {
  const { t } = useTranslation();
  const auth = useAuth();
  const online = useOnline();
  const { pathname } = useLocation();
  const { sound } = useCenterUi();
  const { center, assignments } = useCenterData();

  const fresh = assignments.filter((a) => a.status === 'notified' && !a.seen);
  const section = NAV.find((n) => (n.end ? pathname === n.to : [n.to, ...(n.also ?? [])].some((p) => pathname.startsWith(p)))) ?? NAV[0]!;

  // The first snapshot sets the baseline; only an increase afterwards rings (not on page load).
  const baseline = useRef<number | null>(null);
  useEffect(() => {
    if (baseline.current !== null && fresh.length > baseline.current && sound) playAlertSound();
    baseline.current = fresh.length;
  }, [fresh.length, sound]);
  useEffect(() => {
    document.title = `${fresh.length ? `(${fresh.length}) ` : ''}${t(`cnav.${section.key}`)} · ${t('app.name')}`;
  }, [fresh.length, section.key, t]);

  if (!center) return null;
  const first = fresh[0];
  const links = (bottom: boolean) =>
    NAV.map((n) => (
      <NavLink key={n.to} to={n.to} end={n.end} aria-current={section.to === n.to ? 'page' : undefined}>
        <Icon name={n.icon} size={bottom ? 'md' : 'md'} />
        <span className="t">{t(`cnav.${n.key}`)}</span>
        {n.key === 'reports' && fresh.length > 0 && <span className="badge solid-danger" aria-label={`${t('ops.new')}: ${fresh.length}`}><Num>{fresh.length}</Num></span>}
      </NavLink>
    ));

  return (
    <>
      <button type="button" className="skip-link" onClick={() => document.getElementById('cmain')?.focus()}>{t('skip')}</button>
      <div className="cshell">
        <aside className="cside">
          <div className="brand">
            <span className="brand-mark"><Icon name={CT_ICON[center.type]} size="lg" /></span>
            <div><b>{center.name}</b><small>{t(`ctype.${center.type}`)}</small></div>
          </div>
          <nav className="nav" aria-label={t('cnav.aria')}>{links(false)}</nav>
          <div className="cside-foot">
            <CenterStatusBadge status={center.status} />
            <button type="button" className="btn" onClick={() => void auth.signOut()}><Icon name="lock" size="sm" />{t('cp.logout')}</button>
          </div>
        </aside>

        <div>
          <header className="ctop">
            <span className="brand-mark" style={{ inlineSize: 36, blockSize: 36 }}><Icon name={CT_ICON[center.type]} /></span>
            <div style={{ flex: 1, minInlineSize: 0 }}><b>{center.name}</b><small>{t(`ctype.${center.type}`)}</small></div>
            <CenterStatusBadge status={center.status} />
          </header>
          <main className={`cmain${pathname === '/center/reports' ? ' wide' : ''}`} id="cmain" tabIndex={-1}>
            {!online && <div className="callout warn" role="status"><Icon name="wifiOff" /><span>{t('cp.noNet')}</span></div>}
            {first && (
              <div className="alert-banner" role="alert">
                <span className="ev-ico" style={{ background: 'var(--on-info)', color: 'var(--info)' }}><Icon name="bell" /></span>
                <b>{t('cp.alert', { t: t(`inc.${first.snapshot.type ?? 'other'}`), d: first.snapshot.district })}</b>
                <Link className="btn" to={`/center/reports/${first.id}`}>{t('cp.open')}</Link>
              </div>
            )}
            <Outlet />
          </main>
        </div>
      </div>
      <nav className="bnav" aria-label={t('cnav.aria')}>{links(true)}</nav>
    </>
  );
}
