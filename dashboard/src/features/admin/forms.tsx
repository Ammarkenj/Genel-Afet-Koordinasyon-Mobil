import { useTranslation } from 'react-i18next';
import { Icon } from '../../components/Icon';
import { MapView, type MapMarker } from '../../components/MapView';
import { isLat, isLng, parseCoord } from '../../domain/geo';
import type { LatLng } from '../../domain/types';

export const fieldErr = (key?: string) => key;

/** Validation for a typed location. Returns i18n keys, empty when valid. */
export function validateLocation(lat: string, lng: string): { lat?: string; lng?: string } {
  if (lat.trim() === '' && lng.trim() === '') return { lat: 'err.pick' };
  const e: { lat?: string; lng?: string } = {};
  if (!isLat(parseCoord(lat))) e.lat = 'err.lat';
  if (!isLng(parseCoord(lng))) e.lng = 'err.lng';
  return e;
}

export function FieldError({ id, k }: { id: string; k?: string }) {
  const { t } = useTranslation();
  if (!k) return null;
  return <span className="err-text" id={id}><Icon name="alert" size="sm" />{t(k)}</span>;
}

interface LocationProps {
  lat: string;
  lng: string;
  errors: { lat?: string; lng?: string };
  onChange: (lat: string, lng: string) => void;
  /** Other places on the map for context (not selectable here). */
  context?: MapMarker[];
}

/** Location input: click or drag on the map, or type the coordinates (the keyboard alternative). */
export function LocationFields({ lat, lng, errors, onChange, context }: LocationProps) {
  const { t } = useTranslation();
  const la = parseCoord(lat);
  const ln = parseCoord(lng);
  const value: LatLng | null = isLat(la) && isLng(ln) ? { lat: la, lng: ln } : null;
  return (
    <div className={`field ${errors.lat || errors.lng ? 'err' : ''}`}>
      <span>{t('cf.loc')}: {t('cf.pick')}</span>
      <MapView
        markers={context ?? []}
        fitKey={value ? undefined : 'loc'}
        pick={{ value, label: t('cf.loc'), onChange: (ll) => onChange(String(ll.lat), String(ll.lng)) }}
        ariaLabel={t('cf.pick')}
      />
      <span className="hint">{t('cf.pickHint')}</span>
      <div className="grid-2">
        <label className="field">
          <span>{t('cf.lat')}</span>
          <input className="input" inputMode="decimal" dir="ltr" value={lat} onChange={(e) => onChange(e.target.value, lng)} aria-invalid={errors.lat ? true : undefined} aria-describedby={errors.lat ? 'e-lat' : undefined} />
          <FieldError id="e-lat" k={errors.lat} />
        </label>
        <label className="field">
          <span>{t('cf.lng')}</span>
          <input className="input" inputMode="decimal" dir="ltr" value={lng} onChange={(e) => onChange(lat, e.target.value)} aria-invalid={errors.lng ? true : undefined} aria-describedby={errors.lng ? 'e-lng' : undefined} />
          <FieldError id="e-lng" k={errors.lng} />
        </label>
      </div>
    </div>
  );
}
