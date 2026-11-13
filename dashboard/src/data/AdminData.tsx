import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { collection, limit, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase/app';
import type { AssemblyArea, Assignment, Need, Report, ServiceCenter, Task, Volunteer } from '../domain/types';
import { toArea, toAssignment, toCenter, toNeed, toReport, toTask, toVolunteer } from './mappers';
import { useDocs } from './useDocs';

interface Frozen {
  reports: Report[];
  centers: ServiceCenter[];
  assignments: Assignment[];
}

export interface AdminDataValue extends Frozen {
  needs: Need[];
  tasks: Task[];
  volunteers: Volunteer[];
  areas: AssemblyArea[];
  loading: boolean;
  error: Error | null;
  retry: () => void;
  /** While false, reports/centers/assignments stay as they were when the operator paused the feed. */
  live: boolean;
  setLive: (live: boolean) => void;
}

const Ctx = createContext<AdminDataValue | null>(null);

/** One subscription per collection for the whole admin area, shared by every page. */
export function AdminDataProvider({ children }: { children: ReactNode }) {
  const [nonce, setNonce] = useState(0);
  const [live, setLiveState] = useState(true);
  const [frozen, setFrozen] = useState<Frozen | null>(null);

  const reports = useDocs('reports', () => query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(500)), toReport, nonce);
  const centers = useDocs('centers', () => query(collection(db, 'centers'), orderBy('name')), toCenter, nonce);
  const assignments = useDocs('assignments', () => query(collection(db, 'assignments'), orderBy('createdAt', 'desc'), limit(1000)), toAssignment, nonce);
  const needs = useDocs('needs', () => collection(db, 'needs'), toNeed, nonce);
  const tasks = useDocs('tasks', () => query(collection(db, 'tasks'), orderBy('createdAt', 'desc'), limit(300)), toTask, nonce);
  const volunteers = useDocs('volunteers', () => collection(db, 'volunteers'), toVolunteer, nonce);
  const areas = useDocs('assemblyAreas', () => query(collection(db, 'assemblyAreas'), orderBy('number')), toArea, nonce);

  const setLive = useCallback(
    (next: boolean) => {
      setFrozen(next ? null : { reports: reports.data, centers: centers.data, assignments: assignments.data });
      setLiveState(next);
    },
    [reports.data, centers.data, assignments.data],
  );
  const retry = useCallback(() => setNonce((n) => n + 1), []);

  const parts = [reports, centers, assignments, needs, tasks, volunteers, areas];
  const value = useMemo<AdminDataValue>(
    () => ({
      reports: frozen?.reports ?? reports.data,
      centers: frozen?.centers ?? centers.data,
      assignments: frozen?.assignments ?? assignments.data,
      needs: needs.data,
      tasks: tasks.data,
      volunteers: volunteers.data,
      areas: areas.data,
      loading: parts.some((p) => p.loading),
      error: parts.find((p) => p.error)?.error ?? null,
      retry,
      live,
      setLive,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [frozen, reports, centers, assignments, needs, tasks, volunteers, areas, live, setLive, retry],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAdminData(): AdminDataValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAdminData must be used inside <AdminDataProvider>');
  return v;
}
