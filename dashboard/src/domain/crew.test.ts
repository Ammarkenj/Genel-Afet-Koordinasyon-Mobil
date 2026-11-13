import { describe, expect, it } from 'vitest';
import { busyIds, crewFromTeams, crewProblem, fleetCounts, freeVehicleCount, isOnMission, splitTeams, staffState, teamCounts, teamReadiness, teamStatus, vehicleState } from './crew';
import type { Assignment, AssignmentStatus, Crew, StaffMember, Team, Vehicle } from './types';
import { ALL_DAYS, isoDay, type IsoDay } from './workdays';

const NOW = new Date(2026, 10, 4, 12, 0, 0).getTime(); // a fixed day, local time
const TODAY = isoDay(NOW);
const NOT_TODAY: IsoDay[] = ALL_DAYS.filter((d) => d !== TODAY);

const crew = (vehicles: string[], staff: string[], teams: string[] = []): Crew => ({
  vehicles: vehicles.map((id) => ({ id, code: id.toUpperCase() })),
  staff: staff.map((id) => ({ id, name: id, role: 'driver' as const })),
  teams,
});
const asg = (id: string, status: AssignmentStatus, c: Crew, centerId = 'c1'): Pick<Assignment, 'id' | 'centerId' | 'status' | 'crew'> => ({ id, centerId, status, crew: c });
const veh = (id: string, status: Vehicle['status'] = 'ready'): Vehicle => ({ id, code: id, kind: 'ambulance', seats: 4, status, createdAtMs: 0 });
const mem = (id: string, status: StaffMember['status'] = 'on_duty', workDays: IsoDay[] = ALL_DAYS): StaffMember => ({ id, name: id, role: 'paramedic', phone: '', note: '', status, workDays, createdAtMs: 0 });
const team = (over: Partial<Team> = {}): Team => ({ id: 't1', name: 'Alfa', vehicleId: 'v1', memberIds: ['s1', 's2'], leaderId: '', workDays: ALL_DAYS, note: '', createdAtMs: 0, ...over });
const none = busyIds([]);

describe('busyIds', () => {
  it('counts only accepted, enroute and arrived assignments', () => {
    const list = [
      asg('a1', 'accepted', crew(['v1'], ['s1'])),
      asg('a2', 'enroute', crew(['v2'], ['s2'])),
      asg('a3', 'arrived', crew(['v3'], [])),
      asg('a4', 'done', crew(['v4'], ['s4'])),
      asg('a5', 'declined', crew(['v5'], [])),
      asg('a6', 'notified', crew([], [])),
    ];
    const b = busyIds(list);
    expect([...b.vehicles].sort()).toEqual(['v1', 'v2', 'v3']);
    expect([...b.staff].sort()).toEqual(['s1', 's2']);
  });
  it('frees the crew as soon as the assignment is done or declined', () => {
    expect(busyIds([asg('a', 'arrived', crew(['v1'], ['s1']))]).vehicles.has('v1')).toBe(true);
    expect(busyIds([asg('a', 'done', crew(['v1'], ['s1']))]).vehicles.has('v1')).toBe(false);
  });
  it('can ignore one assignment (editing its own crew)', () => {
    const b = busyIds([asg('a', 'accepted', crew(['v1'], ['s1'])), asg('b', 'accepted', crew(['v2'], []))], 'a');
    expect([...b.vehicles]).toEqual(['v2']);
    expect(b.staff.size).toBe(0);
  });
  it('knows which statuses are missions', () => {
    expect(isOnMission({ status: 'enroute' })).toBe(true);
    expect(isOnMission({ status: 'notified' })).toBe(false);
  });
});

