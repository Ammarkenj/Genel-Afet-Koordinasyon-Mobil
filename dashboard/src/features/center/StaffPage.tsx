import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useCenterData } from '../../data/CenterData';
import { deleteStaff, saveStaff, type StaffInput } from '../../data/repos';
import { staffState } from '../../domain/crew';
import { STAFF_ROLES, STAFF_STATUSES, type StaffMember, type StaffRole, type StaffStatus } from '../../domain/types';
import { ConfirmDialog, Drawer } from '../../components/Dialog';
import { Icon } from '../../components/Icon';
import { StaffBadge, WorkDays } from '../../components/crewBadges';
import { ALL_DAYS, isoDay, normalizeDays, worksToday, type IsoDay } from '../../domain/workdays';
import { DaysPicker } from '../../components/DaysPicker';
import { TeamTabs } from './TeamTabs';
import { useNow } from '../../hooks/useNow';
import { Num } from '../../components/parts';
import { useToast } from '../../components/Toast';
import { FieldError } from '../admin/forms';
import { useCenterDerived } from './centerUi';

function StaffDrawer({ member, onClose }: { member: StaffMember | null; onClose: () => void }) {
  const { t } = useTranslation();
  const toast = useToast();
  const { centerId } = useCenterData();
  const [days, setDays] = useState<IsoDay[]>(member?.workDays ?? ALL_DAYS);
  const [daysErr, setDaysErr] = useState<string | undefined>();
  const [name, setName] = useState(member?.name ?? '');
  const [role, setRole] = useState<StaffRole>(member?.role ?? 'paramedic');
  const [phone, setPhone] = useState(member?.phone ?? '');
  const [note, setNote] = useState(member?.note ?? '');
  const [status, setStatus] = useState<StaffStatus>(member?.status ?? 'on_duty');
  const [nameErr, setNameErr] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!name.trim()) {
      setNameErr('err.required');
      return;
    }
    if (normalizeDays(days).length === 0) {
      setDaysErr('st.daysErr');
      return;
    }
    setNameErr(undefined);
    setDaysErr(undefined);
    setBusy(true);
    setFailure(false);
    const input: StaffInput = { name: name.trim(), role, phone: phone.trim(), note: note.trim(), status, workDays: normalizeDays(days) };
    try {
      await saveStaff(centerId, input, member?.id);
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
      titleId="staff-t"
      onClose={onClose}
      wide
      title={t(member ? 'st.editTitle' : 'st.add')}
      footer={
        <>
          <button type="submit" form="staff-form" className="btn primary" style={{ minBlockSize: 52 }} disabled={busy}><Icon name="check" />{t('cf.saveEdit')}</button>
          <button type="button" className="btn" style={{ minBlockSize: 52 }} onClick={onClose}>{t('cf.cancel')}</button>
        </>
      }
    >
      <form id="staff-form" className="stack" onSubmit={submit} noValidate>
        {failure && <div className="callout danger" role="alert"><Icon name="alert" /><span>{t('common.saveFail')}</span></div>}
        <label className={`field ${nameErr ? 'err' : ''}`}>
          <span>{t('st.name')}</span>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} aria-invalid={nameErr ? true : undefined} aria-describedby={nameErr ? 'e-sname' : undefined} />
          <FieldError id="e-sname" k={nameErr} />
        </label>
        <div className="grid-2">
          <label className="field">
            <span>{t('st.role')}</span>
            <select className="select" value={role} onChange={(e) => setRole(e.target.value as StaffRole)}>{STAFF_ROLES.map((k) => <option key={k} value={k}>{t(`srole.${k}`)}</option>)}</select>
          </label>
          <label className="field">
            <span>{t('st.status')}</span>
            <select className="select" value={status} onChange={(e) => setStatus(e.target.value as StaffStatus)}>{STAFF_STATUSES.map((k) => <option key={k} value={k}>{t(`sstat.${k}`)}</option>)}</select>
          </label>
        </div>
        <DaysPicker id="sdays" days={days} onChange={(d) => { setDays(d); setDaysErr(undefined); }} label={t('st.days')} hint={t('st.daysHint')} error={daysErr} />
        <label className="field">
          <span>{t('cf.phone')}</span>
          <input className="input" type="tel" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={40} />
        </label>
        <label className="field">
          <span>{t('st.note')}</span>
          <input className="input" value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} />
        </label>
      </form>
    </Drawer>
  );
}

