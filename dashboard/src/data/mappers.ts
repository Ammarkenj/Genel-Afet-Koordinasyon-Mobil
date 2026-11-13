import type { DocumentData, QueryDocumentSnapshot, DocumentSnapshot } from 'firebase/firestore';
import {
  ASSIGNMENT_FLOW,
  CENTER_STATUSES,
  CENTER_TYPES,
  INCIDENT_TYPES,
  type Assignment,
  type Crew,
  type StaffMember,
  type StaffRole,
  type StaffStatus,
  type Vehicle,
  type VehicleKind,
  type VehicleStatus,
  type CenterStats,
  STAFF_ROLES,
  STAFF_STATUSES,
  VEHICLE_KINDS,
  VEHICLE_STATUSES,
  type AssignmentStatus,
  type AssemblyArea,
  type CenterStatus,
  type CenterType,
  type DeliveryState,
  type IncidentType,
  type Need,
  type NeedId,
  type OpsStatus,
  type Report,
  type ReportSnapshot,
  type ServiceCenter,
  type Task,
  type Team,
  type Volunteer,
  type VolunteerRole,
} from '../domain/types';
import { daysOf } from '../domain/workdays';

type Raw = DocumentData;
type AnyDoc = QueryDocumentSnapshot | DocumentSnapshot;

/** Reads a document, estimating server timestamps that have not round-tripped yet (local writes). */
export const dataOf = (d: AnyDoc): Raw => d.data({ serverTimestamps: 'estimate' }) ?? {};

const ms = (v: unknown): number => {
  if (v && typeof v === 'object' && 'toMillis' in v && typeof (v as { toMillis: unknown }).toMillis === 'function') return (v as { toMillis: () => number }).toMillis();
  return typeof v === 'number' ? v : Date.now();
};
const msOrNull = (v: unknown): number | null => (v && typeof v === 'object' && 'toMillis' in v ? ms(v) : null);
const num = (v: unknown, d = 0): number => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const str = (v: unknown, d = ''): string => (typeof v === 'string' ? v : d);
const bool = (v: unknown, d = false): boolean => (typeof v === 'boolean' ? v : d);
const tri = (v: unknown): boolean | null => (typeof v === 'boolean' ? v : null);
const oneOf = <T extends string>(v: unknown, list: readonly T[], d: T): T => (list.includes(v as T) ? (v as T) : d);

const DELIVERY: DeliveryState[] = ['sent', 'queued', 'sending'];
const OPS: OpsStatus[] = ['new', 'dispatched', 'resolved'];
const NEEDS: NeedId[] = ['aid', 'water', 'shelter'];
const ROLES: VolunteerRole[] = ['aid', 'rescue', 'logistics'];

export function toReport(d: AnyDoc): Report {
  const x = dataOf(d);
  const kind = x.kind === 'safe' ? 'safe' : 'help';
  return {
    id: d.id,
    no: num(x.no),
    kind,
    type: kind === 'safe' ? null : oneOf<IncidentType>(x.type, INCIDENT_TYPES, 'other'),
    auto: bool(x.auto),
    state: oneOf(x.state, DELIVERY, 'sent'),
    injured: tri(x.injured),
    trapped: tri(x.trapped),
    people: Math.max(1, num(x.people, 1)),
    ops: oneOf(x.ops, OPS, 'new'),
    district: str(x.district),
    lat: num(x.lat),
    lng: num(x.lng),
    createdAtMs: ms(x.createdAt),
  };
}

export function toNeed(d: AnyDoc): Need {
  const x = dataOf(d);
  const u = num(x.urgency, 1);
  return { id: d.id, need: oneOf(x.need, NEEDS, 'aid'), urgency: u >= 3 ? 3 : u >= 2 ? 2 : 1, district: str(x.district), lat: num(x.lat), lng: num(x.lng) };
}

export function toTask(d: AnyDoc): Task {
  const x = dataOf(d);
  return { id: d.id, need: oneOf(x.need, NEEDS, 'aid'), state: oneOf(x.state, DELIVERY, 'sent'), done: bool(x.done), volunteerId: str(x.volunteerId), createdAtMs: ms(x.createdAt) };
}

export function toVolunteer(d: AnyDoc): Volunteer {
  const x = dataOf(d);
  return { id: d.id, role: oneOf(x.role, ROLES, 'aid'), active: bool(x.active, true) };
}

export function toArea(d: AnyDoc): AssemblyArea {
  const x = dataOf(d);
  return { id: d.id, number: num(x.number), name: str(x.name), capacity: Math.max(1, num(x.capacity, 1)), occupied: num(x.occupied), lat: num(x.lat), lng: num(x.lng) };
}

