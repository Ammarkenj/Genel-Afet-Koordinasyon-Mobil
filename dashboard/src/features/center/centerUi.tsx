import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { busyIds, fleetCounts, splitTeams, teamCounts, type Busy, type TeamSplit } from '../../domain/crew';
import { centerStats, type CenterStatsView } from '../../domain/centerStats';
import { useCenterData } from '../../data/CenterData';
import { useNow } from '../../hooks/useNow';

const SOUND_KEY = 'yh-sound';

interface CenterUi {
  sound: boolean;
  setSound: (v: boolean) => void;
}
const Ctx = createContext<CenterUi>({ sound: true, setSound: () => undefined });

/** Sound preference for the new-assignment alert, remembered in this browser. */
export function CenterUiProvider({ children }: { children: ReactNode }) {
  const [sound, setSoundState] = useState(() => {
    try {
      return localStorage.getItem(SOUND_KEY) !== '0';
    } catch {
      return true;
    }
  });
  const setSound = useCallback((v: boolean) => {
    setSoundState(v);
    try {
      localStorage.setItem(SOUND_KEY, v ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, []);
  const value = useMemo(() => ({ sound, setSound }), [sound, setSound]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useCenterUi = () => useContext(Ctx);

export interface CenterDerived {
  busy: Busy;
  fleet: ReturnType<typeof fleetCounts>;
  team: ReturnType<typeof teamCounts>;
  stats: CenterStatsView;
  /** Ready crews that can be offered now and those hidden today. */
  teams: TeamSplit;
}

/** Everything the center pages show that is computed from live records (busy crews, counts, response times). */
export function useCenterDerived(): CenterDerived {
  const { assignments, vehicles, staff, teams } = useCenterData();
  const now = useNow(60_000);
  return useMemo(() => {
    const busy = busyIds(assignments);
    return {
      busy,
      fleet: fleetCounts(vehicles, busy),
      team: teamCounts(staff, busy, now),
      stats: centerStats(assignments, now),
      teams: splitTeams(teams, vehicles, staff, busy, now),
    };
  }, [assignments, vehicles, staff, teams, now]);
}
