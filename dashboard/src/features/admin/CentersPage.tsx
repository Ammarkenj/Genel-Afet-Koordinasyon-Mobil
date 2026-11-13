import { useMemo, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAdminData } from '../../data/AdminData';
import { createCenter, deleteCenter, setCenterActive, updateCenter, type CenterInput, type CreateCenterResult } from '../../data/repos';
import { parseCoord } from '../../domain/geo';
import { freeVehicleCount } from '../../domain/crew';
import { CENTER_STATUSES, CENTER_TYPES, type CenterStatus, type CenterType, type ServiceCenter } from '../../domain/types';
import { ConfirmDialog, Drawer } from '../../components/Dialog';
import { Icon } from '../../components/Icon';
import { CT_ICON, CenterStatusBadge, CenterTypeCell } from '../../components/badges';
import type { MapMarker } from '../../components/MapView';
import { DataGate, Num } from '../../components/parts';
import { useToast } from '../../components/Toast';
import { FieldError, LocationFields, validateLocation } from './forms';

interface FormState {
  name: string;
  type: CenterType;
  status: CenterStatus;
  phone: string;
  address: string;
  email: string;
  lat: string;
  lng: string;
}
type Errors = Partial<Record<'name' | 'email' | 'lat' | 'lng', string>>;

const BLANK: FormState = { name: '', type: 'ems', status: 'ready', phone: '', address: '', email: '', lat: '', lng: '' };
const fromCenter = (c: ServiceCenter): FormState => ({ name: c.name, type: c.type, status: c.status, phone: c.phone, address: c.address, email: c.email, lat: String(c.lat), lng: String(c.lng) });

