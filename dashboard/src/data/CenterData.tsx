import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { collection, doc, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db } from '../firebase/app';
import type { Assignment, ServiceCenter, StaffMember, Team, Vehicle } from '../domain/types';
import { toAssignment, toCenter } from './mappers';
import { useDocs, useDocument } from './useDocs';
import { useCenterRecords } from './useCenterRecords';

export interface CenterDataValue {
  centerId: string;
  /** null when the document does not exist (account without a center). */
  center: ServiceCenter | null;
  assignments: Assignment[];
  staff: StaffMember[];
  vehicles: Vehicle[];
  teams: Team[];
  loading: boolean;
  error: Error | null;
  retry: () => void;
}

const Ctx = createContext<CenterDataValue | null>(null);

/** Everything a center is allowed to read: its own document and its own assignments, nothing else. */
export function CenterDataProvider({ centerId, children }: { centerId: string; children: ReactNode }) {
  const [nonce, setNonce] = useState(0);
  const centerDoc = useDocument(
    `center:${centerId}`,
    (ok, err) => onSnapshot(doc(db, 'centers', centerId), ok, err),
    toCenter,
    nonce,
  );
  const assignments = useDocs(
    `assignments:${centerId}`,
    () => query(collection(db, 'assignments'), where('centerId', '==', centerId), orderBy('createdAt', 'desc'), limit(200)),
    toAssignment,
    nonce,
  );
  const records = useCenterRecords(centerId, nonce);
  const retry = useCallback(() => setNonce((n) => n + 1), []);
  const value = useMemo<CenterDataValue>(
    () => ({
      centerId,
      center: centerDoc.data,
      assignments: assignments.data,
      staff: records.staff.data,
      vehicles: records.vehicles.data,
      teams: records.teams.data,
      loading: centerDoc.loading || assignments.loading || records.staff.loading || records.vehicles.loading || records.teams.loading,
      error: centerDoc.error ?? assignments.error ?? records.staff.error ?? records.vehicles.error ?? records.teams.error,
      retry,
    }),
    [centerId, centerDoc.data, centerDoc.loading, centerDoc.error, assignments.data, assignments.loading, assignments.error, records.staff, records.vehicles, records.teams, retry],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCenterData(): CenterDataValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useCenterData must be used inside <CenterDataProvider>');
  return v;
}
