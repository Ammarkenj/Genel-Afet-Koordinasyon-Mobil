import type { Assignment, AssignmentStatus, Crew, ServiceCenter, StaffMember, Team, Vehicle } from './types';
import { worksToday } from './workdays';

/** An assignment holds its crew from "accepted" until it is done or declined. Only then are people and vehicles "on a mission". */
export const MISSION_STATUSES: AssignmentStatus[] = ['accepted', 'enroute', 'arrived'];
/** Statuses where the center may still correct the crew (not after arriving). */
export const CREW_EDITABLE_STATUSES: AssignmentStatus[] = ['notified', 'accepted', 'enroute'];

export const isOnMission = (a: Pick<Assignment, 'status'>) => MISSION_STATUSES.includes(a.status);

export interface Busy {
  vehicles: Set<string>;
  staff: Set<string>;
}

/** Vehicles and staff currently out on an assignment. Optionally ignore one assignment (its own crew is being edited). */
export function busyIds(assignments: Pick<Assignment, 'id' | 'status' | 'crew'>[], ignoreAssignmentId?: string): Busy {
  const busy: Busy = { vehicles: new Set(), staff: new Set() };
  for (const a of assignments) {
    if (a.id === ignoreAssignmentId || !isOnMission(a)) continue;
    a.crew.vehicles.forEach((v) => busy.vehicles.add(v.id));
    a.crew.staff.forEach((s) => busy.staff.add(s.id));
  }
  return busy;
}

export type DerivedVehicleStatus = 'ready' | 'on_mission' | 'maintenance';
/** `not_today`: on duty on paper, but today is not one of their working days. Only `on_duty` can be sent out. */
export type DerivedStaffStatus = 'on_duty' | 'on_mission' | 'not_today' | 'off_duty' | 'leave';

/** Maintenance wins over a mission: a vehicle in the workshop is not "out". */
export const vehicleState = (v: Vehicle, busy: Busy): DerivedVehicleStatus =>
  v.status === 'maintenance' ? 'maintenance' : busy.vehicles.has(v.id) ? 'on_mission' : 'ready';

/** Leave and off duty win over everything; someone already out stays "on a mission"; otherwise today's schedule decides. */
export function staffState(s: StaffMember, busy: Busy, now: number): DerivedStaffStatus {
  if (s.status !== 'on_duty') return s.status;
  if (busy.staff.has(s.id)) return 'on_mission';
  return worksToday(s.workDays, now) ? 'on_duty' : 'not_today';
}

export interface FleetCounts {
  total: number;
  ready: number;
  onMission: number;
  maintenance: number;
}
export function fleetCounts(vehicles: Vehicle[], busy: Busy): FleetCounts {
  const c: FleetCounts = { total: vehicles.length, ready: 0, onMission: 0, maintenance: 0 };
  for (const v of vehicles) {
    const s = vehicleState(v, busy);
    if (s === 'ready') c.ready++;
    else if (s === 'on_mission') c.onMission++;
    else c.maintenance++;
  }
  return c;
}

export interface TeamCounts {
  total: number;
  /** Available now: on duty, working today, not out. */
  onDuty: number;
  onMission: number;
  notToday: number;
  offDuty: number;
  leave: number;
}
export function teamCounts(staff: StaffMember[], busy: Busy, now: number): TeamCounts {
  const c: TeamCounts = { total: staff.length, onDuty: 0, onMission: 0, notToday: 0, offDuty: 0, leave: 0 };
  for (const m of staff) {
    const s = staffState(m, busy, now);
    if (s === 'on_duty') c.onDuty++;
    else if (s === 'on_mission') c.onMission++;
    else if (s === 'not_today') c.notToday++;
    else if (s === 'off_duty') c.offDuty++;
    else c.leave++;
  }
  return c;
}

/** Vehicles of this center that can still go out: ready (not in maintenance) minus those on a mission now. */
export function freeVehicleCount(center: Pick<ServiceCenter, 'id' | 'stats'>, assignments: Pick<Assignment, 'id' | 'centerId' | 'status' | 'crew'>[]): number {
  const busy = busyIds(assignments.filter((a) => a.centerId === center.id));
  return Math.max(0, center.stats.vehiclesReady - busy.vehicles.size);
}

