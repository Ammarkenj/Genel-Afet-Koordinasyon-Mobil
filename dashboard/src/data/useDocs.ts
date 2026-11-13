import { useEffect, useState } from 'react';
import { onSnapshot, type DocumentSnapshot, type Query, type QueryDocumentSnapshot } from 'firebase/firestore';

export interface DocsState<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
}

const INITIAL: DocsState<never> = { data: [], loading: true, error: null };

/** Live query. `factory` builds the query; it only re-runs when `key` changes, so pass every input that shapes the query in `key`.
 *  `nonce` lets the caller force a resubscribe (retry). */
export function useDocs<T>(key: string, factory: () => Query | null, map: (d: QueryDocumentSnapshot) => T, nonce = 0): DocsState<T> {
  const [state, setState] = useState<{ key: string; value: DocsState<T> }>({ key, value: INITIAL as DocsState<T> });

  useEffect(() => {
    const q = factory();
    if (!q) return;
    return onSnapshot(
      q,
      (snap) => setState({ key, value: { data: snap.docs.map(map), loading: false, error: null } }),
      (error) => setState({ key, value: { data: [], loading: false, error } }),
    );
    // factory/map are intentionally excluded: `key` + `nonce` describe the subscription.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, nonce]);

  // Until the first snapshot for this key arrives we are loading (also right after the key changes).
  return state.key === key ? state.value : INITIAL;
}

/** Live single document; `data` is null when the document does not exist. */
export function useDocument<T>(key: string, subscribe: (cb: (d: DocumentSnapshot) => void, err: (e: Error) => void) => () => void, map: (d: DocumentSnapshot) => T, nonce = 0) {
  const [state, setState] = useState<{ key: string; data: T | null; loading: boolean; error: Error | null }>({ key, data: null, loading: true, error: null });
  useEffect(() => {
    return subscribe(
      (d) => setState({ key, data: d.exists() ? map(d) : null, loading: false, error: null }),
      (error) => setState({ key, data: null, loading: false, error }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, nonce]);
  return state.key === key ? state : { key, data: null, loading: true, error: null };
}

