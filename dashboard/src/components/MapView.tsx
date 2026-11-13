import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useTranslation } from 'react-i18next';
import { iconSvg } from './Icon';
import type { IconName } from './iconPaths';
import type { LatLng } from '../domain/types';

export interface MapMarker extends LatLng {
  id: string;
  /** CSS classes of the marker (help | safe | area | need | center ready/busy/offline | me). */
  cls: string;
  icon: IconName;
  /** Spoken label and tooltip: marker meaning is never colour alone. */
  label: string;
  pulse?: boolean;
}

interface Props {
  markers: MapMarker[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  /** Re-fit the view to the markers whenever this value changes. */
  fitKey?: string;
  /** Dashed line between two points (center -> incident). */
  line?: [LatLng, LatLng];
  /** Pick mode: click the map or drag the pin to choose a location. */
  pick?: { value: LatLng | null; label: string; onChange: (ll: LatLng) => void };
  className?: string;
  ariaLabel: string;
}

const DEFAULT_VIEW: L.LatLngTuple = [41.015, 28.979];
const round5 = (n: number) => Math.round(n * 1e5) / 1e5;

/** Leaflet map with our own flat markers. Tiles come from OpenStreetMap; markers work even when tiles fail to load. */
export function MapView({ markers, selectedId, onSelect, fitKey, line, pick, className = 'map-box', ariaLabel }: Props) {
  const { t } = useTranslation();
  const host = useRef<HTMLDivElement | null>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const pickMarker = useRef<L.Marker | null>(null);
  const fitted = useRef<string | undefined>(undefined);
  const onSelectRef = useRef(onSelect);
  const pickRef = useRef(pick);
  useEffect(() => {
    onSelectRef.current = onSelect;
    pickRef.current = pick;
  });

  // Create the map once.
  useEffect(() => {
    if (!host.current) return;
    const m = L.map(host.current, { center: DEFAULT_VIEW, zoom: 11, zoomControl: true, attributionControl: true });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: `© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>` }).addTo(m);
    layer.current = L.layerGroup().addTo(m);
    m.on('click', (e: L.LeafletMouseEvent) => pickRef.current?.onChange({ lat: round5(e.latlng.lat), lng: round5(e.latlng.lng) }));
    const ro = new ResizeObserver(() => m.invalidateSize());
    ro.observe(host.current);
    map.current = m;
    return () => {
      ro.disconnect();
      m.remove();
      map.current = null;
      layer.current = null;
      pickMarker.current = null;
    };
  }, []);

  // Markers and the connecting line.
  useEffect(() => {
    const g = layer.current;
    const m = map.current;
    if (!g || !m) return;
    g.clearLayers();
    for (const mk of markers) {
      const sel = mk.id === selectedId;
      const icon = L.divIcon({
        className: 'mk-wrap',
        html: `<span class="mk ${mk.cls}${mk.pulse ? ' pulse' : ''}${sel ? ' sel' : ''}">${iconSvg(mk.icon)}</span>`,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });
      const marker = L.marker([mk.lat, mk.lng], { icon, title: mk.label, alt: mk.label, keyboard: true, riseOnHover: true });
      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectRef.current?.(mk.id);
      });
      marker.addTo(g);
    }
    if (line) L.polyline(line.map((p) => [p.lat, p.lng] as L.LatLngTuple), { color: 'currentColor', weight: 3, dashArray: '8 6', interactive: false, className: 'route-line' }).addTo(g);

    if (fitKey !== undefined && fitted.current !== fitKey && markers.length) {
      fitted.current = fitKey;
      const pts = markers.map((x) => [x.lat, x.lng] as L.LatLngTuple);
      m.fitBounds(L.latLngBounds(pts), { padding: [40, 40], maxZoom: 14 });
    }
  }, [markers, selectedId, line, fitKey]);

  // Pick-mode pin (draggable).
  const pickValue = pick?.value ?? null;
  const pickLabel = pick?.label;
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const value = pickValue;
    if (!value) {
      pickMarker.current?.remove();
      pickMarker.current = null;
      return;
    }
    if (!pickMarker.current) {
      const icon = L.divIcon({ className: 'mk-wrap', html: `<span class="mk center me">${iconSvg('crosshair')}</span>`, iconSize: [44, 44], iconAnchor: [22, 22] });
      const pm = L.marker([value.lat, value.lng], { icon, draggable: true, title: pickLabel, alt: pickLabel, keyboard: true });
      pm.on('dragend', () => {
        const ll = pm.getLatLng();
        pickRef.current?.onChange({ lat: round5(ll.lat), lng: round5(ll.lng) });
      });
      pm.addTo(m);
      pickMarker.current = pm;
    } else {
      pickMarker.current.setLatLng([value.lat, value.lng]);
    }
    if (!m.getBounds().contains([value.lat, value.lng])) m.panTo([value.lat, value.lng]);
  }, [pickValue?.lat, pickValue?.lng, pickLabel, pickValue]);

  return (
    <div className={`${className}${pick ? ' pick' : ''}`}>
      <div ref={host} className="leaflet-host" role="application" aria-label={ariaLabel} />
      <span className="sr-only">{t('map.attribution')}</span>
    </div>
  );
}
