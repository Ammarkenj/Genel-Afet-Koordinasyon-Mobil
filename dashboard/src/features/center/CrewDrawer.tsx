import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCenterData } from '../../data/CenterData';
import { setAssignmentStatus, updateCrew } from '../../data/repos';
import { busyIds, crewFromTeams, crewProblem, splitTeams, staffState, vehicleState, type DerivedStaffStatus } from '../../domain/crew';
import { MAX_CREW_STAFF, MAX_CREW_TEAMS, MAX_CREW_VEHICLES, type Assignment, type Crew } from '../../domain/types';
import { Drawer } from '../../components/Dialog';
import { Icon } from '../../components/Icon';
import { CT_ICON } from '../../components/badges';
import { useToast } from '../../components/Toast';
import { useNow } from '../../hooks/useNow';

interface Props {
  assignment: Assignment;
  /** accept: first pick, then the assignment becomes "accepted". edit: correct the crew of a running job. */
  mode: 'accept' | 'edit';
  onClose: () => void;
}

const REASON: Record<Exclude<DerivedStaffStatus, 'on_duty'>, string> = {
  on_mission: 'crew.busy',
  not_today: 'crw.reason.not_today',
  off_duty: 'crew.offDuty',
  leave: 'crew.leave',
};

/** Choose who goes out. The normal way is one tap on a ready crew; the manual form (vehicles and people one by one) is the fallback.
 *  Crews that are not on duty today never appear; people who are not on duty today are not listed in the manual form either. */
