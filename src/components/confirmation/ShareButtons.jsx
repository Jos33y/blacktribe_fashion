import { useState } from 'react';

/**
 * ShareButtons v2
 * Mobile: "Share" via Web Share API (opens native share sheet → Instagram Stories)
 * Desktop: "Save Image" downloads to disk, "Copy Image" copies to clipboard
 */
export default function ShareButtons({ imageBlob, imageUrl, orderNumber }) {
  const [copied, setCopied] = useState(false);

  const canShare = typeof navigator.share === 'function' && typeof navigator.canShare === 'function';

  const handleShare = async () => {
    if (!imageBlob) return;

    try {
      const file = new File([imageBlob], `blacktribe-${orderNumber}.png`, { type: 'image/png' });

      const shareData = {
        files: [file],
        title: 'BlackTribe Fashion',
        text: `${orderNumber} — BlackTribe Fashion`,
      };

      if (navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.share({
          title: 'BlackTribe Fashion',
          text: `Just ordered from BlackTribe Fashion.`,
          url: 'https://blacktribefashion.com',
        });
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('[share] Error:', err);
      }
    }
  };

  const handleSave = () => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `blacktribe-${orderNumber}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopy = async () => {
    if (!imageBlob) return;

    try {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': imageBlob }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback: download instead
      handleSave();
    }
  };

  return (
    <div className="oc-share-actions">
      {canShare ? (
        /* Mobile: single share button that opens native sheet */
        <button
          className="oc-share-btn oc-share-btn--primary"
          onClick={handleShare}
          type="button"
          disabled={!imageBlob}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
          Share
        </button>
      ) : (
        /* Desktop: save + copy */
        <>
          <button
            className="oc-share-btn oc-share-btn--primary"
            onClick={handleSave}
            type="button"
            disabled={!imageBlob}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Save Image
          </button>
          <button
            className="oc-share-btn oc-share-btn--secondary"
            onClick={handleCopy}
            type="button"
            disabled={!imageBlob}
          >
            {copied ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Copied
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
                Copy Image
              </>
            )}
          </button>
        </>
      )}
    </div>
  );
}
