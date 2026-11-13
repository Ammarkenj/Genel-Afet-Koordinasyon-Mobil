import { randomInt } from 'node:crypto';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getMessaging, type Message } from 'firebase-admin/messaging';
import { setGlobalOptions } from 'firebase-functions/v2';
import { onCall, HttpsError, type CallableRequest } from 'firebase-functions/v2/https';
import { onDocumentCreated, onDocumentWritten } from 'firebase-functions/v2/firestore';
import * as logger from 'firebase-functions/logger';
import { autoDispatchType, pickCenter } from './dispatch';
import { PASSWORD_ALPHABET, buildPush, formatPassword, normalizeLang, parseCenterRequest, type NotifySnapshot } from './notify';

setGlobalOptions({ region: 'europe-west1', maxInstances: 10 });
initializeApp();
const db = getFirestore();
const auth = getAuth();

const OPEN_STATUSES = ['notified', 'accepted', 'enroute', 'arrived'];

function requireAdmin(request: CallableRequest): void {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in first.');
  if (request.auth.token.role !== 'admin') throw new HttpsError('permission-denied', 'Only admins can do this.');
}

const newPassword = () => formatPassword(Array.from({ length: 12 }, () => PASSWORD_ALPHABET[randomInt(PASSWORD_ALPHABET.length)] ?? 'x'));