export function CrewDrawer({ assignment, mode, onClose }: Props) {
  const { t } = useTranslation();
  const toast = useToast();
  const now = useNow(60_000);
  const { center, vehicles, staff, teams, assignments } = useCenterData();
  // This assignment's own crew does not count as "out" while it is being edited.
  const busyNow = useMemo(() => busyIds(assignments, assignment.id), [assignments, assignment.id]);
  const split = useMemo(() => splitTeams(teams, vehicles, staff, busyNow, now), [teams, vehicles, staff, busyNow, now]);

  const hadTeams = assignment.crew.teams.length > 0;
  // Correcting a hand-made crew opens the manual form; everything else starts with the ready crews.
  const [manual, setManual] = useState(mode === 'edit' && !hadTeams && (assignment.crew.vehicles.length > 0 || assignment.crew.staff.length > 0));
  const [picked, setPicked] = useState<string[]>(() => split.ready.filter((r) => assignment.crew.teams.includes(r.team.name)).map((r) => r.team.id));
  const [vIds, setVIds] = useState<string[]>(assignment.crew.vehicles.map((v) => v.id));
  const [sIds, setSIds] = useState<string[]>(assignment.crew.staff.map((s) => s.id));
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const toggle = (list: string[], id: string, max: number): string[] => (list.includes(id) ? list.filter((x) => x !== id) : list.length >= max ? list : [...list, id]);
  const chosen = split.ready.filter((r) => picked.includes(r.team.id));
  const chosenCrew = useMemo(() => crewFromTeams(chosen), [chosen]);

  const submit = async () => {
    let crew: Crew;
    if (manual) {
      if (crewProblem(vehicles.length, vIds.length)) {
        setErrorKey('crew.vehicleRequired');
        return;
      }
      crew = {
        vehicles: vehicles.filter((v) => vIds.includes(v.id)).map((v) => ({ id: v.id, code: v.code })),
        staff: staff.filter((m) => sIds.includes(m.id)).map((m) => ({ id: m.id, name: m.name, role: m.role })),
        teams: [],
      };
    } else {
      if (chosen.length === 0) {
        setErrorKey('crw.pickOne');
        return;
      }
      crew = chosenCrew;
    }
    setBusy(true);
    setErrorKey(null);
    try {
      if (mode === 'accept') await setAssignmentStatus(assignment.id, 'accepted', crew);
      else await updateCrew(assignment.id, crew);
      toast.show(t(mode === 'accept' ? 'astat.accepted' : 'common.saved'));
      onClose();
    } catch {
      setErrorKey('crew.failed');
    } finally {
      setBusy(false);
    }
  };

  const counts = manual
    ? t('crew.selected', { v: vIds.length, s: sIds.length })
    : t('crw.selected', { n: chosen.length, s: chosenCrew.staff.length, v: chosenCrew.vehicles.length });

  // The manual form lists only people who are on duty today; someone already out is shown disabled with the reason.
  const states = staff.map((m) => ({ m, state: staffState(m, busyNow, now) }));
  const listed = states.filter((x) => x.state === 'on_duty' || x.state === 'on_mission');
  const hiddenStaff = states.length - listed.length;

  return (
    <Drawer
      titleId="crew-t"
      onClose={onClose}
      wide
      title={t(mode === 'accept' ? 'crw.pick' : 'crew.edit')}
      footer={
        <>
          <button type="button" className="btn primary" style={{ minBlockSize: 52 }} onClick={() => void submit()} disabled={busy}>
            <Icon name="check" />{t(mode === 'accept' ? 'crew.accept' : 'crew.save')}
          </button>
          <span className="hint-btn" aria-live="polite">{counts}</span>
          <button type="button" className="btn" style={{ minBlockSize: 52 }} onClick={onClose}>{t('cf.cancel')}</button>
        </>
      }
    >
      {errorKey && errorKey !== 'crew.vehicleRequired' && <div className="callout danger" role="alert"><Icon name="alert" /><span>{t(errorKey)}</span></div>}

      {!manual ? (
        <>
          <p className="hint">{t('crw.pickHint')}</p>
          {split.ready.length === 0 && (
            <div className="callout info" role="status"><Icon name="info" /><span><b>{t('crw.noneReady')}</b> {t('crw.noneReadyHint')}</span></div>
          )}
          <div className="pick-list" role="group" aria-label={t('crw.title')}>
            {split.ready.map((r) => {
              const on = picked.includes(r.team.id);
              const out = r.members.filter((m) => !m.available);
              return (
                <div className={`team-card ${on ? 'sel' : ''}`} key={r.team.id}>
                  <label className="team-pick">
                    <input type="checkbox" checked={on} onChange={() => setPicked((l) => toggle(l, r.team.id, MAX_CREW_TEAMS))} />
                    <span className="grid" style={{ gap: 6 }}>
                      <span className="cell" style={{ gap: 8, flexWrap: 'wrap' }}>
                        <span className="t">{r.team.name}</span>
                        {r.vehicle && <span className="badge info"><Icon name={center ? CT_ICON[center.type] : 'truck'} size="sm" /><span dir="ltr">{r.vehicle.code}</span></span>}
                        <span className="badge"><Icon name="users" size="sm" />{t('crw.willGo', { n: r.members.length - out.length })}</span>
                      </span>
                      <span className="crew-chips">
                        {r.members.filter((m) => m.available).map((m) => <span className="badge safe" key={m.member.id}>{m.isLeader && <Icon name="idCard" size="sm" />}{m.member.name}</span>)}
                      </span>
                    </span>
                  </label>
                  {out.length > 0 && (
                    <div className="callout warn" role="status">
                      <Icon name="alert" />
                      <span>
                        <b>{t('crw.partial', { n: out.length })}</b>
                        {out.map((m) => <span className="member-line off" key={m.member.id}><span>{m.member.name}</span><span className="badge warn"><Icon name="clock" size="sm" />{t(REASON[m.state as keyof typeof REASON])}</span></span>)}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {split.hidden.length > 0 && <p className="hint" id="crw-hidden"><Icon name="info" size="sm" /> {t('crw.hiddenLine', { n: split.hidden.length })}</p>}
          <button type="button" className="btn" style={{ minBlockSize: 52 }} onClick={() => { setManual(true); setErrorKey(null); }}><Icon name="edit" size="sm" />{t('crw.manual')}</button>
        </>
      ) : (
        <>
          <p className="hint">{t('crew.pickHint')}</p>
          {split.ready.length > 0 && <button type="button" className="btn" style={{ minBlockSize: 48 }} onClick={() => { setManual(false); setErrorKey(null); }}><Icon name="back" size="sm" flip />{t('crw.backToReady')}</button>}

          <fieldset className="group" aria-describedby={errorKey === 'crew.vehicleRequired' ? 'crew-err' : undefined}>
            <legend>{t('crew.vehicles')}</legend>
            {vehicles.length === 0 && <div className="callout info"><Icon name="info" /><span>{t('crew.noVehicles')}</span></div>}
            <div className="pick-list">
              {vehicles.map((v) => {
                const state = vehicleState(v, busyNow);
                const off = state !== 'ready';
                return (
                  <label className={`pick-row ${off ? 'off' : ''}`} key={v.id}>
                    <input type="checkbox" checked={vIds.includes(v.id)} disabled={off} onChange={() => setVIds((l) => toggle(l, v.id, MAX_CREW_VEHICLES))} />
                    <span className="ctype-ico"><Icon name={center ? CT_ICON[center.type] : 'truck'} /></span>
                    <span>
                      <span className="t">{v.code}</span>
                      <span className="m"><span>{t(`vkind.${v.kind}`)}</span><span>{t('vh.seats')}: {v.seats}</span>{off && <span className="badge warn"><Icon name="clock" size="sm" />{t(state === 'on_mission' ? 'crew.busy' : 'crew.maint')}</span>}</span>
                    </span>
                  </label>
                );
              })}
            </div>
            {vehicles.length > 0 && vehicles.every((v) => vehicleState(v, busyNow) !== 'ready') && <p className="empty">{t('crew.noneAvail')}</p>}
            {errorKey === 'crew.vehicleRequired' && <span className="err-text" id="crew-err" role="alert" style={{ marginBlockStart: 8 }}><Icon name="alert" size="sm" />{t('crew.vehicleRequired')}</span>}
          </fieldset>

          <fieldset className="group">
            <legend>{t('crew.staff')}</legend>
            <div className="pick-list">
              {listed.map(({ m, state }) => {
                const off = state !== 'on_duty';
                return (
                  <label className={`pick-row ${off ? 'off' : ''}`} key={m.id}>
                    <input type="checkbox" checked={sIds.includes(m.id)} disabled={off} onChange={() => setSIds((l) => toggle(l, m.id, MAX_CREW_STAFF))} />
                    <span className="ctype-ico"><Icon name="user" /></span>
                    <span>
                      <span className="t">{m.name}</span>
                      <span className="m"><span>{t(`srole.${m.role}`)}</span>{off && <span className="badge warn"><Icon name="clock" size="sm" />{t('crew.busy')}</span>}</span>
                    </span>
                  </label>
                );
              })}
            </div>
            {listed.length === 0 && <p className="empty">{t('crew.noStaffAvail')}</p>}
            {hiddenStaff > 0 && <p className="hint"><Icon name="info" size="sm" /> {t('crw.hiddenStaff', { n: hiddenStaff })}</p>}
          </fieldset>
        </>
      )}
    </Drawer>
  );
}
