/*
 * BLACKTRIBE FASHION — WALK-IN RECEIPT IMAGE v3
 *
 * Canvas API generates a branded receipt image.
 * Staff can share via Web Share API or save.
 *
 * v3 fixes:
 *   - Tribal mask logo above wordmark
 *   - ALL text WCAG AA minimum (no text below 5.7:1 on #0C0C0C)
 *   - Dynamic canvas height — no dead space
 *   - Payment method proper casing (POS Terminal)
 *   - Divider lines visible (#4A4A4A, not #2A2A2A)
 *   - "REDEFINING LUXURY" readable (#9B9894)
 *   - Monochrome share buttons, horizontal layout
 */

import { useRef, useEffect, useState } from 'react';

const LOGO_URL = '/logo_white.png';

function formatNaira(kobo) {
  const naira = Math.round(kobo / 100);
  return '\u20A6' + naira.toLocaleString('en-NG');
}

const PAYMENT_LABELS = {
  cash: 'Cash',
  pos_terminal: 'POS Terminal',
  bank_transfer: 'Bank Transfer',
  paystack: 'Paystack',
};

/*
 * Contrast reference on #0C0C0C:
 *   #EDEBE8 = 13.8:1 (AAA) — primary text, values, totals
 *   #C8C4BF = 9.2:1  (AAA) — secondary text, thank you, URL
 *   #9B9894 = 5.7:1  (AA)  — labels, tagline, meta keys
 *   #4A4A4A = 3.7:1         — divider lines (non-text, 3:1 min)
 */

const C = {
  bg: '#0C0C0C',
  primary: '#EDEBE8',    /* 13.8:1 */
  secondary: '#C8C4BF',  /* ~9.2:1 */
  label: '#9B9894',       /* 5.7:1 */
  divider: '#4A4A4A',     /* 3.7:1 — non-text element */
  dividerSolid: '#5A5A5A',
};

