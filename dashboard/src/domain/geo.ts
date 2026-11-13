import type { LatLng } from './types';

const R_KM = 6371;
const rad = (d: number) => (d * Math.PI) / 180;

/** Great-circle distance in kilometres. */
export function distanceKm(a: LatLng, b: LatLng): number {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Rough driving time in minutes at city speed (about 42 km/h) plus one minute to get moving. */
export function etaMinutes(km: number): number {
  return Math.max(2, Math.round(km / 0.7) + 1);
}

export const isLat = (v: number) => Number.isFinite(v) && v >= -90 && v <= 90;
export const isLng = (v: number) => Number.isFinite(v) && v >= -180 && v <= 180;

/** Parses a coordinate typed by a person; returns NaN for empty or invalid text. */
export function parseCoord(text: string): number {
  const s = text.trim().replace(',', '.');
  return s === '' ? NaN : Number(s);
}

export const googleMapsDirections = (to: LatLng) =>
  `https://www.google.com/maps/dir/?api=1&destination=${to.lat},${to.lng}`;
