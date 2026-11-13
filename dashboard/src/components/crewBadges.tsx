import { useTranslation } from 'react-i18next';
import { Icon } from './Icon';
import type { DerivedStaffStatus, DerivedVehicleStatus, TeamStatus } from '../domain/crew';
import { dayName, isEveryDay, isWeekdaysOnly, normalizeDays, type IsoDay } from '../domain/workdays';

const STAFF_BADGE: Record<DerivedStaffStatus, string> = { on_duty: 'safe', on_mission: 'info', not_today: '', off_duty: '', leave: 'warn' };
const STAFF_ICON: Record<DerivedStaffStatus, 'check' | 'route' | 'clock' | 'calendar'> = { on_duty: 'check', on_mission: 'route', not_today: 'calendar', off_duty: 'clock', leave: 'calendar' };
const VEHICLE_BADGE: Record<DerivedVehicleStatus, string> = { ready: 'safe', on_mission: 'info', maintenance: 'warn' };
const VEHICLE_ICON: Record<DerivedVehicleStatus, 'check' | 'route' | 'wrench'> = { ready: 'check', on_mission: 'route', maintenance: 'wrench' };

/** Staff state with icon and words ("on a mission" is derived from the assignments, never stored). */
export function StaffBadge({ state }: { state: DerivedStaffStatus }) {
  const { t } = useTranslation();
  return <span className={`badge ${STAFF_BADGE[state]}`}><Icon name={STAFF_ICON[state]} size="sm" />{t(`sstat.${state}`)}</span>;
}

export function VehicleBadge({ state }: { state: DerivedVehicleStatus }) {
  const { t } = useTranslation();
  return <span className={`badge ${VEHICLE_BADGE[state]}`}><Icon name={VEHICLE_ICON[state]} size="sm" />{t(`vstat.${state}`)}</span>;
}

const TEAM_BADGE: Record<TeamStatus, string> = { ready: 'safe', partial: 'warn', not_today: '', on_mission: 'info', vehicle_unavailable: 'warn', no_member: 'warn' };
const TEAM_ICON: Record<TeamStatus, 'check' | 'alert' | 'calendar' | 'route' | 'wrench' | 'users'> = { ready: 'check', partial: 'alert', not_today: 'calendar', on_mission: 'route', vehicle_unavailable: 'wrench', no_member: 'users' };

/** What a ready crew is today: icon and words. */
export function TeamStatusBadge({ status }: { status: TeamStatus }) {
  const { t } = useTranslation();
  return <span className={`badge ${TEAM_BADGE[status]}`}><Icon name={TEAM_ICON[status]} size="sm" />{t(`crw.st.${status}`)}</span>;
}

/** A staff member's working days: "Every day", "Weekdays", or the day names (today highlighted). */
export function WorkDays({ days, today }: { days: readonly number[]; today?: IsoDay }) {
  const { t, i18n } = useTranslation();
  const list = normalizeDays(days);
  if (list.length === 0) return <span className="muted">—</span>;
  if (isEveryDay(list)) return <span>{t('st.daysEvery')}</span>;
  if (isWeekdaysOnly(list)) return <span>{t('st.daysWeekdays')}</span>;
  return (
    <span className="crew-chips">
      {list.map((d) => <span key={d} className={`badge ${d === today ? 'info' : ''}`}>{dayName(d, i18n.language)}</span>)}
    </span>
  );
}
