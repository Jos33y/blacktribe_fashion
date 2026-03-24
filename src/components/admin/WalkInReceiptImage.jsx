/*
 * BLACKTRIBE FASHION — WALK-IN RECEIPT IMAGE
 *
 * Canvas API generates a branded receipt image.
 * Staff can share via WhatsApp (Web Share API) or copy/save.
 *
 * Design: dark background, clean receipt layout.
 * 1080x1920 (9:16 Stories-compatible).
 * No personal details except order number.
 */

import { useRef, useEffect, useState } from 'react';

function formatNaira(kobo) {
  const naira = Math.round(kobo / 100);
  return '₦' + naira.toLocaleString('en-NG');
}

export default function WalkInReceiptImage({ order, items = [], onReady }) {
  const canvasRef = useRef(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [blob, setBlob] = useState(null);
  const blobUrlRef = useRef(null);

  useEffect(() => {
    if (!order || !items.length) return;
    generateImage();
  }, [order, items]);

  useEffect(() => {
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, []);

  function generateImage() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const W = 1080;
    const H = 1920;
    canvas.width = W;
    canvas.height = H;

    const PAD = 80;
    const CW = W - PAD * 2; /* content width */
    let y = 120;

    /* Background */
    ctx.fillStyle = '#0C0C0C';
    ctx.fillRect(0, 0, W, H);

    /* Helper: set letter spacing */
    function setSpacing(val) {
      if ('letterSpacing' in ctx) ctx.letterSpacing = val;
    }

    /* ─── BLACKTRIBE wordmark ─── */
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#EDEBE8';
    ctx.font = '800 42px "Syne", "Helvetica Neue", Arial, sans-serif';
    setSpacing('10px');
    ctx.fillText('BLACKTRIBE', W / 2, y);
    setSpacing('0px');
    y += 28;

    ctx.fillStyle = '#6A6662';
    ctx.font = '300 14px "Outfit", "Helvetica Neue", Arial, sans-serif';
    setSpacing('8px');
    ctx.fillText('FASHION', W / 2, y);
    setSpacing('0px');
    y += 60;

    /* ─── Dashed divider ─── */
    function drawDivider(yPos) {
      ctx.strokeStyle = '#2A2A2A';
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(PAD, yPos);
      ctx.lineTo(W - PAD, yPos);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    drawDivider(y);
    y += 40;

    /* ─── Order meta ─── */
    ctx.textAlign = 'left';
    ctx.fillStyle = '#6A6662';
    ctx.font = '400 18px "DM Mono", "Courier New", monospace';
    ctx.fillText('Order', PAD, y);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#EDEBE8';
    ctx.fillText(order.order_number || '', W - PAD, y);
    y += 32;

    ctx.textAlign = 'left';
    ctx.fillStyle = '#6A6662';
    ctx.fillText('Date', PAD, y);

    ctx.textAlign = 'right';
    const dateStr = new Date(order.created_at).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
    ctx.fillText(dateStr, W - PAD, y);
    y += 32;

    const paymentLabel = {
      cash: 'Cash', pos_terminal: 'POS Terminal', bank_transfer: 'Bank Transfer', paystack: 'Paystack',
    }[order.payment_method] || order.payment_method;

    ctx.textAlign = 'left';
    ctx.fillStyle = '#6A6662';
    ctx.fillText('Payment', PAD, y);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#EDEBE8';
    ctx.fillText(paymentLabel, W - PAD, y);
    y += 50;

    drawDivider(y);
    y += 40;

    /* ─── Items ─── */
    ctx.textAlign = 'left';
    items.forEach((item) => {
      /* Item name */
      ctx.fillStyle = '#EDEBE8';
      ctx.font = '500 22px "Outfit", "Helvetica Neue", Arial, sans-serif';
      const name = item.name || 'Product';
      const truncName = name.length > 32 ? name.slice(0, 30) + '...' : name;
      ctx.fillText(truncName, PAD, y);

      /* Price aligned right */
      ctx.textAlign = 'right';
      ctx.fillStyle = '#EDEBE8';
      ctx.font = '400 20px "DM Mono", "Courier New", monospace';
      ctx.fillText(formatNaira(item.price * item.quantity), W - PAD, y);
      y += 28;

      /* Size + quantity */
      ctx.textAlign = 'left';
      ctx.fillStyle = '#6A6662';
      ctx.font = '400 16px "DM Mono", "Courier New", monospace';
      ctx.fillText(`Size ${item.size}${item.quantity > 1 ? '  x' + item.quantity : ''}`, PAD, y);
      y += 40;
    });

    y += 10;
    drawDivider(y);
    y += 40;

    /* ─── Totals ─── */
    ctx.font = '400 20px "DM Mono", "Courier New", monospace';

    /* Subtotal */
    ctx.textAlign = 'left';
    ctx.fillStyle = '#9B9894';
    ctx.fillText('Subtotal', PAD, y);
    ctx.textAlign = 'right';
    ctx.fillText(formatNaira(order.subtotal), W - PAD, y);
    y += 36;

    /* Discount */
    if (order.discount_amount > 0) {
      ctx.textAlign = 'left';
      ctx.fillStyle = '#4ADE80';
      ctx.fillText('Discount', PAD, y);
      ctx.textAlign = 'right';
      ctx.fillText('-' + formatNaira(order.discount_amount), W - PAD, y);
      y += 36;
    }

    /* Divider before total */
    ctx.strokeStyle = '#3A3A3A';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD, y);
    ctx.lineTo(W - PAD, y);
    ctx.stroke();
    y += 36;

    /* Total */
    ctx.textAlign = 'left';
    ctx.fillStyle = '#EDEBE8';
    ctx.font = '600 28px "Outfit", "Helvetica Neue", Arial, sans-serif';
    ctx.fillText('Total', PAD, y);
    ctx.textAlign = 'right';
    ctx.font = '500 28px "DM Mono", "Courier New", monospace';
    ctx.fillText(formatNaira(order.total), W - PAD, y);
    y += 80;

    drawDivider(y);
    y += 60;

    /* ─── Thank you ─── */
    ctx.textAlign = 'center';
    ctx.fillStyle = '#9B9894';
    ctx.font = '300 20px "Outfit", "Helvetica Neue", Arial, sans-serif';
    ctx.fillText('Thank you for shopping with BlackTribe.', W / 2, y);
    y += 50;

    /* ─── URL ─── */
    ctx.fillStyle = '#6A6662';
    ctx.font = '400 16px "DM Mono", "Courier New", monospace';
    setSpacing('3px');
    ctx.fillText('blacktribefashion.com', W / 2, y);
    setSpacing('0px');

    /* ─── Tagline at bottom ─── */
    ctx.fillStyle = '#3A3A3A';
    ctx.font = '300 14px "Outfit", "Helvetica Neue", Arial, sans-serif';
    setSpacing('8px');
    ctx.fillText('REDEFINING LUXURY', W / 2, H - 80);
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
        await navigator.share({
          files: [file],
          title: `BlackTribe Receipt ${order.order_number}`,
        });
      } catch {
        /* User cancelled or share failed — silent */
      }
    } else {
      /* Fallback: download */
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
              Share via WhatsApp
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
