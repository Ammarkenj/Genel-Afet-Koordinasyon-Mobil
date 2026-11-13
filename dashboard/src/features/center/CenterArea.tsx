import { Navigate, Route, Routes } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CenterDataProvider, useCenterData } from '../../data/CenterData';
import { useAuth } from '../../firebase/auth';
import { useTheme } from '../../hooks/useTheme';
import { Icon } from '../../components/Icon';
import { CenterAssignmentPage } from './CenterAssignmentPage';
import { CenterLayout } from './CenterLayout';
import { CenterReportsPage } from './ReportsPage';
import { CenterUiProvider } from './centerUi';
import { CrewsPage } from './CrewsPage';
import { DashboardPage } from './DashboardPage';
import { SettingsPage } from './SettingsPage';
import { StaffPage } from './StaffPage';
import { VehiclesPage } from './VehiclesPage';

function Message({ icon, children, action }: { icon: 'wifiOff' | 'alert' | 'clock'; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="center-card card" role={icon === 'clock' ? 'status' : 'alert'}>
      <div className={icon === 'clock' ? 'muted' : 'callout warn'} style={icon === 'clock' ? undefined : undefined}><Icon name={icon} /> <span>{children}</span></div>
      {action && <div style={{ marginBlockStart: 12 }}>{action}</div>}
    </div>
  );
}

function Gate() {
  const { t } = useTranslation();
  const auth = useAuth();
  const { center, loading, error, retry } = useCenterData();
  useTheme();

  if (error) return <Message icon="wifiOff" action={<button type="button" className="btn" onClick={retry}><Icon name="sync" size="sm" />{t('common.retry')}</button>}>{t('common.error')}</Message>;
  if (loading) return <Message icon="clock">{t('common.loading')}</Message>;
  if (!center) return <Message icon="alert" action={<button type="button" className="btn" onClick={() => void auth.signOut()}>{t('user.out')}</button>}>{t('center.noCenter')}</Message>;

  return (
    <CenterUiProvider>
      <Routes>
        <Route element={<CenterLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="reports" element={<CenterReportsPage />} />
          <Route path="reports/:id" element={<CenterAssignmentPage />} />
          <Route path="crews" element={<CrewsPage />} />
          <Route path="staff" element={<StaffPage />} />
          <Route path="vehicles" element={<VehiclesPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/center" replace />} />
      </Routes>
    </CenterUiProvider>
  );
}

export default function CenterArea() {
  const auth = useAuth();
  useTheme();
  if (!auth.centerId) return <NoCenter />;
  return (
    <CenterDataProvider centerId={auth.centerId}>
      <Gate />
    </CenterDataProvider>
  );
}

function NoCenter() {
  const { t } = useTranslation();
  const auth = useAuth();
  return (
    <div className="cp-wrap">
      <Message icon="alert" action={<button type="button" className="btn" onClick={() => void auth.signOut()}>{t('user.out')}</button>}>{t('center.noCenter')}</Message>
    </div>
  );
}