describe('derived states', () => {
  const busy = busyIds([asg('a', 'enroute', crew(['v1', 'v3'], ['s1', 's3']))]);
  it('vehicles: maintenance wins over a mission, a mission wins over ready', () => {
    expect(vehicleState(veh('v1'), busy)).toBe('on_mission');
    expect(vehicleState(veh('v2'), busy)).toBe('ready');
    expect(vehicleState(veh('v3', 'maintenance'), busy)).toBe('maintenance');
  });
  it('staff: leave and off duty win over a mission, a mission wins over the schedule', () => {
    expect(staffState(mem('s1'), busy, NOW)).toBe('on_mission');
    expect(staffState(mem('s2'), busy, NOW)).toBe('on_duty');
    expect(staffState(mem('s3', 'leave'), busy, NOW)).toBe('leave');
    expect(staffState(mem('s4', 'off_duty'), busy, NOW)).toBe('off_duty');
    expect(staffState(mem('s1', 'on_duty', NOT_TODAY), busy, NOW)).toBe('on_mission');
  });
  it('staff: someone on duty on paper but not scheduled today is "not today"', () => {
    expect(staffState(mem('s5', 'on_duty', NOT_TODAY), none, NOW)).toBe('not_today');
    expect(staffState(mem('s5', 'on_duty', [TODAY]), none, NOW)).toBe('on_duty');
    expect(staffState(mem('s5', 'leave', NOT_TODAY), none, NOW)).toBe('leave');
  });
  it('counts the fleet and the team', () => {
    expect(fleetCounts([veh('v1'), veh('v2'), veh('v3', 'maintenance')], busy)).toEqual({ total: 3, ready: 1, onMission: 1, maintenance: 1 });
    const people = [mem('s1'), mem('s2'), mem('s3', 'leave'), mem('s4', 'off_duty'), mem('s5', 'on_duty', NOT_TODAY)];
    expect(teamCounts(people, busy, NOW)).toEqual({ total: 5, onDuty: 1, onMission: 1, notToday: 1, offDuty: 1, leave: 1 });
  });
});

describe('freeVehicleCount', () => {
  const center = { id: 'c1', stats: { vehicles: 4, vehiclesReady: 3, staff: 0, crews: 0 } };
  it('is ready vehicles minus those out', () => {
    expect(freeVehicleCount(center, [])).toBe(3);
    expect(freeVehicleCount(center, [asg('a', 'accepted', crew(['v1', 'v2'], []))])).toBe(1);
  });
  it('ignores other centers and finished jobs, and never goes below zero', () => {
    expect(freeVehicleCount(center, [asg('a', 'accepted', crew(['v1'], []), 'c2'), asg('b', 'done', crew(['v2'], []))])).toBe(3);
    expect(freeVehicleCount(center, [asg('a', 'accepted', crew(['v1', 'v2', 'v3', 'v4'], []))])).toBe(0);
  });
});

describe('crewProblem', () => {
  it('requires a vehicle only when the center has some', () => {
    expect(crewProblem(3, 0)).toBe('vehicle_required');
    expect(crewProblem(3, 1)).toBeNull();
    expect(crewProblem(0, 0)).toBeNull();
  });
});