/** Crew rules when accepting by hand: if the center has vehicles registered, at least one must go. */
export function crewProblem(vehicleCount: number, chosenVehicles: number): 'vehicle_required' | null {
  return vehicleCount > 0 && chosenVehicles === 0 ? 'vehicle_required' : null;
}

/* ---------- ready teams ---------- */

/** Why a team is not offered when accepting an assignment. */
export type TeamHidden = 'not_today' | 'no_vehicle' | 'vehicle_maintenance' | 'vehicle_busy' | 'no_member';

export interface TeamMemberView {
  member: StaffMember;
  state: DerivedStaffStatus;
  available: boolean;
  isLeader: boolean;
}

export interface TeamReadiness {
  team: Team;
  /** Null when the team has no vehicle by design (a center with no vehicles registered). */
  vehicle: Vehicle | null;
  /** Members that still exist, leader first. */
  members: TeamMemberView[];
  /** Offered when accepting: working today, vehicle ready and free, at least one member available. */
  ready: boolean;
  hidden: TeamHidden | null;
  /** Ready but some members cannot go: they are left out and listed with the reason. */
  partial: boolean;
}

/** Decides whether a team can be offered now. A team is hidden when it is not on duty today, its vehicle cannot go,
 *  or nobody in it is available; when only some members are missing it stays, minus those members. */
export function teamReadiness(team: Team, vehicles: Vehicle[], staff: StaffMember[], busy: Busy, now: number): TeamReadiness {
  const byId = new Map(staff.map((m) => [m.id, m]));
  const members = team.memberIds
    .map((id) => byId.get(id))
    .filter((m): m is StaffMember => !!m)
    .map<TeamMemberView>((member) => {
      const state = staffState(member, busy, now);
      return { member, state, available: state === 'on_duty', isLeader: member.id === team.leaderId };
    })
    .sort((a, b) => Number(b.isLeader) - Number(a.isLeader));

  const vehicle = team.vehicleId ? vehicles.find((v) => v.id === team.vehicleId) ?? null : null;
  let hidden: TeamHidden | null = null;
  if (!worksToday(team.workDays, now)) hidden = 'not_today';
  else if (team.vehicleId && !vehicle) hidden = 'no_vehicle';
  else if (vehicle && vehicleState(vehicle, busy) === 'maintenance') hidden = 'vehicle_maintenance';
  else if (vehicle && vehicleState(vehicle, busy) === 'on_mission') hidden = 'vehicle_busy';
  else if (!members.some((m) => m.available)) hidden = 'no_member';

  const ready = hidden === null;
  return { team, vehicle, members, ready, hidden, partial: ready && members.some((m) => !m.available) };
}

export interface TeamSplit {
  ready: TeamReadiness[];
  hidden: TeamReadiness[];
}
export function splitTeams(teams: Team[], vehicles: Vehicle[], staff: StaffMember[], busy: Busy, now: number): TeamSplit {
  const all = teams.map((t) => teamReadiness(t, vehicles, staff, busy, now));
  return { ready: all.filter((r) => r.ready), hidden: all.filter((r) => !r.ready) };
}

/** What the team shows on the teams page today. */
export type TeamStatus = 'ready' | 'partial' | 'not_today' | 'on_mission' | 'vehicle_unavailable' | 'no_member';
export function teamStatus(r: TeamReadiness): TeamStatus {
  switch (r.hidden) {
    case 'not_today': return 'not_today';
    case 'vehicle_busy': return 'on_mission';
    case 'no_vehicle':
    case 'vehicle_maintenance': return 'vehicle_unavailable';
    case 'no_member': return 'no_member';
    default: return r.partial ? 'partial' : 'ready';
  }
}

/** The crew to write on an assignment when one or more ready teams are chosen: their vehicles and available members,
 *  without duplicates, and the team names. */
export function crewFromTeams(selected: TeamReadiness[]): Crew {
  const vehicles = new Map<string, { id: string; code: string }>();
  const staff = new Map<string, { id: string; name: string; role: StaffMember['role'] }>();
  const teams: string[] = [];
  for (const r of selected) {
    if (!r.ready) continue;
    if (r.vehicle) vehicles.set(r.vehicle.id, { id: r.vehicle.id, code: r.vehicle.code });
    for (const m of r.members) if (m.available) staff.set(m.member.id, { id: m.member.id, name: m.member.name, role: m.member.role });
    teams.push(r.team.name);
  }
  return { vehicles: [...vehicles.values()], staff: [...staff.values()], teams };
}