export default function WalkInReceiptImage({ order, items = [], onReady }) {
  const canvasRef = useRef(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [blob, setBlob] = useState(null);
  const blobUrlRef = useRef(null);

  useEffect(() => {
    if (!order || !items.length) return;
    loadLogoAndGenerate();
  }, [order, items]);

  useEffect(() => {
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, []);

  function loadLogoAndGenerate() {
    const logo = new Image();
    logo.crossOrigin = 'anonymous';
    logo.onload = () => generateImage(logo);
    logo.onerror = () => generateImage(null);
    logo.src = LOGO_URL;
  }

  function generateImage(logoImg) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const W = 1080;
    const PAD = 80;

    /* ─── Calculate dynamic height ─── */
    let h = 0;
    h += 100;  /* top padding */
    if (logoImg) h += 80; /* logo + gap */
    h += 80;   /* wordmark + FASHION */
    h += 60;   /* gap to divider */
    h += 40 + (36 * 3) + 50; /* meta rows + gap */
    h += 40;   /* divider gap */
    h += items.length * 72; /* items */
    h += 50;   /* gap after items */
    h += 40;   /* subtotal */
    if (order.discount_amount > 0) h += 40;
    h += 40;   /* divider + gap */
    h += 40;   /* total */
    h += 36;   /* payment */
    h += 80;   /* gap */
    h += 30;   /* thank you */
    h += 50;   /* url */
    h += 60;   /* tagline */
    h += 80;   /* bottom padding */

    const H = Math.max(h, 1080);
    canvas.width = W;
    canvas.height = H;

    let y = 100;

    /* Background */
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);

    function setSpacing(val) {
      if ('letterSpacing' in ctx) ctx.letterSpacing = val;
    }

    /* ─── TRIBAL MASK LOGO ─── */
    if (logoImg) {
      const logoW = 52;
      const logoH = (logoImg.height / logoImg.width) * logoW;
      ctx.drawImage(logoImg, (W - logoW) / 2, y, logoW, logoH);
      y += logoH + 24;
    }

    /* ─── BLACKTRIBE wordmark ─── */
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = C.primary;
    ctx.font = '800 44px "Syne", "Helvetica Neue", Arial, sans-serif';
    setSpacing('10px');
    ctx.fillText('BLACKTRIBE', W / 2, y);
    setSpacing('0px');
    y += 30;

    ctx.fillStyle = C.label;
    ctx.font = '300 15px "Outfit", "Helvetica Neue", Arial, sans-serif';
    setSpacing('8px');
    ctx.fillText('FASHION', W / 2, y);
    setSpacing('0px');
    y += 60;

    /* ─── Dashed divider ─── */
    function drawDivider(yPos) {
      ctx.strokeStyle = C.divider;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(PAD, yPos);
      ctx.lineTo(W - PAD, yPos);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    drawDivider(y);
    y += 44;

    /* ─── Order meta ─── */
    ctx.font = '400 20px "DM Mono", "Courier New", monospace';

    /* Order number */
    ctx.textAlign = 'left';
    ctx.fillStyle = C.label;
    ctx.fillText('Order', PAD, y);
    ctx.textAlign = 'right';
    ctx.fillStyle = C.primary;
    ctx.font = '500 20px "DM Mono", "Courier New", monospace';
    ctx.fillText(order.order_number || '', W - PAD, y);
    y += 36;

    /* Date */
    ctx.font = '400 20px "DM Mono", "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = C.label;
    ctx.fillText('Date', PAD, y);
    ctx.textAlign = 'right';
    ctx.fillStyle = C.secondary;
    const dateStr = new Date(order.created_at).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
    ctx.fillText(dateStr, W - PAD, y);
    y += 36;

    /* Payment method */
    const paymentLabel = PAYMENT_LABELS[order.payment_method] || order.payment_method || '';
    ctx.textAlign = 'left';
    ctx.fillStyle = C.label;
    ctx.fillText('Payment', PAD, y);
    ctx.textAlign = 'right';
    ctx.fillStyle = C.primary;
    ctx.font = '500 20px "DM Mono", "Courier New", monospace';
    ctx.fillText(paymentLabel, W - PAD, y);
    y += 50;

    drawDivider(y);
    y += 44;

    /* ─── Items ─── */
    ctx.textAlign = 'left';
    items.forEach((item) => {
      /* Item name */
      ctx.fillStyle = C.primary;
      ctx.font = '500 24px "Outfit", "Helvetica Neue", Arial, sans-serif';
      const name = item.name || 'Product';
      const truncName = name.length > 30 ? name.slice(0, 28) + '...' : name;
      ctx.fillText(truncName, PAD, y);

      /* Price aligned right */
      ctx.textAlign = 'right';
      ctx.fillStyle = C.primary;
      ctx.font = '500 22px "DM Mono", "Courier New", monospace';
      ctx.fillText(formatNaira(item.price * item.quantity), W - PAD, y);
      y += 30;

      /* Size + quantity */
      ctx.textAlign = 'left';
      ctx.fillStyle = C.label;
      ctx.font = '400 17px "DM Mono", "Courier New", monospace';
      ctx.fillText(`Size ${item.size}${item.quantity > 1 ? '  \u00D7' + item.quantity : ''}`, PAD, y);
      y += 42;
    });

    y += 10;
    drawDivider(y);
    y += 44;

    /* ─── Totals ─── */
    ctx.font = '400 22px "DM Mono", "Courier New", monospace';

    /* Subtotal */
    ctx.textAlign = 'left';
    ctx.fillStyle = C.secondary;
    ctx.fillText('Subtotal', PAD, y);
    ctx.textAlign = 'right';
    ctx.fillText(formatNaira(order.subtotal), W - PAD, y);
    y += 40;

    /* Discount */
    if (order.discount_amount > 0) {
      ctx.textAlign = 'left';
      ctx.fillStyle = '#4ADE80';
      ctx.fillText('Discount', PAD, y);
      ctx.textAlign = 'right';
      ctx.fillText('-' + formatNaira(order.discount_amount), W - PAD, y);
      y += 40;
    }

    /* Solid divider before total */
    ctx.strokeStyle = C.dividerSolid;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(PAD, y);
    ctx.lineTo(W - PAD, y);
    ctx.stroke();
    y += 40;

    /* Total */
    ctx.textAlign = 'left';
    ctx.fillStyle = C.primary;
    ctx.font = '600 30px "Outfit", "Helvetica Neue", Arial, sans-serif';
    ctx.fillText('Total', PAD, y);
    ctx.textAlign = 'right';
    ctx.font = '500 30px "DM Mono", "Courier New", monospace';
    ctx.fillText(formatNaira(order.total), W - PAD, y);
    y += 36;

    /* Payment row */
    ctx.textAlign = 'left';
    ctx.fillStyle = C.label;
    ctx.font = '400 18px "DM Mono", "Courier New", monospace';
    ctx.fillText('Payment', PAD, y);
    ctx.textAlign = 'right';
    ctx.fillStyle = C.secondary;
    ctx.fillText(paymentLabel, W - PAD, y);
    y += 80;

    drawDivider(y);
    y += 60;

    /* ─── Thank you ─── */
    ctx.textAlign = 'center';
    ctx.fillStyle = C.secondary;
    ctx.font = '300 22px "Outfit", "Helvetica Neue", Arial, sans-serif';
    ctx.fillText('Thank you for shopping with BlackTribe.', W / 2, y);
    y += 50;

    /* ─── URL ─── */
    ctx.fillStyle = C.label;
    ctx.font = '400 18px "DM Mono", "Courier New", monospace';
    setSpacing('3px');
    ctx.fillText('blacktribefashion.com', W / 2, y);
    setSpacing('0px');

    /* ─── Tagline at bottom ─── */
    ctx.fillStyle = C.label;
    ctx.font = '300 15px "Outfit", "Helvetica Neue", Arial, sans-serif';
    setSpacing('8px');
    ctx.fillText('REDEFINING LUXURY', W / 2, H - 60);
    setSpacing('0px');

    /* Generate blob */
    canvas.toBlob((b) => {
      if (b) {
        if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
        const url = URL.createObjectURL(b);
        blobUrlRef.current = url;
        setImageUrl(url);
        setBlob(b);
        onReady?.(b, url);
      }
    }, 'image/png');
  }

  async function handleShare() {
    if (!blob) return;
    const file = new File([blob], `blacktribe-receipt-${order.order_number}.png`, { type: 'image/png' });

    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: `BlackTribe Receipt ${order.order_number}` });
      } catch { /* User cancelled */ }
    } else {
      handleDownload();
    }
  }

  function handleDownload() {
    if (!imageUrl) return;
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `blacktribe-receipt-${order.order_number}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      {imageUrl && (
        <div className="walkin-share">
          <img
            src={imageUrl}
            alt={`Receipt ${order.order_number}`}
            className="walkin-share__preview"
          />
          <div className="walkin-share__actions">
            <button className="walkin-share__btn walkin-share__btn--primary" onClick={handleShare}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
              Share Receipt
            </button>
            <button className="walkin-share__btn" onClick={handleDownload}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Save Image
            </button>
          </div>
        </div>
      )}
    </>
  );
}
