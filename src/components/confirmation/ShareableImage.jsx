import { useRef, useEffect, useState } from 'react';

/**
 * ShareableImage v2 — branded Stories card.
 *
 * Design philosophy: The product IS the image.
 * Not a product photo on a white square inside a dark rectangle.
 * Full-bleed dark canvas. Product large and centered.
 * BLACKTRIBE wordmark + order number as subtle overlays.
 * Like a campaign image with a receipt watermark.
 *
 * 1080×1350 (Instagram feed/Stories compatible ratio)
 */
export default function ShareableImage({ orderNumber, productImage, productName, onReady }) {
  const canvasRef = useRef(null);
  const [imageUrl, setImageUrl] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const W = 1080;
    const H = 1350;

    canvas.width = W;
    canvas.height = H;

    const render = (img) => {
      // ─── Dark background ───
      ctx.fillStyle = '#0C0C0C';
      ctx.fillRect(0, 0, W, H);

      // ─── Product image: large, centered, on white canvas ───
      if (img) {
        const imgPadding = 80;
        const maxImgW = W - imgPadding * 2;
        const maxImgH = H - 360; // Leave room for text above and below

        // White product canvas
        const canvasW = maxImgW;
        const canvasH = maxImgH;
        const canvasX = (W - canvasW) / 2;
        const canvasY = 160;

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(canvasX, canvasY, canvasW, canvasH);

        // Draw product image maintaining aspect ratio, filling the white area
        const imgAspect = img.width / img.height;
        const areaAspect = canvasW / canvasH;
        let drawW, drawH, drawX, drawY;

        const innerPad = 48;

        if (imgAspect > areaAspect) {
          // Image is wider — fit to width
          drawW = canvasW - innerPad * 2;
          drawH = drawW / imgAspect;
        } else {
          // Image is taller — fit to height
          drawH = canvasH - innerPad * 2;
          drawW = drawH * imgAspect;
        }

        drawX = canvasX + (canvasW - drawW) / 2;
        drawY = canvasY + (canvasH - drawH) / 2;

        ctx.drawImage(img, drawX, drawY, drawW, drawH);

        // ─── Subtle gradient overlay at bottom of white area ───
        const grad = ctx.createLinearGradient(0, canvasY + canvasH - 120, 0, canvasY + canvasH);
        grad.addColorStop(0, 'rgba(255,255,255,0)');
        grad.addColorStop(1, 'rgba(255,255,255,0.9)');
        ctx.fillStyle = grad;
        ctx.fillRect(canvasX, canvasY + canvasH - 120, canvasW, 120);
      }

      // ─── BLACKTRIBE wordmark (top, large, confident) ───
      ctx.textAlign = 'center';
      ctx.fillStyle = '#EDEBE8';
      ctx.font = '800 42px "Syne", "Helvetica Neue", sans-serif';
      ctx.letterSpacing = '8px';
      ctx.fillText('BLACKTRIBE', W / 2, 100);

      // ─── Thin accent line below wordmark ───
      ctx.strokeStyle = '#3A3A3A';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(W / 2 - 40, 120);
      ctx.lineTo(W / 2 + 40, 120);
      ctx.stroke();

      // ─── Product name (bottom area, clean) ───
      const nameText = (productName || '').toUpperCase();
      ctx.fillStyle = '#EDEBE8';
      ctx.font = '500 22px "Outfit", "Helvetica Neue", sans-serif';
      ctx.letterSpacing = '4px';
      ctx.fillText(nameText, W / 2, H - 150);

      // ─── Order number ───
      ctx.fillStyle = '#6A6662';
      ctx.font = '400 16px "DM Mono", "Courier New", monospace';
      ctx.letterSpacing = '2px';
      ctx.fillText(orderNumber || '', W / 2, H - 110);

      // ─── Tagline ───
      ctx.fillStyle = '#2A2A2A';
      ctx.font = '300 13px "Outfit", "Helvetica Neue", sans-serif';
      ctx.letterSpacing = '8px';
      ctx.fillText('REDEFINING LUXURY', W / 2, H - 60);

      // ─── Subtle corner border (premium feel) ───
      const cornerLen = 40;
      const margin = 32;
      ctx.strokeStyle = '#2A2A2A';
      ctx.lineWidth = 1;

      // Top-left
      ctx.beginPath();
      ctx.moveTo(margin, margin + cornerLen);
      ctx.lineTo(margin, margin);
      ctx.lineTo(margin + cornerLen, margin);
      ctx.stroke();

      // Top-right
      ctx.beginPath();
      ctx.moveTo(W - margin - cornerLen, margin);
      ctx.lineTo(W - margin, margin);
      ctx.lineTo(W - margin, margin + cornerLen);
      ctx.stroke();

      // Bottom-left
      ctx.beginPath();
      ctx.moveTo(margin, H - margin - cornerLen);
      ctx.lineTo(margin, H - margin);
      ctx.lineTo(margin + cornerLen, H - margin);
      ctx.stroke();

      // Bottom-right
      ctx.beginPath();
      ctx.moveTo(W - margin - cornerLen, H - margin);
      ctx.lineTo(W - margin, H - margin);
      ctx.lineTo(W - margin, H - margin - cornerLen);
      ctx.stroke();

      // ─── Generate blob ───
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          setImageUrl(url);
          onReady?.(blob, url);
        }
      }, 'image/png');
    };

    // ─── Load product image ───
    if (productImage) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => render(img);
      img.onerror = () => render(null);
      img.src = productImage;
    } else {
      render(null);
    }
  }, [orderNumber, productImage, productName, onReady]);

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
