import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from './Icon';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Modal behaviour shared by drawers and dialogs: focus moves in, Tab stays inside, Escape closes, focus returns on close. */
function useDialog(onClose: () => void, initialFocus?: string) {
  const ref = useRef<HTMLElement | null>(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const root = ref.current;
    const target = (initialFocus ? root?.querySelector<HTMLElement>(initialFocus) : null) ?? root?.querySelector<HTMLElement>(FOCUSABLE);
    target?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        closeRef.current();
      } else if (e.key === 'Tab' && root) {
        const items = [...root.querySelectorAll<HTMLElement>(FOCUSABLE)];
        const first = items[0];
        const last = items[items.length - 1];
        if (!first || !last) return;
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
    // Runs once per open dialog.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return ref;
}

interface DrawerProps {
  title: ReactNode;
  titleId: string;
  onClose: () => void;
  footer?: ReactNode;
  children: ReactNode;
  wide?: boolean;
  /** Hide the close button (e.g. a step that must be finished). */
  hideClose?: boolean;
}

/** Side panel (end side, so it opens on the left in RTL). */
export function Drawer({ title, titleId, onClose, footer, children, wide, hideClose }: DrawerProps) {
  const { t } = useTranslation();
  const ref = useDialog(onClose);
  return createPortal(
    <>
      <div className="drawer-scrim" onClick={onClose} />
      <aside ref={ref} className="drawer" role="dialog" aria-modal="true" aria-labelledby={titleId} style={wide ? { inlineSize: 'min(520px, 100vw)' } : undefined}>
        <div className="drawer-h">
          <h2 id={titleId}>{title}</h2>
          {!hideClose && <button type="button" className="btn icon-only" onClick={onClose} aria-label={t('dr.close')}><Icon name="close" /></button>}
        </div>
        <div className="drawer-b">{children}</div>
        {footer && <div className="drawer-f">{footer}</div>}
      </aside>
    </>,
    document.body,
  );
}

interface ConfirmProps {
  title: string;
  titleId: string;
  /** The safe answer, focused by default. */
  keepLabel: string;
  confirmLabel: string;
  onKeep: () => void;
  onConfirm: () => void;
  confirmDisabled?: boolean;
  busy?: boolean;
  children?: ReactNode;
}

/** Confirmation for irreversible actions. The safe answer is the default focus and the primary button. */
export function ConfirmDialog({ title, titleId, keepLabel, confirmLabel, onKeep, onConfirm, confirmDisabled, busy, children }: ConfirmProps) {
  const ref = useDialog(onKeep, '[data-keep]');
  return createPortal(
    <div className="modal-scrim">
      <div ref={ref as React.RefObject<HTMLDivElement>} className="modal" role="alertdialog" aria-modal="true" aria-labelledby={titleId}>
        <h2 id={titleId}>{title}</h2>
        {children}
        <div className="actions">
          <button type="button" data-keep className="btn primary" style={{ minBlockSize: 52 }} onClick={onKeep}>{keepLabel}</button>
          <button type="button" className="btn" style={{ minBlockSize: 52 }} onClick={onConfirm} disabled={confirmDisabled || busy}>{confirmLabel}</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
