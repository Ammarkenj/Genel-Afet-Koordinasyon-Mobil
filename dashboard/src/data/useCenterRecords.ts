import { collection, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase/app';
import type { StaffMember, Team, Vehicle } from '../domain/types';
import { toStaff, toTeam, toVehicle } from './mappers';
import { useDocs, type DocsState } from './useDocs';

/** Live staff, vehicles and ready crews of one center (its own panel, or an admin looking at it). */
export function useCenterRecords(centerId: string, nonce = 0): { staff: DocsState<StaffMember>; vehicles: DocsState<Vehicle>; teams: DocsState<Team> } {
  const staff = useDocs(`staff:${centerId}`, () => query(collection(db, 'centers', centerId, 'staff'), orderBy('name')), toStaff, nonce);
  const vehicles = useDocs(`vehicles:${centerId}`, () => query(collection(db, 'centers', centerId, 'vehicles'), orderBy('code')), toVehicle, nonce);
  const teams = useDocs(`crews:${centerId}`, () => query(collection(db, 'centers', centerId, 'crews'), orderBy('name')), toTeam, nonce);
  return { staff, vehicles, teams };
}
