import { Suspense, lazy, type ReactNode } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth, type Role } from './firebase/auth';
import { homeFor, loginFor } from './routes';
import { ChoosePortalPage, PortalLoginPage } from './features/auth/LoginPage';

// Each role area is its own chunk: a center never downloads the admin code.
const AdminArea = lazy(() => import('./features/admin/AdminArea'));
const CenterArea = lazy(() => import('./features/center/CenterArea'));

function Splash() {
  const { t } = useTranslation();
  return <div className="login"><div className="muted" role="status">{t('common.loading')}</div></div>;
}

function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const a = useAuth();
  const loc = useLocation();
  if (a.status === 'loading') return <Splash />;
  if (a.status === 'out') return <Navigate to={loginFor(role)} replace state={{ from: loc.pathname }} />;
  if (a.role !== role) return <Navigate to={homeFor(a.role)} replace />;
  return <>{children}</>;
}

function Home() {
  const a = useAuth();
  if (a.status === 'loading') return <Splash />;
  return <Navigate to={a.status === 'in' ? homeFor(a.role) : '/login'} replace />;
}

function NotFound() {
  const { t } = useTranslation();
  const a = useAuth();
  return (
    <div className="login">
      <div className="login-card">
        <h1 style={{ font: 'var(--text-headline)' }}>{t('notfound.title')}</h1>
        <Link className="btn primary" to={homeFor(a.role)}>{t('notfound.back')}</Link>
      </div>
    </div>
  );
}

export function App() {
  return (
    <Suspense fallback={<Splash />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<ChoosePortalPage />} />
        <Route path="/admin/login" element={<PortalLoginPage portal="admin" />} />
        <Route path="/center/login" element={<PortalLoginPage portal="center" />} />
        <Route path="/admin/*" element={<RequireRole role="admin"><AdminArea /></RequireRole>} />
        <Route path="/center/*" element={<RequireRole role="center"><CenterArea /></RequireRole>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
