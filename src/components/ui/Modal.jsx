import { useEffect, useRef, useCallback } from 'react';
import useScrollLock from '../../hooks/useScrollLock';
import '../../styles/ui/Modal.css';

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'default',
  className = '',
}) {
  const modalRef = useRef(null);
  const previousFocus = useRef(null);
  const hasAutoFocused = useRef(false);

  /* ─── Lock background scroll (works on iOS Safari) ─── */
  useScrollLock(isOpen);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      }
    },
    [onClose]
  );

  /* Focus trap + keyboard ─── */
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  /* Auto-focus first input on open — runs ONCE per open, not on re-renders */
  useEffect(() => {
    if (isOpen && !hasAutoFocused.current) {
      previousFocus.current = document.activeElement;
      hasAutoFocused.current = true;

      requestAnimationFrame(() => {
        /* Prefer the first input/textarea, fall back to first focusable */
        const firstInput = modalRef.current?.querySelector('input, textarea, select');
        const firstFocusable = modalRef.current?.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        (firstInput || firstFocusable)?.focus();
      });
    }

    if (!isOpen) {
      hasAutoFocused.current = false;
      if (previousFocus.current && typeof previousFocus.current.focus === 'function') {
        previousFocus.current.focus();
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className={`modal ${size === 'large' ? 'modal--large' : ''} ${className}`}
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          {title && <h2 className="modal-title">{title}</h2>}
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
            type="button"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
