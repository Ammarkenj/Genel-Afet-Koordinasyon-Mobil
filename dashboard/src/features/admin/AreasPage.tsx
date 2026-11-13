import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useAdminData } from '../../data/AdminData';
import { deleteArea, saveArea } from '../../data/repos';
import { parseCoord } from '../../domain/geo';
import type { AssemblyArea } from '../../domain/types';
import { ConfirmDialog, Drawer } from '../../components/Dialog';
import { Icon } from '../../components/Icon';
import { CapBar, DataGate, Num } from '../../components/parts';
import { useToast } from '../../components/Toast';
import { FieldError, LocationFields, validateLocation } from './forms';

type Errors = Partial<Record<'number' | 'name' | 'capacity' | 'occupied' | 'lat' | 'lng', string>>;

function AreaDrawer({ area, nextNumber, onClose }: { area: AssemblyArea | null; nextNumber: number; onClose: () => void }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [f, setF] = useState({
    number: String(area?.number ?? nextNumber), name: area?.name ?? '', capacity: String(area?.capacity ?? 500), occupied: String(area?.occupied ?? 0),
    lat: area ? String(area.lat) : '', lng: area ? String(area.lng) : '',
  });
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState(false);
  const set = (k: keyof typeof f, v: string) => setF((s) => ({ ...s, [k]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const int = (s: string) => (s.trim() !== '' && Number.isInteger(Number(s)) ? Number(s) : NaN);
    const errs: Errors = {
      ...(int(f.number) >= 1 ? {} : { number: 'err.units' }),
      ...(f.name.trim() ? {} : { name: 'err.required' }),
      ...(int(f.capacity) >= 1 ? {} : { capacity: 'err.units' }),
      ...(int(f.occupied) >= 0 ? {} : { occupied: 'err.required' }),
      ...validateLocation(f.lat, f.lng),
    };
    setErrors(errs);
    if (Object.keys(errs).length || busy) return;
    setBusy(true);
    setFailure(false);
    try {
      await saveArea({ number: int(f.number), name: f.name.trim(), capacity: int(f.capacity), occupied: int(f.occupied), lat: parseCoord(f.lat), lng: parseCoord(f.lng) }, area?.id);
      toast.show(t('common.saved'));
      onClose();
    } catch {
      setFailure(true);
    } finally {
      setBusy(false);
    }
  };

  const field = (k: 'number' | 'name' | 'capacity' | 'occupied', label: string, numeric = false) => (
    <label className={`field ${errors[k] ? 'err' : ''}`}>
      <span>{label}</span>
      <input className="input" inputMode={numeric ? 'numeric' : undefined} value={f[k]} onChange={(e) => set(k, e.target.value)} aria-invalid={errors[k] ? true : undefined} aria-describedby={errors[k] ? `e-${k}` : undefined} />
      <FieldError id={`e-${k}`} k={errors[k]} />
    </label>
  );

  return (
    <Drawer
      titleId="area-t"
      onClose={onClose}
      wide
      title={t(area ? 'ar.edit' : 'ar.add')}
      footer={
        <>
          <button type="submit" form="area-form" className="btn primary" style={{ minBlockSize: 52 }} disabled={busy}><Icon name="check" />{t('cf.saveEdit')}</button>
          <button type="button" className="btn" style={{ minBlockSize: 52 }} onClick={onClose}>{t('cf.cancel')}</button>
        </>
      }
    >
      <form id="area-form" className="stack" onSubmit={submit} noValidate>
        {failure && <div className="callout danger" role="alert"><Icon name="alert" /><span>{t('common.saveFail')}</span></div>}
        <div className="grid-2">{field('number', t('col.area'), true)}{field('name', t('col.place'))}</div>
        <div className="grid-2">{field('capacity', t('col.cap'), true)}{field('occupied', t('ar.occupied'), true)}</div>
        <LocationFields lat={f.lat} lng={f.lng} errors={errors} onChange={(a, b) => setF((s) => ({ ...s, lat: a, lng: b }))} />
      </form>
    </Drawer>
  );
}

export function AreasPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const { areas, loading, error, retry } = useAdminData();
  const [editing, setEditing] = useState<AssemblyArea | 'new' | null>(null);
  const [deleting, setDeleting] = useState<AssemblyArea | null>(null);
  const nextNumber = areas.reduce((m, a) => Math.max(m, a.number), 0) + 1;

  const remove = async () => {
    if (!deleting) return;
    try {
      await deleteArea(deleting.id);
      toast.show(t('common.saved'));
    } catch {
      toast.show(t('common.saveFail'));
    }
    setDeleting(null);
  };

  return (
    <DataGate loading={loading} error={error} onRetry={retry}>
      <section className="card">
        <div className="card-h"><h2>{t('ar.title')}</h2><span className="grow" /><button type="button" className="btn primary" onClick={() => setEditing('new')}><Icon name="plus" />{t('ar.add')}</button></div>
        {areas.length === 0 ? <p className="empty">{t('common.noData')}</p> : (
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>{t('col.area')}</th><th>{t('col.place')}</th><th>{t('col.cap')}</th><th>{t('col.open')}</th><th /></tr></thead>
              <tbody>
                {areas.map((a) => {
                  const p = a.occupied / a.capacity;
                  const badge = p >= 1
                    ? <span className="badge danger"><Icon name="alert" size="sm" />{t('ar.full')}</span>
                    : p >= 0.85
                      ? <span className="badge warn"><Icon name="alert" size="sm" />{t('ar.high')}</span>
                      : <span className="badge safe"><Icon name="check" size="sm" />{t('ar.open')}</span>;
                  return (
                    <tr key={a.id} style={{ cursor: 'default' }}>
                      <td><b><Num>{a.number}</Num></b></td>
                      <td><span className="cell"><Icon name="tent" />{a.name}</span></td>
                      <td><CapBar occupied={a.occupied} capacity={a.capacity} /></td>
                      <td>{badge}</td>
                      <td>
                        <div className="flags" style={{ flexWrap: 'nowrap' }}>
                          <button type="button" className="btn" onClick={() => setEditing(a)}><Icon name="edit" size="sm" />{t('ar.edit')}</button>
                          <button type="button" className="btn icon-only" onClick={() => setDeleting(a)} aria-label={`${t('centers.delete')}: ${a.name}`}><Icon name="trash" size="sm" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {editing && <AreaDrawer area={editing === 'new' ? null : editing} nextNumber={nextNumber} onClose={() => setEditing(null)} />}
      {deleting && (
        <ConfirmDialog titleId="ad-t" title={t('ad.title')} keepLabel={t('ad.keep')} confirmLabel={t('del.yes')} onKeep={() => setDeleting(null)} onConfirm={() => void remove()}>
          <p><b>{deleting.name}</b></p>
          <p className="muted">{t('ad.desc')}</p>
        </ConfirmDialog>
      )}
    </DataGate>
  );
}
