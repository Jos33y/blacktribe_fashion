import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router';
import '../../styles/ui/RouteProgressBar.css';

/**
 * RouteProgressBar — Thin progress line below the navbar.
 *
 * How it works:
 * 1. Location changes → bar appears at 0%, quickly jumps to 15%
 * 2. Interval ticks the bar toward 90% (slowing down as it approaches)
 * 3. Next frame after React renders the new route → snaps to 100%
 * 4. After 100% → fades out, resets
 *
 * The bar is purely cosmetic. It doesn't track real loading state.
 * It masks the perceived latency of lazy-loaded route chunks.
 * The speed curve (fast start, slow middle, instant finish) matches
 * what users expect from YouTube/GitHub/SSENSE.
 */
export default function RouteProgressBar() {
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const prevPath = useRef(location.pathname);
  const isFirstRender = useRef(true);

  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    /* Skip the initial mount — no transition on first page load */
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevPath.current = location.pathname;
      return;
    }

    /* Skip if path didn't actually change (query/hash only) */
    if (location.pathname === prevPath.current) return;
    prevPath.current = location.pathname;

    cleanup();

    /* ─── Phase 1: Start ─── */
    setProgress(15);
    setVisible(true);

    /* ─── Phase 2: Crawl toward 90% ─── */
    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        /* Slow down as we approach 90 — gives perception of work happening */
        const increment = prev < 40 ? 8 : prev < 60 ? 4 : prev < 80 ? 2 : 0.5;
        return Math.min(prev + increment, 90);
      });
    }, 200);

    /* ─── Phase 3: Complete ─── */
    /* Use rAF to wait for the next paint (lazy component has rendered) */
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        cleanup();
        setProgress(100);

        /* ─── Phase 4: Fade out ─── */
        timeoutRef.current = setTimeout(() => {
          setVisible(false);
          /* Reset after fade animation completes */
          timeoutRef.current = setTimeout(() => {
            setProgress(0);
          }, 300);
        }, 200);
      });
    });

    return cleanup;
  }, [location.pathname, cleanup]);

  if (!visible && progress === 0) return null;

  return (
    <div
      className={`route-progress ${visible ? 'route-progress--visible' : 'route-progress--hiding'}`}
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Page loading"
    >
      <div
        className="route-progress__bar"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
