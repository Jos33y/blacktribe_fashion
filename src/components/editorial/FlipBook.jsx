/*
 * BLACKTRIBE FASHION — FLIPBOOK
 *
 * The magazine as a physical object: pages turn on a 3D hinge, with the
 * shading of real paper. No library, no PDF: the pages are the same live
 * EditorialPage components the print view uses, so prices, product links
 * and QR codes stay current and clickable.
 *
 * Layout
 *   Wide screens (landscape, 900px+): two-page spreads. The cover opens
 *   alone on the right, the back cover closes alone on the left, and the
 *   book slides so a single page always sits centred.
 *   Phones and portrait: one page at a time, turning on its left edge.
 *
 * Turning
 *   Drag or swipe the page, click either half, use the arrow keys, the
 *   buttons, or the page scrubber. A drag past a third completes the turn;
 *   less snaps back. Reduced motion: pages change instantly.
 *
 * Links inside a page (product names, QR codes) work as normal: a click on
 * a link never turns the page.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import EditorialPage from './EditorialPage';
import '../../styles/editorial/FlipBook.css';

const TURN_MS = 720;
const COMPLETE_AT = 0.33;
const PAGE_RATIO = 297 / 210;

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/* Spreads: [left, right] page indexes. Cover alone on the right, then pairs. */
function buildSpreads(count) {
  const spreads = [[null, 0]];
  for (let i = 1; i < count; i += 2) spreads.push([i, i + 1 < count ? i + 1 : null]);
  return spreads;
}

/* Every photo the issue uses, so pages are ready before they turn into view */
function imageUrls(pages, products) {
  const urls = new Set();
  for (const p of pages) {
    const f = p.fields || {};
    if (f.image) urls.add(f.image);
    if (f.cutout) urls.add(f.cutout);
    if (Array.isArray(f.images)) f.images.forEach((u) => urls.add(u));
    if (Array.isArray(f.products)) {
      f.products.forEach((id) => { const img = products?.[id]?.image; if (img) urls.add(img); });
    }
  }
  return [...urls];
}

