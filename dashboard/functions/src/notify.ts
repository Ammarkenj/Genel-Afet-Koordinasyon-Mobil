/** Push notification text for a new assignment. Pure and dependency-free so it can be tested without Firebase. */

export type PushLang = 'tr' | 'ar';

export interface NotifySnapshot {
  type: string | null;
  kind: string;
  auto: boolean;
  district: string;
  lat: number;
  lng: number;
}

const INCIDENT: Record<PushLang, Record<string, string>> = {
  tr: { quake: 'Deprem', crash: 'Kaza', fall: 'Ani düşme', fire: 'Yangın', other: 'Diğer' },
  ar: { quake: 'هزة أرضية', crash: 'حادث', fall: 'سقوط مفاجئ', fire: 'حريق', other: 'أخرى' },
};

const COPY = {
  tr: { title: 'Yeni bildirim', priority: 'ÇOK YÜKSEK ÖNCELİK', km: 'km' },
  ar: { title: 'بلاغ جديد', priority: 'أولوية قصوى', km: 'كم' },
} as const;

const R_KM = 6371;
const rad = (d: number) => (d * Math.PI) / 180;

export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export const normalizeLang = (v: unknown): PushLang => (v === 'ar' ? 'ar' : 'tr');

/** An automatically detected fall may mean the person is unconscious: the ambulance is told in the title. */
export const isPriority = (s: Pick<NotifySnapshot, 'kind' | 'type' | 'auto'>) => s.kind === 'help' && s.type === 'fall' && s.auto;

export interface PushPayload {
  title: string;
  body: string;
  url: string;
  tag: string;
  lang: PushLang;
  dir: 'ltr' | 'rtl';
}

export function buildPush(lang: PushLang, assignmentId: string, s: NotifySnapshot, center: { lat: number; lng: number }): PushPayload {
  const copy = COPY[lang];
  const type = INCIDENT[lang][s.type ?? 'other'] ?? INCIDENT[lang].other!;
  const km = (Math.round(distanceKm(s, center) * 10) / 10).toFixed(1);
  const head = isPriority(s) ? `${copy.priority} · ${type}` : type;
  return {
    title: `${copy.title} · ${head}`,
    body: `${s.district} · ${km} ${copy.km}`,
    url: `/center/assignments/${assignmentId}`,
    tag: assignmentId,
    lang,
    dir: lang === 'ar' ? 'rtl' : 'ltr',
  };
}

/** Temporary password for a new center account: 12 unambiguous characters in three groups. */
export function formatPassword(chars: string[]): string {
  const s = chars.join('');
  return `${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8, 12)}`;
}

export const PASSWORD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

export const CENTER_TYPES = ['fire', 'rescue', 'sar', 'ems'] as const;
export const CENTER_STATUSES = ['ready', 'busy', 'offline'] as const;

export interface CenterFields {
  name: string;
  type: (typeof CENTER_TYPES)[number];
  status: (typeof CENTER_STATUSES)[number];
  phone: string;
  address: string;
  lat: number;
  lng: number;
  email: string;
}

/** Validates the createCenter request. Returns the cleaned fields or a message for the caller. */
export function parseCenterRequest(data: unknown): { ok: true; value: CenterFields } | { ok: false; message: string } {
  const d = (data && typeof data === 'object' ? data : {}) as Record<string, unknown>;
  const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
  const name = str(d.name, 120);
  const email = str(d.email, 200).toLowerCase();
  const phone = str(d.phone, 40);
  const address = str(d.address, 200);
  const type = d.type as CenterFields['type'];
  const status = d.status as CenterFields['status'];
  const lat = d.lat;
  const lng = d.lng;
  if (!name) return { ok: false, message: 'name is required' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, message: 'a valid email is required' };
  if (!CENTER_TYPES.includes(type)) return { ok: false, message: 'invalid type' };
  if (!CENTER_STATUSES.includes(status)) return { ok: false, message: 'invalid status' };
  if (typeof lat !== 'number' || !(lat >= -90 && lat <= 90)) return { ok: false, message: 'invalid latitude' };
  if (typeof lng !== 'number' || !(lng >= -180 && lng <= 180)) return { ok: false, message: 'invalid longitude' };
  return { ok: true, value: { name, email, phone, address, type, status, lat, lng } };
}
