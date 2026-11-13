import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '../../components/Icon';

/** The two halves of the "Team" section: ready crews and the people they are made of. */
export function TeamTabs() {
  const { t } = useTranslation();
  return (
    <nav className="tabs" aria-label={t('crw.tabsAria')}>
      <NavLink to="/center/crews" className={({ isActive }) => `tab ${isActive ? 'on' : ''}`}><Icon name="users" size="sm" />{t('crw.tab')}</NavLink>
      <NavLink to="/center/staff" className={({ isActive }) => `tab ${isActive ? 'on' : ''}`}><Icon name="user" size="sm" />{t('cnav.staff')}</NavLink>
    </nav>
  );
}
