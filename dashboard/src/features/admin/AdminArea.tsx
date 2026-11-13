import { useEffect, type ReactNode } from 'react';
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AdminDataProvider, useAdminData } from '../../data/AdminData';
import { useAuth } from '../../firebase/auth';
import { Icon } from '../../components/Icon';
import type { IconName } from '../../components/iconPaths';
import { LangSwitch, Num, ThemeButton } from '../../components/parts';
import { useTheme } from '../../hooks/useTheme';
import { OverviewPage } from './OverviewPage';
import { MapPage } from './MapPage';
import { ReportsPage } from './ReportsPage';
import { VolunteersPage } from './VolunteersPage';
import { CentersPage } from './CentersPage';
import { AreasPage } from './AreasPage';
import { CenterDetailPage } from './CenterDetailPage';

const NAV: { path: string; icon: IconName; key: string; group: 'ops' | 'manage' }[] = [
  { path: 'overview', icon: 'grid', key: 'overview', group: 'ops' },
  { path: 'map', icon: 'map', key: 'map', group: 'ops' },
  { path: 'reports', icon: 'clipboard', key: 'reports', group: 'ops' },
  { path: 'volunteers', icon: 'users', key: 'volunteers', group: 'manage' },
  { path: 'centers', icon: 'building', key: 'centers', group: 'manage' },
  { path: 'areas', icon: 'tent', key: 'areas', group: 'manage' },
];

function Shell({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const auth = useAuth();
  const { pathname } = useLocation();
  const { reports, live, setLive } = useAdminData();
  const [theme, toggleTheme] = useTheme();
  const current = NAV.find((n) => pathname.startsWith(`/admin/${n.path}`)) ?? NAV[0]!;
  const newCount = reports.filter((r) => r.kind === 'help' && r.ops === 'new').length;

  useEffect(() => {
    document.title = `${t(`nav.${current.key}`)} · ${t('app.name')}`;
  }, [t, current.key]);

  return (
    <>
      <button type="button" className="skip-link" onClick={() => document.getElementById('main')?.focus()}>{t('skip')}</button>
      <div className="shell">
        <aside className="side">
          <div className="brand">
            <span className="brand-mark"><Icon name="lifebuoy" size="lg" /></span>
            <div><b>{t('app.name')}</b><small>{t('app.sub')}</small></div>
          </div>
          <nav className="nav" aria-label={t('a11y.mainNav')}>
            {(['ops', 'manage'] as const).map((g) => (
              <div key={g}>
                <div className="nav-label">{t(`nav.${g}`)}</div>
                {NAV.filter((n) => n.group === g).map((n) => (
                  <NavLink key={n.path} to={`/admin/${n.path}`} aria-current={current.path === n.path ? 'page' : undefined}>
                    <Icon name={n.icon} />
                    <span className="t">{t(`nav.${n.key}`)}</span>
                    {n.key === 'reports' && newCount > 0 && <span className="badge solid-danger" aria-label={`${t('ops.new')}: ${newCount}`}><Num>{newCount}</Num></span>}
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>
        </aside>
        <div className="main">
          <header className="top">
            <h1>{t(`nav.${current.key}`)}</h1>
            <span className="grow" />
            <button type="button" className="btn" aria-pressed={!live} onClick={() => setLive(!live)}>
              <Icon name={live ? 'clock' : 'sync'} />{live ? t('live.pause') : t('live.resume')}
            </button>
            <LangSwitch />
            <ThemeButton theme={theme} onToggle={toggleTheme} />
            <span className="badge info" title={auth.user?.email ?? ''}><Icon name="user" size="sm" />{t('user.role')}</span>
            <button type="button" className="btn" onClick={() => void auth.signOut()}><Icon name="lock" size="sm" />{t('user.out')}</button>
          </header>
          <main className="page" id="main" tabIndex={-1}>{children}</main>
        </div>
      </div>
    </>
  );
}

export default function AdminArea() {
  return (
    <AdminDataProvider>
      <Shell>
        <Routes>
          <Route index element={<Navigate to="/admin/overview" replace />} />
          <Route path="overview" element={<OverviewPage />} />
          <Route path="map" element={<MapPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="volunteers" element={<VolunteersPage />} />
          <Route path="centers" element={<CentersPage />} />
          <Route path="centers/:id" element={<CenterDetailPage />} />
          <Route path="areas" element={<AreasPage />} />
          <Route path="*" element={<Navigate to="/admin/overview" replace />} />
        </Routes>
      </Shell>
    </AdminDataProvider>
  );
}
