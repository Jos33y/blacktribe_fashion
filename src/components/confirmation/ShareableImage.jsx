import { useRef, useEffect, useState } from 'react';

/**
 * ShareableImage v3 — Split composition lookbook card.
 *
 * Design: White product zone (~71%) + dark brand bar (~29%).
 * The product IS the image. Brand bar is tight and confident.
 * Adapts layout based on item count:
 *   1 item  → single product, full white zone
 *   2 items → side by side columns
 *   3 items → hero top row + 2 bottom
 *   4+ items → 2×2 grid, last cell badges remaining count
 *
 * 1080×1350 (Instagram feed/Stories compatible ratio)
 * No personal details: no price, email, or address.
 * Only: product images, BLACKTRIBE wordmark, order number.
 */
export default function ShareableImage({ orderNumber, items = [], onReady }) {
  const canvasRef = useRef(null);
  const [imageUrl, setImageUrl] = useState(null);
  const blobUrlRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !items.length) return;

    const ctx = canvas.getContext('2d');
    const W = 1080;
    const H = 1350;

    canvas.width = W;
    canvas.height = H;

    /* ─── Layout constants ─── */
    const PRODUCT_H = 960;
    const BAR_Y = PRODUCT_H;
    const BAR_H = H - PRODUCT_H;
    const PAD = 40;
    const GAP = 12;
    const ZONE_W = W - PAD * 2;
    const ZONE_H = PRODUCT_H - PAD * 2;

    /* ─── Image loading ─── */
    const loadImage = (src) =>
      new Promise((resolve) => {
        if (!src) return resolve(null);
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
      });

    const displayItems = items.slice(0, 4);
    const extraCount = Math.max(0, items.length - 4);

    /* Load product images + tribal mask logo in parallel */
    const logoPromise = loadImage('/logo_white.png');
    const productPromises = displayItems.map((item) => loadImage(item.image_url));

    Promise.all([logoPromise, ...productPromises]).then(
      ([logo, ...images]) => {
        render(ctx, W, H, PRODUCT_H, BAR_Y, BAR_H, PAD, GAP, ZONE_W, ZONE_H, images, displayItems.length, extraCount, orderNumber, logo, canvas);
      }
    );

    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [orderNumber, items, onReady]);

  /* ─── Cleanup blob URL on unmount ─── */
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, []);


  /* ═══════════════════════════════════════════════════════════
     RENDER — Main Canvas drawing function
     ═══════════════════════════════════════════════════════════ */

  function render(ctx, W, H, PRODUCT_H, BAR_Y, BAR_H, PAD, GAP, ZONE_W, ZONE_H, images, count, extraCount, orderNumber, logo, canvas) {

    /* ─── Product zone: white background ─── */
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, W, PRODUCT_H);


    /* ─── Draw products based on item count ─── */
    if (count === 1) {
      drawSingleProduct(ctx, images[0], PAD, PAD, ZONE_W, ZONE_H);

    } else if (count === 2) {
      const cellW = (ZONE_W - GAP) / 2;
      drawGridCell(ctx, images[0], PAD, PAD, cellW, ZONE_H);
      drawGridCell(ctx, images[1], PAD + cellW + GAP, PAD, cellW, ZONE_H);

    } else if (count === 3) {
      const cellH = (ZONE_H - GAP) / 2;
      const cellW = (ZONE_W - GAP) / 2;
      // Hero: first item spans full width
      drawGridCell(ctx, images[0], PAD, PAD, ZONE_W, cellH);
      // Bottom row: two items
      drawGridCell(ctx, images[1], PAD, PAD + cellH + GAP, cellW, cellH);
      drawGridCell(ctx, images[2], PAD + cellW + GAP, PAD + cellH + GAP, cellW, cellH);

    } else {
      const cellW = (ZONE_W - GAP) / 2;
      const cellH = (ZONE_H - GAP) / 2;
      drawGridCell(ctx, images[0], PAD, PAD, cellW, cellH);
      drawGridCell(ctx, images[1], PAD + cellW + GAP, PAD, cellW, cellH);
      drawGridCell(ctx, images[2], PAD, PAD + cellH + GAP, cellW, cellH);
      drawGridCell(ctx, images[3], PAD + cellW + GAP, PAD + cellH + GAP, cellW, cellH);

      // "+ X MORE" badge on last cell when more than 4 items
      if (extraCount > 0) {
        drawMoreBadge(
          ctx,
          PAD + cellW + GAP,
          PAD + cellH + GAP,
          cellW,
          cellH,
          extraCount,
        );
      }
    }


    /* ─── Brand bar: dark background ─── */
    ctx.fillStyle = '#0C0C0C';
    ctx.fillRect(0, BAR_Y, W, BAR_H);


    /* ─── Gradient divider between zones ─── */
    const divGrad = ctx.createLinearGradient(W * 0.2, BAR_Y, W * 0.8, BAR_Y);
    divGrad.addColorStop(0, 'rgba(58, 58, 58, 0)');
    divGrad.addColorStop(0.5, 'rgba(58, 58, 58, 0.8)');
    divGrad.addColorStop(1, 'rgba(58, 58, 58, 0)');
    ctx.strokeStyle = divGrad;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W * 0.2, BAR_Y + 0.5);
    ctx.lineTo(W * 0.8, BAR_Y + 0.5);
    ctx.stroke();


    /* ─── Tribal mask watermark (right side of brand bar) ─── */
    if (logo) {
      ctx.save();
      ctx.globalAlpha = 0.04;
      const logoH = 240;
      const logoW = logoH * (logo.width / logo.height);
      const logoX = W - logoW - 24;
      const logoY = BAR_Y + (BAR_H - logoH) / 2;
      ctx.drawImage(logo, logoX, logoY, logoW, logoH);
      ctx.restore();
    }


    /* ─── BLACKTRIBE wordmark ─── */
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#EDEBE8';
    ctx.font = '800 48px "Syne", "Helvetica Neue", Arial, sans-serif';
    setLetterSpacing(ctx, '14px');
    ctx.fillText('BLACKTRIBE', W / 2, BAR_Y + 155);
    setLetterSpacing(ctx, '0px');


    /* ─── Order number ─── */
    ctx.fillStyle = '#9B9894';
    ctx.font = '400 20px "DM Mono", "Courier New", monospace';
    setLetterSpacing(ctx, '3px');
    ctx.fillText(orderNumber || '', W / 2, BAR_Y + 210);
    setLetterSpacing(ctx, '0px');


    /* ─── Tagline (anchored near bottom) ─── */
    ctx.fillStyle = '#6A6662';
    ctx.font = '300 16px "Outfit", "Helvetica Neue", Arial, sans-serif';
    setLetterSpacing(ctx, '10px');
    ctx.fillText('REDEFINING LUXURY', W / 2, BAR_Y + BAR_H - 48);
    setLetterSpacing(ctx, '0px');


    /* ─── Generate blob ─── */
    canvas.toBlob((blob) => {
      if (blob) {
        // Revoke previous URL to prevent memory leaks
        if (blobUrlRef.current) {
          URL.revokeObjectURL(blobUrlRef.current);
        }
        const url = URL.createObjectURL(blob);
        blobUrlRef.current = url;
        setImageUrl(url);
        onReady?.(blob, url);
      }
    }, 'image/png');
  }


  /* ═══════════════════════════════════════════════════════════
     HELPERS
     ═══════════════════════════════════════════════════════════ */

  /**
   * Single product — fills the entire white zone.
   * No cell background (the zone is already white).
   */
  function drawSingleProduct(ctx, img, x, y, w, h) {
    if (!img) return;
    const pad = 24;
    drawImageFit(ctx, img, x + pad, y + pad, w - pad * 2, h - pad * 2);
  }

  /**
   * Grid cell — warm grey background with product image centered inside.
   * Used for multi-item layouts (2, 3, 4+).
   */
  function drawGridCell(ctx, img, x, y, w, h) {
    ctx.fillStyle = '#F5F3F0';
    ctx.fillRect(x, y, w, h);

    if (!img) return;
    const pad = 16;
    drawImageFit(ctx, img, x + pad, y + pad, w - pad * 2, h - pad * 2);
  }

  /**
   * Draw image maintaining aspect ratio, centered within the given area.
   */
  function drawImageFit(ctx, img, x, y, w, h) {
    const imgAspect = img.width / img.height;
    const areaAspect = w / h;
    let drawW, drawH;

    if (imgAspect > areaAspect) {
      // Image is wider than area — fit to width
      drawW = w;
      drawH = w / imgAspect;
    } else {
      // Image is taller than area — fit to height
      drawH = h;
      drawW = h * imgAspect;
    }

    const drawX = x + (w - drawW) / 2;
    const drawY = y + (h - drawH) / 2;
    ctx.drawImage(img, drawX, drawY, drawW, drawH);
  }

  /**
   * "+ X MORE" badge overlay on the last grid cell.
   * Semi-transparent dark strip at the bottom of the cell.
   */
  function drawMoreBadge(ctx, cellX, cellY, cellW, cellH, count) {
    const stripH = 56;
    const stripY = cellY + cellH - stripH;

    // Dark overlay strip at bottom of cell
    ctx.fillStyle = 'rgba(12, 12, 12, 0.78)';
    ctx.fillRect(cellX, stripY, cellW, stripH);

    // Badge text
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#EDEBE8';
    ctx.font = '500 20px "DM Mono", "Courier New", monospace';
    setLetterSpacing(ctx, '2px');
    ctx.fillText(`+ ${count} MORE`, cellX + cellW / 2, stripY + stripH / 2);
    setLetterSpacing(ctx, '0px');
    ctx.textBaseline = 'alphabetic';
  }

  /**
   * Safe letterSpacing setter.
   * ctx.letterSpacing is supported in Chrome 99+, Safari 16.4+, Firefox 116+.
   */
  function setLetterSpacing(ctx, value) {
    if ('letterSpacing' in ctx) {
      ctx.letterSpacing = value;
    }
  }


  /* ═══════════════════════════════════════════════════════════
     RENDER JSX
     ═══════════════════════════════════════════════════════════ */

  return (
    <>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      {imageUrl && (
        <div className="share-preview">
          <img
            src={imageUrl}
            alt={`Order ${orderNumber} — BlackTribe Fashion`}
            className="share-preview__image"
          />
        </div>
      )}
    </>
  );
}