function validate(f: FormState, mode: 'add' | 'edit'): Errors {
  const e: Errors = {};
  if (!f.name.trim()) e.name = 'err.required';
  if (mode === 'add' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = 'err.email';
  return { ...e, ...validateLocation(f.lat, f.lng) };
}

const errorKeyOf = (e: unknown): string => ((e as { code?: string }).code === 'functions/already-exists' ? 'centers.emailTaken' : 'centers.createFail');

function CenterDrawer({ center, others, onClose }: { center: ServiceCenter | null; others: ServiceCenter[]; onClose: () => void }) {
  const { t } = useTranslation();
  const toast = useToast();
  const mode = center ? 'edit' : 'add';
  const [f, setF] = useState<FormState>(center ? fromCenter(center) : BLANK);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [created, setCreated] = useState<CreateCenterResult | null>(null);
  const bodyRef = useRef<HTMLFormElement | null>(null);

  const context = useMemo<MapMarker[]>(
    () => others.filter((c) => c.id !== center?.id).map((c) => ({ id: c.id, lat: c.lat, lng: c.lng, cls: `center ${c.status}`, icon: CT_ICON[c.type], label: c.name })),
    [others, center?.id],
  );
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((s) => ({ ...s, [k]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const errs = validate(f, mode);
    setErrors(errs);
    if (Object.keys(errs).length) {
      requestAnimationFrame(() => bodyRef.current?.closest('aside')?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    const input: CenterInput = { name: f.name.trim(), type: f.type, status: f.status, phone: f.phone.trim(), address: f.address.trim(), lat: parseCoord(f.lat), lng: parseCoord(f.lng) };
    setBusy(true);
    setFailure(null);
    try {
      if (center) {
        await updateCenter(center.id, input);
        toast.show(t('common.saved'));
        onClose();
      } else {
        setCreated(await createCenter({ ...input, email: f.email.trim() }));
      }
    } catch (err) {
      setFailure(errorKeyOf(err));
    } finally {
      setBusy(false);
    }
  };

  if (created) {
    return <Credentials result={created} name={f.name} onClose={onClose} />;
  }

  const invalid = (k: keyof Errors) => (errors[k] ? true : undefined);
  const desc = (k: keyof Errors) => (errors[k] ? `e-${k}` : undefined);
  return (
    <Drawer
      titleId="cf-t"
      onClose={onClose}
      wide
      title={t(mode === 'add' ? 'cf.addTitle' : 'cf.editTitle')}
      footer={
        <>
          <button type="submit" form="center-form" className="btn primary" style={{ minBlockSize: 52 }} disabled={busy}>
            <Icon name="check" />{t(mode === 'add' ? 'cf.save' : 'cf.saveEdit')}
          </button>
          <button type="button" className="btn" style={{ minBlockSize: 52 }} onClick={onClose}>{t('cf.cancel')}</button>
        </>
      }
    >
      <form id="center-form" onSubmit={submit} noValidate className="stack" ref={bodyRef}>
        {failure && <div className="callout danger" role="alert"><Icon name="alert" /><span>{t(failure)}</span></div>}
        <label className={`field ${errors.name ? 'err' : ''}`}>
          <span>{t('cf.name')}</span>
          <input className="input" value={f.name} onChange={(e) => set('name', e.target.value)} aria-invalid={invalid('name')} aria-describedby={desc('name')} />
          <FieldError id="e-name" k={errors.name} />
        </label>
        <div className="grid-2">
          <label className="field">
            <span>{t('cf.type')}</span>
            <select className="select" value={f.type} onChange={(e) => set('type', e.target.value as CenterType)}>
              {CENTER_TYPES.map((k) => <option key={k} value={k}>{t(`ctype.${k}`)}</option>)}
            </select>
          </label>
          <label className="field">
            <span>{t('cf.status')}</span>
            <select className="select" value={f.status} onChange={(e) => set('status', e.target.value as CenterStatus)}>
              {CENTER_STATUSES.map((k) => <option key={k} value={k}>{t(`cstat.${k}`)}</option>)}
            </select>
          </label>
        </div>
        <label className="field">
          <span>{t('cf.phone')}</span>
          <input className="input" type="tel" dir="ltr" value={f.phone} onChange={(e) => set('phone', e.target.value)} />
        </label>
        <div className="callout info"><Icon name="info" /><span>{t('cf.vehiclesHint')}</span></div>
        <label className="field">
          <span>{t('cf.address')}</span>
          <input className="input" value={f.address} onChange={(e) => set('address', e.target.value)} />
        </label>
        <label className={`field ${errors.email ? 'err' : ''}`}>
          <span>{t('cf.email')}</span>
          <input className="input" type="email" dir="ltr" value={f.email} disabled={mode === 'edit'} onChange={(e) => set('email', e.target.value)} aria-invalid={invalid('email')} aria-describedby={desc('email')} />
          <span className="hint">{t(mode === 'edit' ? 'cf.emailLocked' : 'cf.emailHint')}</span>
          <FieldError id="e-email" k={errors.email} />
        </label>
        <LocationFields lat={f.lat} lng={f.lng} errors={errors} onChange={(lat, lng) => setF((s) => ({ ...s, lat, lng }))} context={context} />
      </form>
    </Drawer>
  );
}

/** Shown once after creation: the temporary password is never stored in clear text and cannot be read again. */
function Credentials({ result, name, onClose }: { result: CreateCenterResult; name: string; onClose: () => void }) {
  const { t } = useTranslation();
  const toast = useToast();
  const passRef = useRef<HTMLElement | null>(null);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(result.password);
      toast.show(t('cr.copied'));
    } catch {
      // Clipboard can be refused (older app views): select the text so the person can copy it by hand.
      const el = passRef.current;
      if (el) {
        const r = document.createRange();
        r.selectNodeContents(el);
        const s = window.getSelection();
        s?.removeAllRanges();
        s?.addRange(r);
      }
    }
  };
  return (
    <Drawer titleId="cr-t" onClose={onClose} hideClose title={t('cr.title')} footer={<button type="button" className="btn primary" style={{ minBlockSize: 52 }} onClick={onClose}>{t('cr.done')}</button>}>
      <div className="callout info"><Icon name="check" /><span>{name}</span></div>
      <p>{t('cr.desc')}</p>
      <div className="cred">
        <span className="hint">{t('cr.email')}</span><code>{result.email}</code>
        <span className="hint">{t('cr.pass')}</span><code ref={passRef}>{result.password}</code>
        <button type="button" className="btn" onClick={() => void copy()}><Icon name="copy" size="sm" />{t('cr.copy')}</button>
      </div>
      <div className="callout warn"><Icon name="alert" /><span>{t('cr.warn')}</span></div>
    </Drawer>
  );
}

export function CentersPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const { centers, assignments, loading, error, retry } = useAdminData();
  const [editing, setEditing] = useState<ServiceCenter | 'new' | null>(null);
  const [deleting, setDeleting] = useState<ServiceCenter | null>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const openCount = (id: string) => assignments.filter((a) => a.centerId === id && a.status !== 'done' && a.status !== 'declined').length;

  const toggle = async (c: ServiceCenter) => {
    setFailure(null);
    try {
      await setCenterActive(c.id, !c.active);
      toast.show(t('common.saved'));
    } catch {
      setFailure('common.saveFail');
    }
  };
  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await deleteCenter(deleting.id);
      toast.show(t('common.saved'));
      setDeleting(null);
    } catch {
      setFailure('centers.deleteFail');
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <DataGate loading={loading} error={error} onRetry={retry}>
      <section className="card">
        <div className="card-h">
          <h2>{t('centers.title')}</h2>
          <span className="grow" />
          <button type="button" className="btn primary" onClick={() => setEditing('new')}><Icon name="plus" />{t('centers.add')}</button>
        </div>
        {failure && <div className="callout danger" role="alert" style={{ marginBlockEnd: 12 }}><Icon name="alert" /><span>{t(failure)}</span></div>}
        {centers.length === 0 ? (
          <p className="empty">{t('centers.empty')}</p>
        ) : (
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr><th>{t('cf.name')}</th><th>{t('col.type')}</th><th>{t('cf.status')}</th><th>{t('centers.vehiclesCol')}</th><th>{t('centers.staffCol')}</th><th>{t('centers.crewsCol')}</th><th>{t('col.tasks')}</th><th>{t('col.account')}</th><th /></tr>
              </thead>
              <tbody>
                {centers.map((c) => (
                  <tr key={c.id} style={{ cursor: 'default' }}>
                    <td><Link to={`/admin/centers/${c.id}`} className="cell" style={{ fontWeight: 700 }}>{c.name}</Link><div className="hint">{c.address}</div><div className="hint" dir="ltr" style={{ textAlign: 'start' }}>{c.phone}</div></td>
                    <td><CenterTypeCell type={c.type} /></td>
                    <td><CenterStatusBadge status={c.status} /></td>
                    <td><Num>{freeVehicleCount(c, assignments)}</Num> / <Num>{c.stats.vehicles}</Num></td>
                    <td><Num>{c.stats.staff}</Num></td>
                    <td><Num>{c.stats.crews}</Num></td>
                    <td><Num>{openCount(c.id)}</Num></td>
                    <td><span className={`badge ${c.active ? 'safe' : ''}`}><Icon name={c.active ? 'check' : 'lock'} size="sm" />{t(c.active ? 'acc.active' : 'acc.disabled')}</span></td>
                    <td>
                      <div className="flags" style={{ flexWrap: 'nowrap' }}>
                        <Link className="btn" to={`/admin/centers/${c.id}`}><Icon name="chevron" size="sm" flip />{t('centers.detail')}</Link>
                        <button type="button" className="btn" onClick={() => setEditing(c)}><Icon name="edit" size="sm" />{t('ar.edit')}</button>
                        <button type="button" className="btn" onClick={() => void toggle(c)}><Icon name={c.active ? 'lock' : 'check'} size="sm" />{t(c.active ? 'centers.disable' : 'centers.enable')}</button>
                        <button type="button" className="btn icon-only" onClick={() => setDeleting(c)} aria-label={`${t('centers.delete')}: ${c.name}`}><Icon name="trash" size="sm" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {editing && <CenterDrawer center={editing === 'new' ? null : editing} others={centers} onClose={() => setEditing(null)} />}
      {deleting && (
        <ConfirmDialog
          titleId="cm-t"
          title={t('del.title')}
          keepLabel={t('del.keep')}
          confirmLabel={t('del.yes')}
          onKeep={() => setDeleting(null)}
          onConfirm={() => void remove()}
          confirmDisabled={openCount(deleting.id) > 0}
          busy={busy}
        >
          <p><b>{deleting.name}</b></p>
          <p className="muted">{t('del.desc')}</p>
          {openCount(deleting.id) > 0 && <div className="callout warn"><Icon name="alert" /><span>{t('del.busy')}</span></div>}
        </ConfirmDialog>
      )}
    </DataGate>
  );
}
