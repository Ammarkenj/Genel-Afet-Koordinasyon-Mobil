/** Domain types. Field names mirror app/lib/domain/models/models.dart (Report, VolunteerNeed, VolunteerTask, AssemblyArea)
 *  plus the operations fields the dashboard adds (ops, assignments, centers). */

export type IncidentType = 'quake' | 'crash' | 'fall' | 'fire' | 'other';
export type ReportKind = 'help' | 'safe';
export type DeliveryState = 'sent' | 'queued' | 'sending';
export type OpsStatus = 'new' | 'dispatched' | 'resolved';
export type NeedId = 'aid' | 'water' | 'shelter';
export type VolunteerRole = 'aid' | 'rescue' | 'logistics';

export type CenterType = 'fire' | 'rescue' | 'sar' | 'ems';
export type CenterStatus = 'ready' | 'busy' | 'offline';
export type AssignmentStatus = 'notified' | 'accepted' | 'enroute' | 'arrived' | 'done' | 'declined';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Report extends LatLng {
  id: string;
  /** Human-facing report number shown as #1048. */
  no: number;
  kind: ReportKind;
  type: IncidentType | null;
  auto: boolean;
  state: DeliveryState;
  injured: boolean | null;
  trapped: boolean | null;
  people: number;
  ops: OpsStatus;
  district: string;
  createdAtMs: number;
}

export interface Need extends LatLng {
  id: string;
  need: NeedId;
  /** 1 = normal, 2 = urgent, 3 = very urgent. */
  urgency: 1 | 2 | 3;
  district: string;
}

export interface Task {
  id: string;
  need: NeedId;
  state: DeliveryState;
  done: boolean;
  volunteerId: string;
  createdAtMs: number;
}

export interface Volunteer {
  id: string;
  role: VolunteerRole;
  active: boolean;
}

export interface AssemblyArea extends LatLng {
  id: string;
  number: number;
  name: string;
  capacity: number;
  occupied: number;
}

/** Counts kept on the center document by Cloud Functions, so the admin list needs no extra reads. */
export interface CenterStats {
  vehicles: number;
  vehiclesReady: number;
  staff: number;
  /** Ready crews defined by the center (whether they are on duty today depends on the day, so it is computed from the records). */
  crews: number;
}

export interface ServiceCenter extends LatLng {
  id: string;
  name: string;
  type: CenterType;
  status: CenterStatus;
  stats: CenterStats;
  phone: string;
  address: string;
  email: string;
  active: boolean;
}

/** Safe copy of the report that a center is allowed to see: no device id, no other personal data. */
export interface ReportSnapshot extends LatLng {
  no: number;
  type: IncidentType | null;
  kind: ReportKind;
  auto: boolean;
  injured: boolean | null;
  trapped: boolean | null;
  people: number;
  district: string;
}

import type { IsoDay } from './workdays';

export type StaffRole = 'leader' | 'paramedic' | 'doctor' | 'driver' | 'firefighter' | 'rescuer' | 'dispatcher' | 'other';
/** Stored status. "On a mission" is derived from active assignments, never stored, so it cannot drift. */
export type StaffStatus = 'on_duty' | 'off_duty' | 'leave';
export type VehicleKind = 'ambulance' | 'fire_truck' | 'rescue_vehicle' | 'command' | 'support' | 'other';
export type VehicleStatus = 'ready' | 'maintenance';

export interface StaffMember {
  id: string;
  name: string;
  role: StaffRole;
  phone: string;
  note: string;
  status: StaffStatus;
  /** Regular working days, ISO numbering (1 = Monday ... 7 = Sunday). */
  workDays: IsoDay[];
  createdAtMs: number;
}

export interface Vehicle {
  id: string;
  code: string;
  kind: VehicleKind;
  seats: number;
  status: VehicleStatus;
  createdAtMs: number;
}

/** Copy of who went out, written on the assignment so the admin can read it without reading the center's own records. */
export interface Crew {
  vehicles: { id: string; code: string }[];
  staff: { id: string; name: string; role: StaffRole }[];
  /** Names of the ready teams that were sent (empty for a crew put together by hand). */
  teams: string[];
}

/** A ready crew: a vehicle and its people, with the days it is on duty. Defined once by the center, picked with one tap on accepting. */
export interface Team {
  id: string;
  name: string;
  /** Empty when the center has no vehicles registered. */
  vehicleId: string;
  memberIds: string[];
  /** One of memberIds, or empty. */
  leaderId: string;
  workDays: IsoDay[];
  note: string;
  createdAtMs: number;
}

export interface Assignment {
  id: string;
  reportId: string;
  centerId: string;
  status: AssignmentStatus;
  createdAtMs: number;
  updatedAtMs: number;
  /** Set by the center when it opens the assignment (drives the "new" banner). */
  seen: boolean;
  snapshot: ReportSnapshot;
  crew: Crew;
  /** Server times of each step; null until the step happens. They give the response times on the center dashboard. */
  acceptedAtMs: number | null;
  enrouteAtMs: number | null;
  arrivedAtMs: number | null;
  doneAtMs: number | null;
}

export const CENTER_TYPES: CenterType[] = ['ems', 'fire', 'rescue', 'sar'];
export const CENTER_STATUSES: CenterStatus[] = ['ready', 'busy', 'offline'];
/** Order of a normal assignment; "declined" is only reachable from "notified". */
export const ASSIGNMENT_FLOW: AssignmentStatus[] = ['notified', 'accepted', 'enroute', 'arrived', 'done'];
export const STAFF_ROLES: StaffRole[] = ['leader', 'paramedic', 'doctor', 'driver', 'firefighter', 'rescuer', 'dispatcher', 'other'];
export const STAFF_STATUSES: StaffStatus[] = ['on_duty', 'off_duty', 'leave'];
export const VEHICLE_KINDS: VehicleKind[] = ['ambulance', 'fire_truck', 'rescue_vehicle', 'command', 'support', 'other'];
export const VEHICLE_STATUSES: VehicleStatus[] = ['ready', 'maintenance'];
export const MAX_TEAM_MEMBERS = 30;
export const MAX_CREW_TEAMS = 10;
export const MAX_CREW_VEHICLES = 10;
export const MAX_CREW_STAFF = 40;
export const INCIDENT_TYPES: IncidentType[] = ['quake', 'crash', 'fall', 'fire', 'other'];
