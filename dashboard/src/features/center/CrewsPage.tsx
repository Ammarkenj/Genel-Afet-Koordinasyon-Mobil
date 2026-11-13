import { useMemo, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useCenterData } from '../../data/CenterData';
import { deleteTeam, saveTeam, type TeamInput } from '../../data/repos';
import { staffState, teamReadiness, teamStatus } from '../../domain/crew';
import { MAX_TEAM_MEMBERS, type Team } from '../../domain/types';
import { ALL_DAYS, isoDay, normalizeDays, type IsoDay } from '../../domain/workdays';
import { ConfirmDialog, Drawer } from '../../components/Dialog';
import { DaysPicker } from '../../components/DaysPicker';
import { Icon } from '../../components/Icon';
import { StaffBadge, TeamStatusBadge, WorkDays } from '../../components/crewBadges';
import { useToast } from '../../components/Toast';
import { useNow } from '../../hooks/useNow';
import { FieldError } from '../admin/forms';
import { useCenterDerived } from './centerUi';
import { TeamTabs } from './TeamTabs';

function TeamDrawer({ team, onClose }: { team: Team | null; onClose: () => void }) {
  const { t } = useTranslation();
  const toast = useToast();
  const now = useNow(60_000);
  const { centerId, vehicles, staff } = useCenterData();
  const { busy: busyNow } = useCenterDerived();
  const [name, setName] = useState(team?.name ?? '');
  const [vehicleId, setVehicleId] = useState(team?.vehicleId ?? '');
  const [memberIds, setMemberIds] = useState<string[]>(team?.memberIds.filter((id) => staff.some((m) => m.id === id)) ?? []);
  const [leaderId, setLeaderId] = useState(team?.leaderId ?? '');
  const [days, setDays] = useState<IsoDay[]>(team?.workDays ?? ALL_DAYS);
  const [note, setNote] = useState(team?.note ?? '');
  const [errors, setErrors] = useState<{ name?: string; vehicle?: string; members?: string; days?: string }>({});
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState(false);

  const toggleMember = (id: string) => {
    setMemberIds((l) => (l.includes(id) ? l.filter((x) => x !== id) : l.length >= MAX_TEAM_MEMBERS ? l : [...l, id]));
    if (leaderId === id) setLeaderId('');
    setErrors((e) => ({ ...e, members: undefined }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const next = {
      name: name.trim() ? undefined : 'crw.errName',
      vehicle: vehicles.length > 0 && !vehicleId ? 'crw.errVehicle' : undefined,
      members: memberIds.length === 0 ? 'crw.errMembers' : undefined,
      days: normalizeDays(days).length === 0 ? 'st.daysErr' : undefined,
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;
    setBusy(true);
    setFailure(false);
    const input: TeamInput = {
      name: name.trim(),
      vehicleId: vehicles.length > 0 ? vehicleId : '',
      memberIds,
      leaderId: memberIds.includes(leaderId) ? leaderId : '',
      workDays: normalizeDays(days),
      note: note.trim(),
    };
    try {
      await saveTeam(centerId, input, team?.id);
      toast.show(t('common.saved'));
      onClose();
    } catch {
      setFailure(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Drawer
      titleId="team-t"
      onClose={onClose}
      wide
      title={t(team ? 'crw.edit' : 'crw.add')}
      footer={
        <>
          <button type="submit" form="team-form" className="btn primary" style={{ minBlockSize: 52 }} disabled={busy}><Icon name="check" />{t('crw.save')}</button>
          <button type="button" className="btn" style={{ minBlockSize: 52 }} onClick={onClose}>{t('cf.cancel')}</button>
        </>
      }
    >
      <form id="team-form" className="stack" onSubmit={submit} noValidate>
        {failure && <div className="callout danger" role="alert"><Icon name="alert" /><span>{t('crw.failed')}</span></div>}
        <label className={`field ${errors.name ? 'err' : ''}`}>
          <span>{t('crw.name')}</span>
          <input className="input" value={name} placeholder={t('crw.namePh')} onChange={(e) => setName(e.target.value)} maxLength={60} aria-invalid={errors.name ? true : undefined} aria-describedby={errors.name ? 'e-tname' : undefined} />
          <FieldError id="e-tname" k={errors.name} />
        </label>

        {vehicles.length > 0 ? (
          <label className={`field ${errors.vehicle ? 'err' : ''}`}>
            <span>{t('crw.vehicle')}</span>
            <select className="select" value={vehicleId} onChange={(e) => { setVehicleId(e.target.value); setErrors((x) => ({ ...x, vehicle: undefined })); }} aria-invalid={errors.vehicle ? true : undefined} aria-describedby={errors.vehicle ? 'e-tveh' : undefined}>
              <option value="">{t('crw.vehiclePick')}</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.code} · {t(`vkind.${v.kind}`)}</option>)}
            </select>
            <FieldError id="e-tveh" k={errors.vehicle} />
          </label>
        ) : (
          <div className="callout info"><Icon name="info" /><span>{t('crw.noVehicles')}</span></div>
        )}

        <fieldset className="group" aria-describedby={errors.members ? 'e-tmem' : 'tmem-hint'}>
          <legend>{t('crw.members')}</legend>
          <p className="hint" id="tmem-hint" style={{ marginBlockEnd: 8 }}>{t('crw.membersHint')}</p>
          {staff.length === 0 && <div className="callout info"><Icon name="info" /><span>{t('crw.noStaff')}</span></div>}
          <div className="pick-list">
            {staff.map((m) => (
              <label className="pick-row" key={m.id}>
                <input type="checkbox" checked={memberIds.includes(m.id)} onChange={() => toggleMember(m.id)} />
                <span className="ctype-ico"><Icon name="user" /></span>
                <span>
                  <span className="t">{m.name}</span>
                  <span className="m"><span>{t(`srole.${m.role}`)}</span><StaffBadge state={staffState(m, busyNow, now)} /></span>
                </span>
              </label>
            ))}
          </div>
          <FieldError id="e-tmem" k={errors.members} />
        </fieldset>

        {memberIds.length > 0 && (
          <label className="field">
            <span>{t('crw.leaderPick')}</span>
            <select className="select" value={memberIds.includes(leaderId) ? leaderId : ''} onChange={(e) => setLeaderId(e.target.value)}>
              <option value="">{t('crw.leaderNone')}</option>
              {staff.filter((m) => memberIds.includes(m.id)).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </label>
        )}

        <DaysPicker id="tdays" days={days} onChange={(d) => { setDays(d); setErrors((e) => ({ ...e, days: undefined })); }} label={t('crw.days')} hint={t('crw.daysHint')} error={errors.days} />

        <label className="field">
          <span>{t('crw.note')}</span>
          <input className="input" value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} />
        </label>
      </form>
    </Drawer>
  );
}

/** Ready crews: a vehicle and its people, with the days the crew is on duty. Picked with one tap when accepting an assignment. */
export function CrewsPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const now = useNow(60_000);
  const today = isoDay(now);
  const { centerId, teams, vehicles, staff } = useCenterData();
  const { busy } = useCenterDerived();
  const [editing, setEditing] = useState<Team | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Team | null>(null);
  const [working, setWorking] = useState(false);

  const rows = useMemo(() => teams.map((x) => teamReadiness(x, vehicles, staff, busy, now)), [teams, vehicles, staff, busy, now]);

  const remove = async () => {
    if (!deleting) return;
    setWorking(true);
    try {
      await deleteTeam(centerId, deleting.id);
      toast.show(t('common.saved'));
    } catch {
      toast.show(t('common.saveFail'));
    } finally {
      setWorking(false);
      setDeleting(null);
    }
  };

  return (
    <>
      <TeamTabs />
      <div className="page-h">
        <h1>{t('crw.title')}</h1>
        <span className="grow" />
        <button type="button" className="btn primary" onClick={() => setEditing('new')}><Icon name="plus" />{t('crw.add')}</button>
      </div>
      <p className="hint">{t('crw.hint')}</p>
      <section className="card">
        {rows.length === 0 ? (
          <p className="empty"><Icon name="users" /> {t('crw.empty')}</p>
        ) : (
          <div className="tbl-wrap">
            <table className="resp">
              <thead><tr><th>{t('crw.name')}</th><th>{t('crw.vehicle')}</th><th>{t('crw.members')}</th><th>{t('crw.days')}</th><th>{t('crw.todayCol')}</th><th /></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.team.id} style={{ cursor: 'default' }}>
                    <td data-label={t('crw.name')}><span className="cell"><Icon name="users" /><b>{r.team.name}</b></span>{r.team.note && <div className="hint">{r.team.note}</div>}</td>
                    <td data-label={t('crw.vehicle')}>
                      {r.vehicle ? <span className="badge info"><Icon name="truck" size="sm" /><span dir="ltr">{r.vehicle.code}</span></span> : <span className="muted">{r.team.vehicleId ? t('crw.noVehicle') : t('crw.noVehicleByDesign')}</span>}
                    </td>
                    <td data-label={t('crw.members')}>
                      <span className="crew-chips">
                        {r.members.map((m) => <span className="badge" key={m.member.id}>{m.isLeader && <Icon name="idCard" size="sm" />}{m.member.name}</span>)}
                        {r.members.length === 0 && <span className="muted">—</span>}
                      </span>
                    </td>
                    <td data-label={t('crw.days')}><WorkDays days={r.team.workDays} today={today} /></td>
                    <td data-label={t('crw.todayCol')}><TeamStatusBadge status={teamStatus(r)} /></td>
                    <td data-label="">
                      <div className="flags" style={{ flexWrap: 'nowrap' }}>
                        <button type="button" className="btn" onClick={() => setEditing(r.team)}><Icon name="edit" size="sm" />{t('ar.edit')}</button>
                        <button type="button" className="btn icon-only" onClick={() => setDeleting(r.team)} aria-label={`${t('crw.delete')}: ${r.team.name}`}><Icon name="trash" size="sm" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {editing && <TeamDrawer team={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
      {deleting && (
        <ConfirmDialog titleId="td-t" title={t('crw.deleteAsk', { name: deleting.name })} keepLabel={t('st.deleteKeep')} confirmLabel={t('del.yes')} onKeep={() => setDeleting(null)} onConfirm={() => void remove()} busy={working}>
          <p className="muted">{t('crw.deleteBody')}</p>
        </ConfirmDialog>
      )}
    </>
  );
}