/** Admin creates a center: Auth account (temporary password) + custom claims + the center document, all or nothing. */
export const createCenter = onCall(async (request) => {
  requireAdmin(request);
  const parsed = parseCenterRequest(request.data);
  if (!parsed.ok) throw new HttpsError('invalid-argument', parsed.message);
  const { email, ...fields } = parsed.value;

  const ref = db.collection('centers').doc();
  const password = newPassword();
  let uid: string;
  try {
    uid = (await auth.createUser({ email, password, displayName: fields.name })).uid;
  } catch (e) {
    if ((e as { code?: string }).code === 'auth/email-already-exists') throw new HttpsError('already-exists', 'An account with this email already exists.');
    logger.error('createUser failed', e);
    throw new HttpsError('internal', 'Could not create the account.');
  }
  try {
    await auth.setCustomUserClaims(uid, { role: 'center', centerId: ref.id });
    await ref.set({ ...fields, email, active: true, authUid: uid, stats: { vehicles: 0, vehiclesReady: 0, staff: 0, crews: 0 }, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
  } catch (e) {
    logger.error('createCenter rollback', e);
    await auth.deleteUser(uid).catch(() => undefined);
    throw new HttpsError('internal', 'Could not create the center.');
  }
  logger.info('center created', { centerId: ref.id, by: request.auth?.uid });
  return { centerId: ref.id, email, password };
});

async function centerOf(centerId: unknown) {
  if (typeof centerId !== 'string' || !centerId) throw new HttpsError('invalid-argument', 'centerId is required.');
  const snap = await db.collection('centers').doc(centerId).get();
  if (!snap.exists) throw new HttpsError('not-found', 'Center not found.');
  return snap;
}

/** Disable or re-enable a center's account (sign-in and existing sessions). */
export const setCenterActive = onCall(async (request) => {
  requireAdmin(request);
  const snap = await centerOf(request.data?.centerId);
  const active = request.data?.active === true;
  const uid = snap.get('authUid') as string | undefined;
  if (uid) {
    await auth.updateUser(uid, { disabled: !active });
    if (!active) await auth.revokeRefreshTokens(uid);
  }
  await snap.ref.update({ active, updatedAt: FieldValue.serverTimestamp() });
  return { ok: true };
});

/** Delete a center. Refused while it still has open assignments; history is kept. */
export const deleteCenter = onCall(async (request) => {
  requireAdmin(request);
  const snap = await centerOf(request.data?.centerId);
  const open = await db.collection('assignments').where('centerId', '==', snap.id).where('status', 'in', OPEN_STATUSES).limit(1).get();
  if (!open.empty) throw new HttpsError('failed-precondition', 'The center still has open assignments.');
  const uid = snap.get('authUid') as string | undefined;
  if (uid) await auth.deleteUser(uid).catch((e: { code?: string }) => { if (e.code !== 'auth/user-not-found') throw e; });
  await db.recursiveDelete(snap.ref);
  logger.info('center deleted', { centerId: snap.id, by: request.auth?.uid });
  return { ok: true };
});

/** New report from the app: a crash or a fall is handed to the nearest ready ambulance center at once (same assignment
 *  the admin would create by hand, so the push below and the center's live panel work unchanged). Anything else waits
 *  for an operator. Idempotent: the assignment id is reportId_centerId, so a retry never notifies a center twice. */
export const onReportCreated = onDocumentCreated('reports/{id}', async (event) => {
  const snap = event.data;
  if (!snap) return;
  const r = snap.data();
  const type = autoDispatchType(r);
  if (!type) return;

  const centers = await db.collection('centers').where('type', '==', type).get();
  const center = pickCenter(r, centers.docs.map((d) => ({ id: d.id, ...d.data() })));
  if (!center) {
    logger.warn('auto-dispatch: no usable center, left for an operator', { reportId: snap.id, type });
    return;
  }

  const assignment = db.collection('assignments').doc(`${snap.id}_${center.id}`);
  try {
    await assignment.create({
      reportId: snap.id,
      centerId: center.id,
      status: 'notified',
      seen: false,
      crew: { vehicles: [], staff: [], teams: [] },
      snapshot: {
        no: typeof r.no === 'number' ? r.no : 0,
        kind: r.kind,
        type: r.type ?? null,
        auto: r.auto === true,
        injured: typeof r.injured === 'boolean' ? r.injured : null,
        trapped: typeof r.trapped === 'boolean' ? r.trapped : null,
        people: typeof r.people === 'number' ? r.people : 1,
        district: typeof r.district === 'string' ? r.district : '',
        lat: r.lat,
        lng: r.lng,
      },
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  } catch (e) {
    if ((e as { code?: number | string }).code === 6 || (e as { code?: string }).code === 'already-exists') return; // already handed over
    throw e;
  }
  await snap.ref.update({ ops: 'dispatched', updatedAt: FieldValue.serverTimestamp() });
  logger.info('auto-dispatched', { reportId: snap.id, centerId: center.id, type: r.type });
});

const INVALID_TOKEN = new Set(['messaging/registration-token-not-registered', 'messaging/invalid-registration-token']);

/** New assignment: push the center's devices (data-only message; the service worker shows it). */
export const onAssignmentCreated = onDocumentCreated('assignments/{id}', async (event) => {
  const snap = event.data;
  if (!snap) return;
  const a = snap.data() as { centerId?: string; snapshot?: NotifySnapshot };
  if (!a.centerId || !a.snapshot) return;

  const centerRef = db.collection('centers').doc(a.centerId);
  const center = await centerRef.get();
  if (!center.exists || center.get('active') === false) return;
  const place = { lat: center.get('lat') as number, lng: center.get('lng') as number };

  const devices = await centerRef.collection('devices').get();
  if (devices.empty) {
    logger.info('assignment created but the center has no push devices', { assignmentId: snap.id, centerId: a.centerId });
    return;
  }
  const targets = devices.docs.map((d) => ({ ref: d.ref, token: d.get('token') as string, lang: normalizeLang(d.get('lang')) }));
  const messages: Message[] = targets.map((t) => {
    const p = buildPush(t.lang, snap.id, a.snapshot as NotifySnapshot, place);
    return { token: t.token, data: { ...p }, webpush: { headers: { Urgency: 'high', TTL: '3600' } } };
  });
  let res;
  try {
    res = await getMessaging().sendEach(messages);
  } catch (e) {
    // A messaging outage must not fail the assignment itself; the center still sees it live in its panel.
    logger.error('push send failed', { assignmentId: snap.id, error: String(e) });
    return;
  }
  await Promise.all(
    res.responses.map((r, i) => {
      const code = r.error?.code ?? '';
      const target = targets[i];
      if (!r.success && target && INVALID_TOKEN.has(code)) return target.ref.delete();
      if (!r.success) logger.warn('push failed', { code, assignmentId: snap.id });
      return undefined;
    }),
  );
  logger.info('assignment push sent', { assignmentId: snap.id, devices: targets.length, ok: res.successCount });
});

/** Counts of a center's vehicles, staff and ready crews, kept on the center document so the admin list needs no extra reads. */
async function recomputeStats(centerId: string): Promise<void> {
  const ref = db.collection('centers').doc(centerId);
  const [vehicles, vehiclesReady, staff, crews, center] = await Promise.all([
    ref.collection('vehicles').count().get(),
    ref.collection('vehicles').where('status', '==', 'ready').count().get(),
    ref.collection('staff').count().get(),
    ref.collection('crews').count().get(),
    ref.get(),
  ]);
  if (!center.exists) return; // the center is being deleted
  await ref.update({
    stats: { vehicles: vehicles.data().count, vehiclesReady: vehiclesReady.data().count, staff: staff.data().count, crews: crews.data().count },
  });
}

export const onVehicleWritten = onDocumentWritten('centers/{centerId}/vehicles/{vehicleId}', (event) => recomputeStats(event.params.centerId));
export const onStaffWritten = onDocumentWritten('centers/{centerId}/staff/{staffId}', (event) => recomputeStats(event.params.centerId));
export const onCrewWritten = onDocumentWritten('centers/{centerId}/crews/{crewId}', (event) => recomputeStats(event.params.centerId));
