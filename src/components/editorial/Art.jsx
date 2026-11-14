/*
 * BLACKTRIBE FASHION — MAGAZINE ART
 *
 * Every piece of art here is built from the brand's own mask:
 *   MaskArt      the mask itself, solid or line-drawn (engraved look)
 *   MaskBand     a border band from the mask's forehead: two stripes over
 *                a row of inverted triangles
 *   MaskEnd      the tiny mask that closes a story, as magazines end
 *                an article with a mark
 *   Flag         small flags for the world page (the only colour the
 *                art system brings; photos bring the rest)
 *
 * All SVG, so it prints sharp at any size and inherits currentColor.
 */

import { useId } from 'react';
import { MASK_PATH, MASK_VIEWBOX } from './maskPath';

export function MaskArt({ variant = 'solid', className = '' }) {
  const line = variant === 'line';
  return (
    <svg
      className={`ed-mask ${line ? 'ed-mask--line' : ''} ${className}`}
      viewBox={MASK_VIEWBOX}
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
    >
      <path
        d={MASK_PATH}
        fillRule="evenodd"
        fill={line ? 'none' : 'currentColor'}
        stroke={line ? 'currentColor' : 'none'}
        strokeWidth={line ? 4 : 0}
        vectorEffect={line ? 'non-scaling-stroke' : undefined}
      />
    </svg>
  );
}

export function MaskBand({ className = '' }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg className={`ed-band ${className}`} aria-hidden="true" focusable="false" preserveAspectRatio="none">
      <defs>
        <pattern id={`band-${id}`} width="24" height="30" patternUnits="userSpaceOnUse">
          <g fill="currentColor">
            <rect x="0" y="0" width="24" height="2.4" />
            <rect x="0" y="4.8" width="24" height="2.4" />
            <path d="M0 9.6 L24 9.6 L12 29.5 Z" />
          </g>
          <path d="M5.6 12.4 L18.4 12.4 L12 22.8 Z" fill="var(--ed-bg)" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#band-${id})`} />
    </svg>
  );
}

export function MaskEnd() {
  return (
    <svg className="ed-end" viewBox={MASK_VIEWBOX} aria-hidden="true" focusable="false">
      <path d={MASK_PATH} fillRule="evenodd" fill="currentColor" />
    </svg>
  );
}


/* ─── Flags (3:2), drawn simply so they read at 5mm ─── */

const FLAGS = {
  NG: (
    <>
      <rect width="30" height="20" fill="#fff" />
      <rect width="10" height="20" fill="#008751" />
      <rect x="20" width="10" height="20" fill="#008751" />
    </>
  ),
  PT: (
    <>
      <rect width="30" height="20" fill="#DA291C" />
      <rect width="12" height="20" fill="#046A38" />
      <circle cx="12" cy="10" r="4.2" fill="#FFE900" />
      <circle cx="12" cy="10" r="2.6" fill="#DA291C" />
    </>
  ),
  DE: (
    <>
      <rect width="30" height="20" fill="#FFCE00" />
      <rect width="30" height="13.34" fill="#DD0000" />
      <rect width="30" height="6.67" fill="#000" />
    </>
  ),
  GB: (
    <>
      <rect width="30" height="20" fill="#012169" />
      <path d="M0 0 L30 20 M30 0 L0 20" stroke="#fff" strokeWidth="4" />
      <path d="M0 0 L30 20 M30 0 L0 20" stroke="#C8102E" strokeWidth="1.6" />
      <path d="M15 0 V20 M0 10 H30" stroke="#fff" strokeWidth="6" />
      <path d="M15 0 V20 M0 10 H30" stroke="#C8102E" strokeWidth="3.4" />
    </>
  ),
  TR: (
    <>
      <rect width="30" height="20" fill="#E30A17" />
      <circle cx="11" cy="10" r="5" fill="#fff" />
      <circle cx="12.3" cy="10" r="4" fill="#E30A17" />
      <path d="M17.2 10 L20.6 8.9 L18.5 11.8 L18.5 8.2 L20.6 11.1 Z" fill="#fff" />
    </>
  ),
  FR: (
    <>
      <rect width="30" height="20" fill="#fff" />
      <rect width="10" height="20" fill="#002395" />
      <rect x="20" width="10" height="20" fill="#ED2939" />
    </>
  ),
  US: (
    <>
      <rect width="30" height="20" fill="#fff" />
      {[0, 2, 4, 6, 8, 10, 12].map((i) => <rect key={i} y={i * 1.54} width="30" height="1.54" fill="#B22234" />)}
      <rect width="12" height="10.8" fill="#3C3B6E" />
    </>
  ),
  GH: (
    <>
      <rect width="30" height="20" fill="#006B3F" />
      <rect width="30" height="13.34" fill="#FCD116" />
      <rect width="30" height="6.67" fill="#CE1126" />
      <path d="M15 7.6 L15.9 10.3 L18.7 10.3 L16.4 11.9 L17.3 14.6 L15 12.9 L12.7 14.6 L13.6 11.9 L11.3 10.3 L14.1 10.3 Z" fill="#000" />
    </>
  ),
  /* Worldwide: a globe in the page's ink, not a flag */
  WW: (
    <g fill="none" stroke="currentColor" strokeWidth="1.1">
      <circle cx="15" cy="10" r="8.6" />
      <ellipse cx="15" cy="10" rx="3.8" ry="8.6" />
      <path d="M6.4 10 H23.6 M8 5.6 H22 M8 14.4 H22" />
    </g>
  ),
  ZA: (
    <>
      <rect width="30" height="20" fill="#fff" />
      <rect width="30" height="7" fill="#E03C31" />
      <rect y="13" width="30" height="7" fill="#001489" />
      <path d="M0 0 L13 10 L0 20 Z" fill="#000" />
      <path d="M0 3 L9 10 L0 17" fill="none" stroke="#FFB81C" strokeWidth="1.4" />
      <path d="M0 0 L14 10 L0 20 M14 10 H30" fill="none" stroke="#007749" strokeWidth="3" />
    </>
  ),
};

export const FLAG_CODES = Object.keys(FLAGS);

export function Flag({ code }) {
  const art = FLAGS[(code || '').toUpperCase()];
  if (!art) return <span className="ed-flag ed-flag--none" aria-hidden="true" />;
  const globe = code.toUpperCase() === 'WW';
  return (
    <svg className={`ed-flag ${globe ? 'ed-flag--globe' : ''}`} viewBox="0 0 30 20" aria-hidden="true" focusable="false">
      <clipPath id={`flag-${code}`}><rect width="30" height="20" /></clipPath>
      <g clipPath={`url(#flag-${code})`}>{art}</g>
    </svg>
  );
}


/*
 * Proof marks: crop marks at the corners of a photo and a figure number,
 * the way a designer's proof looks before it goes to press.
 */
export function ProofMarks({ number }) {
  return (
    <div className="ed-proof" aria-hidden="true">
      <svg className="ed-proof__marks" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M0 6 H4 M6 0 V4 M100 6 H96 M94 0 V4 M0 94 H4 M6 100 V96 M100 94 H96 M94 100 V96" />
      </svg>
      <span className="ed-proof__fig">Fig. {String(number).padStart(2, '0')}</span>
    </div>
  );
}

/* Film grain laid over a page: an SVG noise tile, so it prints */
export function Grain() {
  return <div className="ed-grain" aria-hidden="true" />;
}
