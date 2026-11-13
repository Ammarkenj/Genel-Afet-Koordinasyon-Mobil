import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut as fbSignOut, type User } from 'firebase/auth';
import { auth } from './app';

export type Role = 'admin' | 'center';

export interface AuthState {
  status: 'loading' | 'out' | 'in';
  user: User | null;
  role: Role | null;
  centerId: string | null;
}

interface AuthApi extends AuthState {
  /** Resolves to an i18n key when sign-in failed, or null on success. With `portal`, only that role may sign in there. */
  signIn: (email: string, password: string, portal?: Role) => Promise<string | null>;
  signOut: () => Promise<void>;
  /** Re-reads the custom claims (after the server changed them). */
  refreshClaims: () => Promise<void>;
}

const OUT: AuthState = { status: 'out', user: null, role: null, centerId: null };
const Ctx = createContext<AuthApi | null>(null);

async function readClaims(user: User, force = false): Promise<AuthState> {
  const res = await user.getIdTokenResult(force);
  const role = res.claims.role === 'admin' || res.claims.role === 'center' ? res.claims.role : null;
  const centerId = typeof res.claims.centerId === 'string' ? res.claims.centerId : null;
  return { status: 'in', user, role, centerId };
}

export const authErrorKey = (code: string): string => {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-email':
      return 'auth.invalid';
    case 'auth/user-disabled':
      return 'auth.disabled';
    case 'auth/too-many-requests':
      return 'auth.tooMany';
    default:
      return 'auth.generic';
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ ...OUT, status: 'loading' });
  // While a portal sign-in is being checked, ignore auth events so a wrong-role account is never shown as signed in.
  const checking = useRef(false);

  useEffect(
    () =>
      onAuthStateChanged(auth, (user) => {
        if (checking.current) return;
        if (!user) {
          setState(OUT);
          return;
        }
        readClaims(user).then(setState, () => setState(OUT));
      }),
    [],
  );

  const signIn = useCallback(async (email: string, password: string, portal?: Role) => {
    checking.current = true;
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const next = await readClaims(cred.user, true);
      if (!next.role) {
        await fbSignOut(auth);
        return 'auth.noRole';
      }
      if (portal && next.role !== portal) {
        await fbSignOut(auth);
        return portal === 'admin' ? 'auth.wrongAdmin' : 'auth.wrongCenter';
      }
      setState(next);
      return null;
    } catch (e) {
      return authErrorKey((e as { code?: string }).code ?? '');
    } finally {
      checking.current = false;
    }
  }, []);

  const signOut = useCallback(async () => {
    await fbSignOut(auth);
  }, []);

  const refreshClaims = useCallback(async () => {
    if (auth.currentUser) setState(await readClaims(auth.currentUser, true));
  }, []);

  const value = useMemo<AuthApi>(() => ({ ...state, signIn, signOut, refreshClaims }), [state, signIn, signOut, refreshClaims]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthApi {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be used inside <AuthProvider>');
  return v;
}
