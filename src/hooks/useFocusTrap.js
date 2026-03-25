/*
 * BLACKTRIBE FASHION — FOCUS TRAP HOOK
 *
 * Traps keyboard focus inside a container when active.
 * Required for WCAG 2.2 compliance on modals, drawers, overlays.
 *
 * Usage:
 *   const trapRef = useFocusTrap(isOpen, onClose);
 *   return <div ref={trapRef}>...</div>;
 *
 * Behavior:
 *   - Tab / Shift+Tab cycles within the container
 *   - Escape calls onClose
 *   - Focus moves to first focusable element on open
 *   - Focus returns to the trigger element on close
 */

import { useEffect, useRef, useCallback } from 'react';

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

export default function useFocusTrap(isOpen, onClose) {
  const containerRef = useRef(null);
  const previousFocusRef = useRef(null);

  /* ─── Store the element that was focused before opening ─── */
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement;
    }
  }, [isOpen]);

  /* ─── Focus first element on open, restore on close ─── */
  useEffect(() => {
    if (!isOpen) return;

    const container = containerRef.current;
    if (!container) return;

    // Slight delay to ensure DOM has rendered
    const timer = requestAnimationFrame(() => {
      const focusable = container.querySelectorAll(FOCUSABLE_SELECTORS);
      if (focusable.length > 0) {
        focusable[0].focus();
      } else {
        // If no focusable children, make container focusable
        container.setAttribute('tabindex', '-1');
        container.focus();
      }
    });

    return () => {
      cancelAnimationFrame(timer);
      // Restore focus to the trigger element
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        // Use setTimeout to avoid focus racing with closing animations
        setTimeout(() => {
          previousFocusRef.current?.focus();
        }, 0);
      }
    };
  }, [isOpen]);

  /* ─── Trap Tab and handle Escape ─── */
  const handleKeyDown = useCallback(
    (e) => {
      if (!isOpen) return;

      const container = containerRef.current;
      if (!container) return;

      /* Escape → close */
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose?.();
        return;
      }

      /* Tab → cycle within container */
      if (e.key === 'Tab') {
        const focusable = container.querySelectorAll(FOCUSABLE_SELECTORS);
        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          /* Shift+Tab on first → wrap to last */
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          /* Tab on last → wrap to first */
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    },
    [isOpen, onClose]
  );

  /* ─── Attach keydown listener ─── */
  useEffect(() => {
    if (!isOpen) return;

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, handleKeyDown]);

  return containerRef;
}
