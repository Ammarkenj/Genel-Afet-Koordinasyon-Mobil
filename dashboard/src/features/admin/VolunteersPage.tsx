import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useAdminData } from '../../data/AdminData';
import { addNeed, deleteNeed } from '../../data/repos';
import { parseCoord } from '../../domain/geo';
import type { NeedId, VolunteerRole } from '../../domain/types';
import { Drawer } from '../../components/Dialog';
import { Icon } from '../../components/Icon';
import { DelBadge, NEED_ICON, ROLE_ICON, Urgency } from '../../components/badges';
import { DataGate, Num } from '../../components/parts';
import { useToast } from '../../components/Toast';
import { minutesAgo, useNow } from '../../hooks/useNow';
import { FieldError, LocationFields, validateLocation } from './forms';

const NEED_IDS: NeedId[] = ['aid', 'water', 'shelter'];
const ROLES: VolunteerRole[] = ['aid', 'rescue', 'logistics'];

function NeedDrawer({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [need, setNeed] = useState<NeedId>('aid');
  const [urgency, setUrgency] = useState<1 | 2 | 3>(2);
  const [district, setDistrict] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [errors, setErrors] = useState<{ district?: string; lat?: string; lng?: string }>({});
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = { ...(district.trim() ? {} : { district: 'err.required' }), ...validateLocation(lat, lng) };
    setErrors(errs);
    if (Object.keys(errs).length || busy) return;
    setBusy(true);
    setFailure(false);
    try {
      await addNeed({ need, urgency, district: district.trim(), lat: parseCoord(lat), lng: parseCoord(lng) });
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
      titleId="need-t"
      onClose={onClose}
      wide
      title={t('vol.add')}
      footer={
        <>
          <button type="submit" form="need-form" className="btn primary" style={{ minBlockSize: 52 }} disabled={busy}><Icon name="check" />{t('cf.saveEdit')}</button>
          <button type="button" className="btn" style={{ minBlockSize: 52 }} onClick={onClose}>{t('cf.cancel')}</button>
        </>
      }
    >
      <form id="need-form" className="stack" onSubmit={submit} noValidate>
        {failure && <div className="callout danger" role="alert"><Icon name="alert" /><span>{t('common.saveFail')}</span></div>}
        <div className="grid-2">
          <label className="field">
            <span>{t('col.need')}</span>
            <select className="select" value={need} onChange={(e) => setNeed(e.target.value as NeedId)}>{NEED_IDS.map((k) => <option key={k} value={k}>{t(`need.${k}`)}</option>)}</select>
          </label>
          <label className="field">
            <span>{t('col.urg')}</span>
            <select className="select" value={urgency} onChange={(e) => setUrgency(Number(e.target.value) as 1 | 2 | 3)}>{([1, 2, 3] as const).map((k) => <option key={k} value={k}>{t(`urg.${k}`)}</option>)}</select>
          </label>
        </div>
        <label className={`field ${errors.district ? 'err' : ''}`}>
          <span>{t('col.district')}</span>
          <input className="input" value={district} onChange={(e) => setDistrict(e.target.value)} aria-invalid={errors.district ? true : undefined} aria-describedby={errors.district ? 'e-district' : undefined} />
          <FieldError id="e-district" k={errors.district} />
        </label>
        <LocationFields lat={lat} lng={lng} errors={errors} onChange={(a, b) => { setLat(a); setLng(b); }} />
      </form>
    </Drawer>
  );
}

export function VolunteersPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const { needs, tasks, volunteers, loading, error, retry } = useAdminData();
  const now = useNow();
  const [adding, setAdding] = useState(false);

  const roleCount = (r: VolunteerRole) => volunteers.filter((v) => v.role === r && v.active).length;
  const total = ROLES.reduce((n, r) => n + roleCount(r), 0);
  const sorted = needs.slice().sort((a, b) => b.urgency - a.urgency);

  const remove = async (id: string) => {
    try {
      await deleteNeed(id);
      toast.show(t('common.saved'));
    } catch {
      toast.show(t('common.saveFail'));
    }
  };

  return (
    <DataGate loading={loading} error={error} onRetry={retry}>
      <div className="grid g-2-1">
        <section className="card">
          <div className="card-h"><h2>{t('vol.needs')}</h2><span className="grow" /><button type="button" className="btn primary" onClick={() => setAdding(true)}><Icon name="plus" />{t('vol.add')}</button></div>
          {sorted.length === 0 ? <p className="empty">{t('common.noData')}</p> : (
            <div className="tbl-wrap">
              <table>
                <thead><tr><th>{t('col.need')}</th><th>{t('col.district')}</th><th>{t('col.urg')}</th><th /></tr></thead>
                <tbody>
                  {sorted.map((n) => (
                    <tr key={n.id} style={{ cursor: 'default' }}>
                      <td><span className="cell"><Icon name={NEED_ICON[n.need]} /><b>{t(`need.${n.need}`)}</b></span></td>
                      <td>{n.district}</td>
                      <td><Urgency level={n.urgency} /></td>
                      <td><button type="button" className="btn icon-only" onClick={() => void remove(n.id)} aria-label={`${t('centers.delete')}: ${t(`need.${n.need}`)} · ${n.district}`}><Icon name="trash" size="sm" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <section className="card">
          <div className="card-h"><h2>{t('vol.roles')}</h2></div>
          <div className="hbars">
            {ROLES.map((r) => (
              <div className="hbar" key={r}>
                <Icon name={ROLE_ICON[r]} />
                <span>{t(`role.${r}`)}</span>
                <span className="track"><span className="fill" style={{ inlineSize: `${total ? (roleCount(r) / total) * 100 : 0}%` }} /></span>
                <b><Num>{roleCount(r)}</Num></b>
              </div>
            ))}
          </div>
        </section>
      </div>
      <section className="card">
        <div className="card-h"><h2>{t('vol.tasks')}</h2></div>
        {tasks.length === 0 ? <p className="empty">{t('common.noData')}</p> : (
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>{t('col.need')}</th><th>{t('col.vol')}</th><th>{t('col.time')}</th><th>{t('col.del')}</th><th>{t('col.state')}</th></tr></thead>
              <tbody>
                {tasks.map((x) => (
                  <tr key={x.id} style={{ cursor: 'default' }}>
                    <td><span className="cell"><Icon name={NEED_ICON[x.need]} /><b>{t(`need.${x.need}`)}</b></span></td>
                    <td><Num>{x.volunteerId || '—'}</Num></td>
                    <td>{t('feed.ago', { n: minutesAgo(x.createdAtMs, now) })}</td>
                    <td><DelBadge state={x.state} /></td>
                    <td>{x.done
                      ? <span className="badge safe"><Icon name="checkCircle" size="sm" />{t('vol.done')}</span>
                      : <span className="badge info"><Icon name="route" size="sm" />{t('vol.accepted')}</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {adding && <NeedDrawer onClose={() => setAdding(false)} />}
    </DataGate>
  );
}
