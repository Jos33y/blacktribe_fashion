import { useState } from 'react';

/**
 * ShareButtons v3
 * Two actions:
 *   "Save Image" — downloads PNG to device (always available)
 *   "Share" — native share sheet for direct posting (when Web Share API supported)
 * If Web Share API not available, only Save Image shows.
 */
export default function ShareButtons({ imageBlob, imageUrl, orderNumber }) {
  const [shared, setShared] = useState(false);

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
        setShared(true);
        setTimeout(() => setShared(false), 2500);
      } else {
        // Fallback: share without file
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

  return (
    <div className="oc-share-actions">
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

      {canShare && (
        <button
          className="oc-share-btn oc-share-btn--secondary"
          onClick={handleShare}
          type="button"
          disabled={!imageBlob}
        >
          {shared ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Shared
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
              Share
            </>
          )}
        </button>
      )}
    </div>
  );
}
