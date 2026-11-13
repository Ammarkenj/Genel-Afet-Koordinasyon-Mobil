import { collection, doc, serverTimestamp, setDoc, updateDoc, writeBatch, addDoc, deleteDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../firebase/app';
import type { AssemblyArea, AssignmentStatus, CenterStatus, CenterType, Crew, Need, OpsStatus, Report, ReportSnapshot, StaffRole, StaffStatus, Team, VehicleKind, VehicleStatus } from '../domain/types';

/* ---------- reports and assignments (admin) ---------- */

export const snapshotOf = (r: Report): ReportSnapshot => ({
  no: r.no, kind: r.kind, type: r.type, auto: r.auto, injured: r.injured, trapped: r.trapped, people: r.people, district: r.district, lat: r.lat, lng: r.lng,
});

/** Assigns a report to one or more centers in one atomic write and marks it "dispatched".
 *  The document id is deterministic, so a center can never receive the same report twice. */
export async function assignReport(report: Report, centerIds: string[]): Promise<void> {
  const batch = writeBatch(db);
  for (const centerId of centerIds) {
    batch.set(doc(db, 'assignments', `${report.id}_${centerId}`), {
      reportId: report.id,
      centerId,
      status: 'notified',
      seen: false,
      crew: { vehicles: [], staff: [], teams: [] },
      snapshot: snapshotOf(report),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  batch.update(doc(db, 'reports', report.id), { ops: 'dispatched', updatedAt: serverTimestamp() });
  await batch.commit();
}

export const setReportOps = (id: string, ops: OpsStatus) => updateDoc(doc(db, 'reports', id), { ops, updatedAt: serverTimestamp() });

/* ---------- assignments (center) ---------- */

/** The server-time field each step must carry (the rules require it, and the dashboard's response times come from it). */
const STEP_STAMP = { accepted: 'acceptedAt', enroute: 'enrouteAt', arrived: 'arrivedAt', done: 'doneAt' } as const;

/** Moves an assignment one step forward (or declines it). Accepting or leaving can carry the crew that goes out. */
export const setAssignmentStatus = (id: string, status: AssignmentStatus, crew?: Crew) =>
  updateDoc(doc(db, 'assignments', id), {
    status,
    seen: true,
    updatedAt: serverTimestamp(),
    ...(status !== 'declined' && status !== 'notified' ? { [STEP_STAMP[status]]: serverTimestamp() } : {}),
    ...(crew ? { crew } : {}),
  });

/** Corrects the crew while the job is accepted or on the way. */
export const updateCrew = (id: string, crew: Crew) => updateDoc(doc(db, 'assignments', id), { crew, updatedAt: serverTimestamp() });

/** Marks an assignment as seen when the center opens it (turns off the "new" banner). */
export const markAssignmentSeen = (id: string) => updateDoc(doc(db, 'assignments', id), { seen: true, updatedAt: serverTimestamp() });

/* ---------- centers ---------- */

export interface CenterInput {
  name: string;
  type: CenterType;
  status: CenterStatus;
  phone: string;
  address: string;
  lat: number;
  lng: number;
}

export interface CreateCenterRequest extends CenterInput {
  email: string;
}
export interface CreateCenterResult {
  centerId: string;
  email: string;
  /** Shown to the admin once; never stored in clear text. */
  password: string;
}

export const createCenter = async (req: CreateCenterRequest): Promise<CreateCenterResult> =>
  (await httpsCallable<CreateCenterRequest, CreateCenterResult>(functions, 'createCenter')(req)).data;

export const updateCenter = (id: string, input: CenterInput) => updateDoc(doc(db, 'centers', id), { ...input, updatedAt: serverTimestamp() });

export const setCenterActive = async (centerId: string, active: boolean) => {
  await httpsCallable(functions, 'setCenterActive')({ centerId, active });
};

export const deleteCenter = async (centerId: string) => {
  await httpsCallable(functions, 'deleteCenter')({ centerId });
};

/** A center changes only its own availability. */
export const setOwnCenterStatus = (centerId: string, status: CenterStatus) => updateDoc(doc(db, 'centers', centerId), { status, updatedAt: serverTimestamp() });

/** Stores a push token for this browser; the document id is a hash of the token so the same browser never duplicates. */
export async function registerDevice(centerId: string, token: string, lang: string): Promise<void> {
  const bytes = new TextEncoder().encode(token);
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  await setDoc(doc(db, 'centers', centerId, 'devices', hash), { token, lang, updatedAt: serverTimestamp() });
}

/* ---------- needs and assembly areas (admin) ---------- */

export const addNeed = (n: Omit<Need, 'id'>) => addDoc(collection(db, 'needs'), { ...n, createdAt: serverTimestamp() });
export const deleteNeed = (id: string) => deleteDoc(doc(db, 'needs', id));

export const saveArea = (a: Omit<AssemblyArea, 'id'>, id?: string) =>
  id ? updateDoc(doc(db, 'assemblyAreas', id), { ...a }) : addDoc(collection(db, 'assemblyAreas'), { ...a, createdAt: serverTimestamp() });
export const deleteArea = (id: string) => deleteDoc(doc(db, 'assemblyAreas', id));

/* ---------- staff and vehicles (a center manages its own) ---------- */

export interface StaffInput {
  name: string;
  role: StaffRole;
  phone: string;
  note: string;
  status: StaffStatus;
  workDays: number[];
}
export interface VehicleInput {
  code: string;
  kind: VehicleKind;
  seats: number;
  status: VehicleStatus;
}

export const saveStaff = (centerId: string, input: StaffInput, id?: string) =>
  id
    ? updateDoc(doc(db, 'centers', centerId, 'staff', id), { ...input, updatedAt: serverTimestamp() })
    : addDoc(collection(db, 'centers', centerId, 'staff'), { ...input, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
/** Deleting a person also takes them out of every ready crew they were in, in one write. */
export async function deleteStaff(centerId: string, id: string, crews: Team[]): Promise<void> {
  const batch = writeBatch(db);
  batch.delete(doc(db, 'centers', centerId, 'staff', id));
  for (const c of crews.filter((x) => x.memberIds.includes(id))) {
    batch.update(doc(db, 'centers', centerId, 'crews', c.id), {
      memberIds: c.memberIds.filter((m) => m !== id),
      leaderId: c.leaderId === id ? '' : c.leaderId,
      updatedAt: serverTimestamp(),
    });
  }
  await batch.commit();
}

export const saveVehicle = (centerId: string, input: VehicleInput, id?: string) =>
  id
    ? updateDoc(doc(db, 'centers', centerId, 'vehicles', id), { ...input, updatedAt: serverTimestamp() })
    : addDoc(collection(db, 'centers', centerId, 'vehicles'), { ...input, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
export const deleteVehicle = (centerId: string, id: string) => deleteDoc(doc(db, 'centers', centerId, 'vehicles', id));

/* ---------- ready crews (a center defines its own) ---------- */

export interface TeamInput {
  name: string;
  vehicleId: string;
  memberIds: string[];
  leaderId: string;
  workDays: number[];
  note: string;
}
export const saveTeam = (centerId: string, input: TeamInput, id?: string) =>
  id
    ? updateDoc(doc(db, 'centers', centerId, 'crews', id), { ...input, updatedAt: serverTimestamp() })
    : addDoc(collection(db, 'centers', centerId, 'crews'), { ...input, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
export const deleteTeam = (centerId: string, id: string) => deleteDoc(doc(db, 'centers', centerId, 'crews', id));
