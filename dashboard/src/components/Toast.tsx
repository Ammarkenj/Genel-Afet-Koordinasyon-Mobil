import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { Icon } from './Icon';

interface ToastApi {
  show: (message: string) => void;
}
const Ctx = createContext<ToastApi>({ show: () => undefined });

/** Short confirmation message ("Saved"), announced to screen readers. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<{ text: string; id: number } | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const show = useCallback((text: string) => {
    window.clearTimeout(timer.current);
    setMessage({ text, id: Date.now() });
    timer.current = window.setTimeout(() => setMessage(null), 2600);
  }, []);
  const api = useMemo(() => ({ show }), [show]);
  return (
    <Ctx.Provider value={api}>
      {children}
      <div role="status" aria-live="polite">
        {message && <div className="toast" key={message.id}><Icon name="check" />{message.text}</div>}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
