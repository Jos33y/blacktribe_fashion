import { useEffect, useRef } from 'react';

/**
 * useScrollLock — Prevents background scroll when an overlay is open.
 *
 * Why not just `overflow: hidden` on body?
 * iOS Safari ignores it. The page still scrolls behind modals/drawers.
 *
 * This hook uses the position-fixed technique:
 * 1. Save current scroll position
 * 2. Fix the body in place (position: fixed, top: -scrollY)
 * 3. On close: unfix, restore scroll position
 *
 * Handles multiple overlays: tracks lock count so the body only
 * unlocks when the LAST overlay closes (e.g. modal inside drawer).
 *
 * @param {boolean} isLocked - Whether to lock scroll
 */

/* Shared state across all hook instances */
let lockCount = 0;
let savedScrollY = 0;

export default function useScrollLock(isLocked) {
  const wasLocked = useRef(false);

  useEffect(() => {
    if (isLocked && !wasLocked.current) {
      wasLocked.current = true;
      lockCount++;

      if (lockCount === 1) {
        /* First lock — save position and fix body */
        savedScrollY = window.scrollY;

        document.body.style.position = 'fixed';
        document.body.style.top = `-${savedScrollY}px`;
        document.body.style.left = '0';
        document.body.style.right = '0';
        document.body.style.overflow = 'hidden';
      }
    }

    if (!isLocked && wasLocked.current) {
      wasLocked.current = false;
      lockCount = Math.max(0, lockCount - 1);

      if (lockCount === 0) {
        /* Last unlock — restore position */
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.overflow = '';

        window.scrollTo(0, savedScrollY);
      }
    }

    /* Cleanup if component unmounts while locked */
    return () => {
      if (wasLocked.current) {
        wasLocked.current = false;
        lockCount = Math.max(0, lockCount - 1);

        if (lockCount === 0) {
          document.body.style.position = '';
          document.body.style.top = '';
          document.body.style.left = '';
          document.body.style.right = '';
          document.body.style.overflow = '';

          window.scrollTo(0, savedScrollY);
        }
      }
    };
  }, [isLocked]);
}