export function StaffPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const { centerId, staff, teams } = useCenterData();
  const { busy, team } = useCenterDerived();
  const now = useNow(60_000);
  const today = isoDay(now);
  const [editing, setEditing] = useState<StaffMember | 'new' | null>(null);
  const [deleting, setDeleting] = useState<StaffMember | null>(null);
  const [working, setWorking] = useState(false);

  const remove = async () => {
    if (!deleting) return;
    setWorking(true);
    try {
      await deleteStaff(centerId, deleting.id, teams);
      toast.show(t('common.saved'));
    } catch {
      toast.show(t('common.saveFail'));
    } finally {
      setWorking(false);
      setDeleting(null);
    }
  };

  const chip = (label: string, n: number) => <span className="badge"><b><Num>{n}</Num></b> {label}</span>;
  return (
    <>
      <TeamTabs />
      <div className="page-h">
        <h1>{t('st.title')}</h1>
        <span className="grow" />
        <button type="button" className="btn primary" onClick={() => setEditing('new')}><Icon name="plus" />{t('st.add')}</button>
      </div>
      <div className="stat-chips" aria-label={t('st.title')}>
        {chip(t('st.total'), team.total)}{chip(t('sstat.on_duty'), team.onDuty)}{chip(t('sstat.on_mission'), team.onMission)}{chip(t('sstat.not_today'), team.notToday)}{chip(t('sstat.off_duty'), team.offDuty)}{chip(t('sstat.leave'), team.leave)}
      </div>
      <section className="card">
        {staff.length === 0 ? (
          <p className="empty"><Icon name="users" /> {t('st.empty')}</p>
        ) : (
          <div className="tbl-wrap">
            <table className="resp">
              <thead><tr><th>{t('st.name')}</th><th>{t('st.role')}</th><th>{t('st.days')}</th><th>{t('cf.phone')}</th><th>{t('st.status')}</th><th>{t('st.note')}</th><th /></tr></thead>
              <tbody>
                {staff.map((m) => (
                  <tr key={m.id} style={{ cursor: 'default' }}>
                    <td data-label={t('st.name')}><span className="cell"><Icon name="user" /><b>{m.name}</b></span></td>
                    <td data-label={t('st.role')}>{t(`srole.${m.role}`)}</td>
                    <td data-label={t('st.days')}><WorkDays days={m.workDays} today={today} />{worksToday(m.workDays, now) ? null : <div className="hint">{t('st.offToday')}</div>}</td>
                    <td data-label={t('cf.phone')}><span dir="ltr">{m.phone || '—'}</span></td>
                    <td data-label={t('st.status')}><StaffBadge state={staffState(m, busy, now)} /></td>
                    <td data-label={t('st.note')} className="muted">{m.note || '—'}</td>
                    <td data-label="">
                      <div className="flags" style={{ flexWrap: 'nowrap' }}>
                        <button type="button" className="btn" onClick={() => setEditing(m)}><Icon name="edit" size="sm" />{t('ar.edit')}</button>
                        <button type="button" className="btn icon-only" onClick={() => setDeleting(m)} aria-label={`${t('centers.delete')}: ${m.name}`}><Icon name="trash" size="sm" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {editing && <StaffDrawer member={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
      {deleting && (
        <ConfirmDialog titleId="sd-t" title={t('st.deleteTitle')} keepLabel={t('st.deleteKeep')} confirmLabel={t('del.yes')} onKeep={() => setDeleting(null)} onConfirm={() => void remove()} confirmDisabled={busy.staff.has(deleting.id)} busy={working}>
          <p><b>{deleting.name}</b></p>
          <p className="muted">{t('st.deleteDesc')}</p>
          {busy.staff.has(deleting.id) && <div className="callout warn"><Icon name="alert" /><span>{t('st.deleteBusy')}</span></div>}
        </ConfirmDialog>
      )}
    </>
  );
}