export default function FlipBook({ pages, feature, products }) {
  const count = pages.length;
  const stageRef = useRef(null);
  const drag = useRef(null);

  const [size, setSize] = useState({ w: 0, h: 0, spread: false });
  const [view, setView] = useState(0);              /* spread index (spread mode) or page index */
  const [turn, setTurn] = useState(null);           /* { dir: 1 | -1, p: 0..1, settle: bool } */
  const [isFull, setIsFull] = useState(false);

  const spreads = useMemo(() => buildSpreads(count), [count]);
  const spreadMode = size.spread;
  const last = spreadMode ? spreads.length - 1 : count - 1;

  /* ─── Size: fit the book into the space it has ─── */
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return undefined;
    const measure = () => {
      const box = el.getBoundingClientRect();
      const availW = box.width;
      /* Fit the screen height (minus the site header and the controls), not the
         space left below the title: the reader scrolls the book into view */
      const full = !!document.fullscreenElement;
      const availH = Math.max(320, window.innerHeight - (full ? 120 : 190));
      const spread = availW >= 900 && availW > availH;
      const pagesAcross = spread ? 2 : 1;
      let w = availW / pagesAcross;
      let h = w * PAGE_RATIO;
      if (h > availH) { h = availH; w = h / PAGE_RATIO; }
      setSize({ w: Math.floor(w), h: Math.floor(h), spread });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);
    return () => { ro.disconnect(); window.removeEventListener('resize', measure); };
  }, []);

  /* Switching between spread and single keeps the reader on the same page */
  const prevMode = useRef(spreadMode);
  useEffect(() => {
    if (prevMode.current === spreadMode) return;
    setView((v) => {
      if (spreadMode) return Math.ceil(v / 2);                 /* page → spread */
      const [l, r] = spreads[v] || [null, 0];                  /* spread → page */
      return r ?? l ?? 0;
    });
    prevMode.current = spreadMode;
    setTurn(null);
  }, [spreadMode, spreads]);

  /* Preload every photo once */
  useEffect(() => {
    imageUrls(pages, products).forEach((src) => { const img = new Image(); img.src = src; });
  }, [pages, products]);

  /* ─── Turning ─── */
  const canGo = useCallback((dir) => (dir > 0 ? view < last : view > 0), [view, last]);

  const finish = useCallback((dir) => {
    setView((v) => Math.min(last, Math.max(0, v + dir)));
    setTurn(null);
  }, [last]);

  const go = useCallback((dir) => {
    if (turn || !canGo(dir)) return;
    if (prefersReducedMotion()) { finish(dir); return; }
    setTurn({ dir, p: 0, settle: false });
    /* next frame: animate to the end */
    requestAnimationFrame(() => requestAnimationFrame(() => setTurn({ dir, p: 1, settle: true })));
  }, [turn, canGo, finish]);

  const jump = useCallback((target) => {
    if (turn) return;
    setView(Math.min(last, Math.max(0, target)));
  }, [turn, last]);

  const onTransitionEnd = (e) => {
    if (e.target !== e.currentTarget || e.propertyName !== 'transform' || !turn?.settle) return;
    if (turn.p >= 1) finish(turn.dir);
    else setTurn(null);
  };

  /* Keyboard */
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest?.('input, textarea, select')) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); go(1); }
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); go(-1); }
      if (e.key === 'Home') jump(0);
      if (e.key === 'End') jump(last);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, jump, last]);

  /* ─── Drag and swipe ─── */
  const bookWidth = size.w * (spreadMode ? 2 : 1);

  const onPointerDown = (e) => {
    if (turn || e.button > 0) return;
    if (e.target.closest('a, button, input')) return;
    drag.current = { x: e.clientX, y: e.clientY, dir: 0, moved: false, id: e.pointerId };
  };

  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.dir) {
      if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy)) return;   /* let vertical scroll and pinch through */
      const dir = dx < 0 ? 1 : -1;
      if (!canGo(dir) || prefersReducedMotion()) { drag.current = null; return; }
      d.dir = dir;
      d.moved = true;
      stageRef.current?.setPointerCapture?.(e.pointerId);
    }
    const p = Math.min(1, Math.max(0, (dx * -d.dir) / (bookWidth * 0.7)));
    setTurn({ dir: d.dir, p, settle: false });
  };

  const onPointerUp = (e) => {
    const d = drag.current;
    drag.current = null;
    if (!d || d.id !== e.pointerId) return;

    if (d.moved) {
      setTurn((t) => (t ? { ...t, p: t.p >= COMPLETE_AT ? 1 : 0, settle: true } : t));
      return;
    }

    /* A tap or click: right half forward, left half back */
    if (e.target.closest('a, button')) return;
    const box = stageRef.current.getBoundingClientRect();
    go(e.clientX - box.left > box.width / 2 ? 1 : -1);
  };

  /* ─── Fullscreen (where the browser allows it) ─── */
  const fullscreenOk = typeof document !== 'undefined' && !!document.documentElement.requestFullscreen;
  const shellRef = useRef(null);
  useEffect(() => {
    const onChange = () => setIsFull(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);
  const toggleFull = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else shellRef.current?.requestFullscreen?.();
  };

  /* ─── What is on screen ─── */
  const page = (i) => (i == null || i < 0 || i >= count ? null : (
    <EditorialPage page={pages[i]} number={i + 1} feature={feature} products={products} />
  ));

  const dir = turn?.dir || 0;
  const p = turn?.p || 0;
  const shade = Math.sin(p * Math.PI);              /* darkest mid-turn */

  let under = { left: null, right: null };
  let leaf = null;                                  /* { side, front, back, angle } */

  if (spreadMode) {
    const [L, R] = spreads[view];
    if (dir === 1) {
      const [L2, R2] = spreads[view + 1];
      under = { left: L, right: R2 };
      leaf = { side: 'right', front: R, back: L2, angle: -180 * p };
    } else if (dir === -1) {
      const [L0, R0] = spreads[view - 1];
      under = { left: L0, right: R };
      leaf = { side: 'left', front: L, back: R0, angle: 180 * p };
    } else {
      under = { left: L, right: R };
    }
  } else if (dir === 1) {
    under = { right: view + 1 };
    leaf = { side: 'single', front: view, back: null, angle: -180 * p };
  } else if (dir === -1) {
    under = { right: view };
    leaf = { side: 'single', front: view - 1, back: null, angle: -180 * (1 - p) };
  } else {
    under = { right: view };
  }

  /* Book slides so a lone cover or back cover sits centred */
  let shift = 0;
  if (spreadMode) {
    const target = dir ? view + (p >= 0.5 ? dir : 0) : view;
    const [l, r] = spreads[target];
    if (l == null) shift = -size.w / 2;
    if (r == null) shift = size.w / 2;
  }

  /* Counter */
  const label = spreadMode
    ? spreads[view].filter((x) => x != null).map((x) => String(x + 1).padStart(2, '0')).join('–')
    : String(view + 1).padStart(2, '0');

  const ready = size.w > 0;
  const settling = turn?.settle;

  return (
    <div className={`flip ${isFull ? 'flip--full' : ''}`} ref={shellRef}>
      <div
        className="flip__stage"
        ref={stageRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ height: ready ? size.h : undefined }}
      >
        {ready && (
          <div
            className={`flip__book ${spreadMode ? 'flip__book--spread' : 'flip__book--single'}`}
            style={{
              width: bookWidth,
              height: size.h,
              '--page-w': `${size.w}px`,
              transform: `translateX(${shift}px)`,
            }}
          >
            {/* Pages lying flat */}
            {spreadMode && (
              <div className="flip__half flip__half--left">
                {page(under.left)}
                {leaf?.side === 'left' && <div className="flip__shadow flip__shadow--left" style={{ opacity: 0.45 * (1 - p) }} />}
              </div>
            )}
            <div className="flip__half flip__half--right">
              {page(under.right)}
              {leaf && leaf.side !== 'left' && <div className="flip__shadow flip__shadow--right" style={{ opacity: 0.5 * (1 - p) }} />}
            </div>

            {/* The page in the air */}
            {leaf && (
              <div
                className={`flip__leaf flip__leaf--${leaf.side} ${settling ? 'flip__leaf--settle' : ''}`}
                style={{
                  transform: `rotateY(${leaf.angle}deg)`,
                  transitionDuration: settling ? `${TURN_MS}ms` : '0ms',
                }}
                onTransitionEnd={onTransitionEnd}
              >
                <div className="flip__face flip__face--front">
                  {page(leaf.front)}
                  <div className="flip__gloss" style={{ opacity: 0.4 * shade }} />
                </div>
                <div className="flip__face flip__face--back">
                  {leaf.back != null ? page(leaf.back) : <div className="flip__paper" />}
                  <div className="flip__gloss flip__gloss--back" style={{ opacity: 0.4 * shade }} />
                </div>
              </div>
            )}

            {spreadMode && <div className="flip__spine" aria-hidden="true" />}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flip__bar" role="toolbar" aria-label="Magazine controls">
        <button type="button" className="flip__btn" onClick={() => go(-1)} disabled={!canGo(-1)} aria-label="Previous page">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        </button>

        <div className="flip__scrub">
          <span className="flip__count" aria-live="polite">
            {label} <span className="flip__of">/ {String(count).padStart(2, '0')}</span>
          </span>
          <input
            type="range"
            min="0"
            max={last}
            value={view}
            onChange={(e) => jump(Number(e.target.value))}
            aria-label="Go to page"
            className="flip__range"
          />
        </div>

        <button type="button" className="flip__btn" onClick={() => go(1)} disabled={!canGo(1)} aria-label="Next page">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
        </button>

        {fullscreenOk && (
          <button type="button" className="flip__btn flip__btn--full" onClick={toggleFull} aria-label={isFull ? 'Exit full screen' : 'Full screen'}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              {isFull
                ? <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
                : <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />}
            </svg>
          </button>
        )}
      </div>

      <p className="flip__hint">
        {spreadMode ? 'Drag a page corner, click, or use the arrow keys.' : 'Swipe to turn. Pinch to zoom.'}
      </p>
    </div>
  );
}
