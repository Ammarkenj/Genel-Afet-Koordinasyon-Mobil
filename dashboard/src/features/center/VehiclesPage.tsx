import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useCenterData } from '../../data/CenterData';
import { deleteVehicle, saveVehicle, type VehicleInput } from '../../data/repos';
import { vehicleState } from '../../domain/crew';
import { VEHICLE_KINDS, VEHICLE_STATUSES, type Vehicle, type VehicleKind, type VehicleStatus } from '../../domain/types';
import { ConfirmDialog, Drawer } from '../../components/Dialog';
import { Icon } from '../../components/Icon';
import { VehicleBadge } from '../../components/crewBadges';
import { CT_ICON } from '../../components/badges';
import { Num } from '../../components/parts';
import { useToast } from '../../components/Toast';
import { FieldError } from '../admin/forms';
import { useCenterDerived } from './centerUi';

function VehicleDrawer({ vehicle, onClose }: { vehicle: Vehicle | null; onClose: () => void }) {
  const { t } = useTranslation();
  const toast = useToast();
  const { centerId, center } = useCenterData();
  const defaultKind: VehicleKind = center?.type === 'fire' ? 'fire_truck' : center?.type === 'ems' ? 'ambulance' : 'rescue_vehicle';
  const [code, setCode] = useState(vehicle?.code ?? '');
  const [kind, setKind] = useState<VehicleKind>(vehicle?.kind ?? defaultKind);
  const [seats, setSeats] = useState(String(vehicle?.seats ?? 4));
  const [status, setStatus] = useState<VehicleStatus>(vehicle?.status ?? 'ready');
  const [errors, setErrors] = useState<{ code?: string; seats?: string }>({});
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const n = Number(seats);
    const errs = { ...(code.trim() ? {} : { code: 'err.required' }), ...(Number.isInteger(n) && n >= 1 && n <= 60 ? {} : { seats: 'vh.seatsErr' }) };
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    setFailure(false);
    const input: VehicleInput = { code: code.trim(), kind, seats: n, status };
    try {
      await saveVehicle(centerId, input, vehicle?.id);
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
      titleId="veh-t"
      onClose={onClose}
      wide
      title={t(vehicle ? 'vh.editTitle' : 'vh.add')}
      footer={
        <>
          <button type="submit" form="veh-form" className="btn primary" style={{ minBlockSize: 52 }} disabled={busy}><Icon name="check" />{t('cf.saveEdit')}</button>
          <button type="button" className="btn" style={{ minBlockSize: 52 }} onClick={onClose}>{t('cf.cancel')}</button>
        </>
      }
    >
      <form id="veh-form" className="stack" onSubmit={submit} noValidate>
        {failure && <div className="callout danger" role="alert"><Icon name="alert" /><span>{t('common.saveFail')}</span></div>}
        <label className={`field ${errors.code ? 'err' : ''}`}>
          <span>{t('vh.code')}</span>
          <input className="input" dir="ltr" value={code} onChange={(e) => setCode(e.target.value)} maxLength={30} aria-invalid={errors.code ? true : undefined} aria-describedby={errors.code ? 'e-vcode' : undefined} />
          <FieldError id="e-vcode" k={errors.code} />
        </label>
        <div className="grid-2">
          <label className="field">
            <span>{t('vh.kind')}</span>
            <select className="select" value={kind} onChange={(e) => setKind(e.target.value as VehicleKind)}>{VEHICLE_KINDS.map((k) => <option key={k} value={k}>{t(`vkind.${k}`)}</option>)}</select>
          </label>
          <label className="field">
            <span>{t('vh.status')}</span>
            <select className="select" value={status} onChange={(e) => setStatus(e.target.value as VehicleStatus)}>{VEHICLE_STATUSES.map((k) => <option key={k} value={k}>{t(`vstat.${k}`)}</option>)}</select>
          </label>
        </div>
        <label className={`field ${errors.seats ? 'err' : ''}`}>
          <span>{t('vh.seats')}</span>
          <input className="input" inputMode="numeric" value={seats} onChange={(e) => setSeats(e.target.value)} aria-invalid={errors.seats ? true : undefined} aria-describedby={errors.seats ? 'e-vseats' : undefined} />
          <FieldError id="e-vseats" k={errors.seats} />
        </label>
      </form>
    </Drawer>
  );
}

export function VehiclesPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const { centerId, vehicles } = useCenterData();
  const { busy, fleet } = useCenterDerived();
  const [editing, setEditing] = useState<Vehicle | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Vehicle | null>(null);
  const [working, setWorking] = useState(false);

  const remove = async () => {
    if (!deleting) return;
    setWorking(true);
    try {
      await deleteVehicle(centerId, deleting.id);
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
      <div className="page-h">
        <h1>{t('vh.title')}</h1>
        <span className="grow" />
        <button type="button" className="btn primary" onClick={() => setEditing('new')}><Icon name="plus" />{t('vh.add')}</button>
      </div>
      <div className="stat-chips" aria-label={t('vh.title')}>
        {chip(t('vh.total'), fleet.total)}{chip(t('vstat.ready'), fleet.ready)}{chip(t('vstat.on_mission'), fleet.onMission)}{chip(t('vstat.maintenance'), fleet.maintenance)}
      </div>
      <section className="card">
        {vehicles.length === 0 ? (
          <p className="empty"><Icon name="truck" /> {t('vh.empty')}</p>
        ) : (
          <div className="tbl-wrap">
            <table className="resp">
              <thead><tr><th>{t('vh.code')}</th><th>{t('vh.kind')}</th><th>{t('vh.seats')}</th><th>{t('vh.status')}</th><th /></tr></thead>
              <tbody>
                {vehicles.map((v) => (
                  <tr key={v.id} style={{ cursor: 'default' }}>
                    <td data-label={t('vh.code')}><span className="cell" style={{ whiteSpace: 'nowrap' }}><Icon name={CT_ICON.ems} /><b dir="ltr">{v.code}</b></span></td>
                    <td data-label={t('vh.kind')}>{t(`vkind.${v.kind}`)}</td>
                    <td data-label={t('vh.seats')}><Num>{v.seats}</Num></td>
                    <td data-label={t('vh.status')}><VehicleBadge state={vehicleState(v, busy)} /></td>
                    <td data-label="">
                      <div className="flags" style={{ flexWrap: 'nowrap' }}>
                        <button type="button" className="btn" onClick={() => setEditing(v)}><Icon name="edit" size="sm" />{t('ar.edit')}</button>
                        <button type="button" className="btn icon-only" onClick={() => setDeleting(v)} aria-label={`${t('centers.delete')}: ${v.code}`}><Icon name="trash" size="sm" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {editing && <VehicleDrawer vehicle={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
      {deleting && (
        <ConfirmDialog titleId="vd-t" title={t('vh.deleteTitle')} keepLabel={t('vh.deleteKeep')} confirmLabel={t('del.yes')} onKeep={() => setDeleting(null)} onConfirm={() => void remove()} confirmDisabled={busy.vehicles.has(deleting.id)} busy={working}>
          <p><b dir="ltr">{deleting.code}</b></p>
          <p className="muted">{t('vh.deleteDesc')}</p>
          {busy.vehicles.has(deleting.id) && <div className="callout warn"><Icon name="alert" /><span>{t('vh.deleteBusy')}</span></div>}
        </ConfirmDialog>
      )}
    </>
  );
}