describe('teamReadiness: a ready crew is offered or hidden', () => {
  const vehicles = [veh('v1'), veh('v2', 'maintenance')];
  const staff = [mem('s1'), mem('s2')];

  it('is ready when it works today, the vehicle is free and everyone can go', () => {
    const r = teamReadiness(team(), vehicles, staff, none, NOW);
    expect(r.ready).toBe(true);
    expect(r.hidden).toBeNull();
    expect(r.partial).toBe(false);
    expect(teamStatus(r)).toBe('ready');
  });
  it('is hidden on a day it is not scheduled', () => {
    const r = teamReadiness(team({ workDays: NOT_TODAY }), vehicles, staff, none, NOW);
    expect(r.ready).toBe(false);
    expect(r.hidden).toBe('not_today');
    expect(teamStatus(r)).toBe('not_today');
  });
  it('is offered on the day it is scheduled even if it is not scheduled on other days', () => {
    expect(teamReadiness(team({ workDays: [TODAY] }), vehicles, staff, none, NOW).ready).toBe(true);
  });
  it('is hidden when its vehicle is in maintenance, out on a job, or deleted', () => {
    expect(teamReadiness(team({ vehicleId: 'v2' }), vehicles, staff, none, NOW).hidden).toBe('vehicle_maintenance');
    const out = busyIds([asg('a', 'accepted', crew(['v1'], []))]);
    const busyVehicle = teamReadiness(team(), vehicles, staff, out, NOW);
    expect(busyVehicle.hidden).toBe('vehicle_busy');
    expect(teamStatus(busyVehicle)).toBe('on_mission');
    const gone = teamReadiness(team({ vehicleId: 'v9' }), vehicles, staff, none, NOW);
    expect(gone.hidden).toBe('no_vehicle');
    expect(teamStatus(gone)).toBe('vehicle_unavailable');
  });
  it('needs no vehicle when the crew was defined without one', () => {
    const r = teamReadiness(team({ vehicleId: '' }), [], staff, none, NOW);
    expect(r.ready).toBe(true);
    expect(r.vehicle).toBeNull();
  });
  it('stays with a warning when only some members are missing, and lists who and why', () => {
    const people = [mem('s1'), mem('s2', 'leave'), mem('s3', 'on_duty', NOT_TODAY)];
    const out = busyIds([asg('a', 'enroute', crew([], ['s4']))]);
    const r = teamReadiness(team({ memberIds: ['s1', 's2', 's3', 's4'] }), vehicles, [...people, mem('s4')], out, NOW);
    expect(r.ready).toBe(true);
    expect(r.partial).toBe(true);
    expect(teamStatus(r)).toBe('partial');
    expect(r.members.filter((m) => m.available).map((m) => m.member.id)).toEqual(['s1']);
    expect(Object.fromEntries(r.members.filter((m) => !m.available).map((m) => [m.member.id, m.state]))).toEqual({ s2: 'leave', s3: 'not_today', s4: 'on_mission' });
  });
  it('is hidden when nobody in it can go', () => {
    const people = [mem('s1', 'leave'), mem('s2', 'off_duty')];
    const r = teamReadiness(team(), vehicles, people, none, NOW);
    expect(r.hidden).toBe('no_member');
    expect(teamStatus(r)).toBe('no_member');
  });
  it('ignores members who no longer exist, and puts the leader first', () => {
    const r = teamReadiness(team({ memberIds: ['s1', 'gone', 's2'], leaderId: 's2' }), vehicles, staff, none, NOW);
    expect(r.members.map((m) => m.member.id)).toEqual(['s2', 's1']);
    expect(r.members[0]?.isLeader).toBe(true);
    expect(teamReadiness(team({ memberIds: ['gone'] }), vehicles, staff, none, NOW).hidden).toBe('no_member');
  });
});

describe('splitTeams', () => {
  it('separates what is offered from what is hidden today', () => {
    const teams = [team({ id: 'a', name: 'Alfa' }), team({ id: 'b', name: 'Bravo', workDays: NOT_TODAY }), team({ id: 'c', name: 'Charlie', vehicleId: 'v2' })];
    const s = splitTeams(teams, [veh('v1'), veh('v2', 'maintenance')], [mem('s1'), mem('s2')], none, NOW);
    expect(s.ready.map((r) => r.team.name)).toEqual(['Alfa']);
    expect(s.hidden.map((r) => r.team.name)).toEqual(['Bravo', 'Charlie']);
  });
});

describe('crewFromTeams', () => {
  const vehicles = [veh('v1'), veh('v2')];
  const staff = [mem('s1'), mem('s2'), mem('s3', 'leave')];
  it('takes the vehicle and only the available members, plus the crew name', () => {
    const r = teamReadiness(team({ memberIds: ['s1', 's3'] }), vehicles, staff, none, NOW);
    expect(crewFromTeams([r])).toEqual({ vehicles: [{ id: 'v1', code: 'v1' }], staff: [{ id: 's1', name: 's1', role: 'paramedic' }], teams: ['Alfa'] });
  });
  it('merges several crews without repeating a vehicle or a person', () => {
    const a = teamReadiness(team({ id: 'a', name: 'Alfa', memberIds: ['s1', 's2'] }), vehicles, staff, none, NOW);
    const b = teamReadiness(team({ id: 'b', name: 'Bravo', vehicleId: 'v2', memberIds: ['s2'] }), vehicles, staff, none, NOW);
    const c = crewFromTeams([a, b]);
    expect(c.vehicles.map((v) => v.id)).toEqual(['v1', 'v2']);
    expect(c.staff.map((s) => s.id)).toEqual(['s1', 's2']);
    expect(c.teams).toEqual(['Alfa', 'Bravo']);
  });
  it('never includes a crew that is not ready', () => {
    const hidden = teamReadiness(team({ workDays: NOT_TODAY }), vehicles, staff, none, NOW);
    expect(crewFromTeams([hidden])).toEqual({ vehicles: [], staff: [], teams: [] });
  });
});