function toStats(v: unknown): CenterStats {
  const x = (v && typeof v === 'object' ? v : {}) as Raw;
  return { vehicles: Math.max(0, num(x.vehicles)), vehiclesReady: Math.max(0, num(x.vehiclesReady)), staff: Math.max(0, num(x.staff)), crews: Math.max(0, num(x.crews)) };
}

export function toCenter(d: AnyDoc): ServiceCenter {
  const x = dataOf(d);
  return {
    id: d.id,
    name: str(x.name),
    type: oneOf<CenterType>(x.type, CENTER_TYPES, 'ems'),
    status: oneOf<CenterStatus>(x.status, CENTER_STATUSES, 'ready'),
    stats: toStats(x.stats),
    phone: str(x.phone),
    address: str(x.address),
    email: str(x.email),
    active: bool(x.active, true),
    lat: num(x.lat),
    lng: num(x.lng),
  };
}

function toSnapshot(v: unknown): ReportSnapshot {
  const x = (v && typeof v === 'object' ? v : {}) as Raw;
  const kind = x.kind === 'safe' ? 'safe' : 'help';
  return {
    no: num(x.no),
    kind,
    type: kind === 'safe' ? null : oneOf<IncidentType>(x.type, INCIDENT_TYPES, 'other'),
    auto: bool(x.auto),
    injured: tri(x.injured),
    trapped: tri(x.trapped),
    people: Math.max(1, num(x.people, 1)),
    district: str(x.district),
    lat: num(x.lat),
    lng: num(x.lng),
  };
}

function toCrew(v: unknown): Crew {
  const x = (v && typeof v === 'object' ? v : {}) as Raw;
  const list = (a: unknown): Raw[] => (Array.isArray(a) ? (a.filter((i) => i && typeof i === 'object') as Raw[]) : []);
  return {
    vehicles: list(x.vehicles).map((i) => ({ id: str(i.id), code: str(i.code) })),
    staff: list(x.staff).map((i) => ({ id: str(i.id), name: str(i.name), role: oneOf<StaffRole>(i.role, STAFF_ROLES, 'other') })),
    teams: Array.isArray(x.teams) ? x.teams.filter((n): n is string => typeof n === 'string') : [],
  };
}

export function toTeam(d: AnyDoc): Team {
  const x = dataOf(d);
  const ids = (a: unknown): string[] => (Array.isArray(a) ? a.filter((n): n is string => typeof n === 'string') : []);
  return {
    id: d.id,
    name: str(x.name),
    vehicleId: str(x.vehicleId),
    memberIds: ids(x.memberIds),
    leaderId: str(x.leaderId),
    workDays: daysOf(x.workDays),
    note: str(x.note),
    createdAtMs: ms(x.createdAt),
  };
}

export function toStaff(d: AnyDoc): StaffMember {
  const x = dataOf(d);
  return {
    id: d.id,
    name: str(x.name),
    role: oneOf<StaffRole>(x.role, STAFF_ROLES, 'other'),
    phone: str(x.phone),
    note: str(x.note),
    status: oneOf<StaffStatus>(x.status, STAFF_STATUSES, 'on_duty'),
    workDays: daysOf(x.workDays),
    createdAtMs: ms(x.createdAt),
  };
}

export function toVehicle(d: AnyDoc): Vehicle {
  const x = dataOf(d);
  return {
    id: d.id,
    code: str(x.code),
    kind: oneOf<VehicleKind>(x.kind, VEHICLE_KINDS, 'other'),
    seats: Math.max(1, num(x.seats, 1)),
    status: oneOf<VehicleStatus>(x.status, VEHICLE_STATUSES, 'ready'),
    createdAtMs: ms(x.createdAt),
  };
}

export function toAssignment(d: AnyDoc): Assignment {
  const x = dataOf(d);
  return {
    id: d.id,
    reportId: str(x.reportId),
    centerId: str(x.centerId),
    status: oneOf<AssignmentStatus>(x.status, [...ASSIGNMENT_FLOW, 'declined'], 'notified'),
    createdAtMs: ms(x.createdAt),
    updatedAtMs: ms(x.updatedAt),
    seen: bool(x.seen),
    snapshot: toSnapshot(x.snapshot),
    crew: toCrew(x.crew),
    acceptedAtMs: msOrNull(x.acceptedAt),
    enrouteAtMs: msOrNull(x.enrouteAt),
    arrivedAtMs: msOrNull(x.arrivedAt),
    doneAtMs: msOrNull(x.doneAt),
  };
}
