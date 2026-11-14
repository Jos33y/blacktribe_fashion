/*
 * BLACKTRIBE FASHION — QR CODE (vector)
 *
 * Renders a QR code as a single SVG path, so it stays razor sharp in the
 * print PDF at any size. Dark modules on a white tile with the standard
 * 4-module quiet zone, which scanners need, on dark and light pages alike.
 *
 * Dependency: qrcode-generator (npm install qrcode-generator)
 *
 * Print sizing: keep codes at 12mm or larger. Product URLs (~60 chars)
 * make a 33×33 grid, so 12mm gives ~0.3mm modules, fine for any phone.
 */

import { useMemo } from 'react';
import qrcode from 'qrcode-generator';

const QUIET = 4;

export default function QRCode({ value, className = '', label }) {
  const { size, path } = useMemo(() => {
    if (!value) return { size: 0, path: '' };
    const qr = qrcode(0, 'M');
    qr.addData(value);
    qr.make();

    const count = qr.getModuleCount();
    let d = '';
    for (let r = 0; r < count; r++) {
      for (let c = 0; c < count; c++) {
        if (qr.isDark(r, c)) d += `M${c + QUIET} ${r + QUIET}h1v1h-1z`;
      }
    }
    return { size: count + QUIET * 2, path: d };
  }, [value]);

  if (!path) return null;

  return (
    <svg
      className={`ed-qr ${className}`}
      viewBox={`0 0 ${size} ${size}`}
      shapeRendering="crispEdges"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : 'true'}
    >
      <rect className="ed-qr__bg" width={size} height={size} />
      <path className="ed-qr__dots" d={path} />
    </svg>
  );
}
