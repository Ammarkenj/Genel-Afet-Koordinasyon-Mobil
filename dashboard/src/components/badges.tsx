import { useTranslation } from 'react-i18next';
import { Icon } from './Icon';
import type { IconName } from './iconPaths';
import type { AssignmentStatus, CenterStatus, CenterType, DeliveryState, IncidentType, NeedId, OpsStatus, Report, ReportSnapshot, VolunteerRole } from '../domain/types';

export const INC_ICON: Record<IncidentType, IconName> = { quake: 'quake', crash: 'car', fall: 'fall', fire: 'flame', other: 'alert' };
export const DEL_ICON: Record<DeliveryState, IconName> = { sent: 'check', queued: 'clock', sending: 'sync' };
export const OPS_ICON: Record<OpsStatus, IconName> = { new: 'bell', dispatched: 'route', resolved: 'checkCircle' };
export const NEED_ICON: Record<NeedId, IconName> = { aid: 'firstAid', water: 'drop', shelter: 'tent' };
export const ROLE_ICON: Record<VolunteerRole, IconName> = { aid: 'firstAid', rescue: 'lifebuoy', logistics: 'box' };
export const CT_ICON: Record<CenterType, IconName> = { fire: 'truck', rescue: 'helmet', sar: 'search', ems: 'ambulance' };
export const CSTAT_ICON: Record<CenterStatus, IconName> = { ready: 'check', busy: 'clock', offline: 'wifiOff' };
export const ASTAT_ICON: Record<AssignmentStatus, IconName> = { notified: 'bell', accepted: 'check', enroute: 'route', arrived: 'pin', done: 'checkCircle', declined: 'close' };

type WithKind = Pick<Report, 'kind' | 'type'> | Pick<ReportSnapshot, 'kind' | 'type'>;

/** What happened: icon + words (a "safe" report shows the shield). */
export function TypeCell({ r }: { r: WithKind }) {
  const { t } = useTranslation();
  if (r.kind === 'safe') return <span className="cell"><Icon name="shieldCheck" />{t('kind.safe')}</span>;
  const type = r.type ?? 'other';
  return <span className="cell"><Icon name={INC_ICON[type]} />{t(`inc.${type}`)}</span>;
}

export function DelBadge({ state }: { state: DeliveryState }) {
  const { t } = useTranslation();
  return <span className={`badge ${state === 'sent' ? 'safe' : 'warn'}`}><Icon name={DEL_ICON[state]} size="sm" />{t(`del.${state}`)}</span>;
}

export function OpsBadge({ ops }: { ops: OpsStatus }) {
  const { t } = useTranslation();
  const cls = ops === 'new' ? 'solid-danger' : ops === 'dispatched' ? 'info' : '';
  return <span className={`badge ${cls}`}><Icon name={OPS_ICON[ops]} size="sm" />{t(`ops.${ops}`)}</span>;
}

export function Flags({ r }: { r: Pick<Report, 'injured' | 'trapped' | 'auto'> }) {
  const { t } = useTranslation();
  if (!r.injured && !r.trapped && !r.auto) return <span className="muted">{t('flag.none')}</span>;
  return (
    <span className="flags">
      {r.injured && <span className="badge danger"><Icon name="firstAid" size="sm" />{t('flag.injured')}</span>}
      {r.trapped && <span className="badge danger"><Icon name="alert" size="sm" />{t('flag.trapped')}</span>}
      {r.auto && <span className="badge"><Icon name="sensor" size="sm" />{t('flag.auto')}</span>}
    </span>
  );
}

export function Urgency({ level }: { level: 1 | 2 | 3 }) {
  const { t } = useTranslation();
  return (
    <span className="cell">
      <span className={`dots u${level}`} aria-hidden="true">{[1, 2, 3].map((i) => <i key={i} className={i <= level ? 'on' : ''} />)}</span>
      {t(`urg.${level}`)}
    </span>
  );
}

export function CenterTypeCell({ type }: { type: CenterType }) {
  const { t } = useTranslation();
  return <span className="cell"><Icon name={CT_ICON[type]} />{t(`ctype.${type}`)}</span>;
}

export function CenterTypeIco({ type }: { type: CenterType }) {
  return <span className="ctype-ico"><Icon name={CT_ICON[type]} /></span>;
}

export function CenterStatusBadge({ status }: { status: CenterStatus }) {
  const { t } = useTranslation();
  const cls = status === 'ready' ? 'safe' : status === 'busy' ? 'warn' : '';
  return <span className={`badge ${cls}`}><Icon name={CSTAT_ICON[status]} size="sm" />{t(`cstat.${status}`)}</span>;
}

export function AssignmentBadge({ status }: { status: AssignmentStatus }) {
  const { t } = useTranslation();
  const cls = status === 'done' ? 'safe' : status === 'declined' || status === 'notified' ? 'warn' : 'info';
  return <span className={`badge ${cls}`}><Icon name={ASTAT_ICON[status]} size="sm" />{t(`astat.${status}`)}</span>;
}
