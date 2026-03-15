import { useState, useRef, useCallback, useMemo } from 'react';
import Lightbox from './Lightbox';
import '../../styles/product/ImageGallery.css';

export default function ImageGallery({ images = [], videoUrl = null, productName = '' }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lens, setLens] = useState({ visible: false, x: 0, y: 0, bgX: 50, bgY: 50, src: '' });
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isSwiping = useRef(false);

  /* ─── Build unified media array (images + video) ─── */
  const media = useMemo(() => {
    const items = images.map(src => ({ type: 'image', src }));
    if (videoUrl) {
      items.push({ type: 'video', src: videoUrl, poster: images[0] || '' });
    }
    return items;
  }, [images, videoUrl]);

  if (media.length === 0) return null;

  const alt = (i) => `${productName || 'Product'} — view ${i + 1} of ${media.length}`;

  /* ─── Open lightbox ─── */
  const openLightbox = (index) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  /* ═══ ZOOM LENS (desktop only) ═══ */
  const handleMouseMove = (e, src) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const bgX = (x / rect.width) * 100;
    const bgY = (y / rect.height) * 100;

    setLens({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      bgX,
      bgY,
      src,
    });
  };

  const handleMouseLeave = (e) => {
    setLens(prev => ({ ...prev, visible: false }));
    // Reset tilt
    e.currentTarget.style.transform = '';
  };

  /* ═══ 3D TILT (desktop only) ═══ */
  const handleTiltMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    const tiltX = y * -5;
    const tiltY = x * 5;
    e.currentTarget.style.transform = `perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
  };

  /* ═══ MOBILE SWIPE ═══ */
  const handleTouchStart = (e) => {
    touchStartX.current = e.changedTouches[0].screenX;
    touchStartY.current = e.changedTouches[0].screenY;
    isSwiping.current = false;
  };

  const handleTouchMove = (e) => {
    const diffX = Math.abs(e.changedTouches[0].screenX - touchStartX.current);
    const diffY = Math.abs(e.changedTouches[0].screenY - touchStartY.current);
    if (diffX > diffY && diffX > 10) isSwiping.current = true;
  };

  const handleTouchEnd = (e) => {
    if (!isSwiping.current) return;
    const diff = touchStartX.current - e.changedTouches[0].screenX;
    if (diff > 50 && activeIndex < media.length - 1) setActiveIndex(i => i + 1);
    else if (diff < -50 && activeIndex > 0) setActiveIndex(i => i - 1);
  };

  /* ─── Tap to open lightbox on mobile ─── */
  const handleMobileTap = (e) => {
    if (isSwiping.current) return;
    openLightbox(activeIndex);
  };

  return (
    <div className="gallery" role="region" aria-label="Product images">

      {/* ═══ MOBILE: Swipeable carousel ═══ */}
      <div
        className="gallery-mobile"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="gallery-mobile-track"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {media.map((item, i) => (
            <div key={i} className="gallery-mobile-slide">
              <div className="gallery-mobile-canvas" onClick={handleMobileTap}>
                {item.type === 'video' ? (
                  <div className="gallery-video-poster">
                    <img
                      src={item.poster}
                      alt={`${productName} video`}
                      className="gallery-mobile-img"
                      draggable="false"
                    />
                    <div className="gallery-video-play-icon" aria-hidden="true">
                      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                        <circle cx="24" cy="24" r="23" stroke="currentColor" strokeWidth="1" opacity="0.8" />
                        <path d="M19 16l14 8-14 8V16z" fill="currentColor" />
                      </svg>
                    </div>
                  </div>
                ) : (
                  <img
                    src={item.src}
                    alt={alt(i)}
                    className="gallery-mobile-img"
                    draggable="false"
                    loading={i === 0 ? 'eager' : 'lazy'}
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        {media.length > 1 && (
          <div className="gallery-dots" role="tablist" aria-label="Image navigation">
            {media.map((_, i) => (
              <button
                key={i}
                className={`gallery-dot${i === activeIndex ? ' gallery-dot--active' : ''}`}
                onClick={() => setActiveIndex(i)}
                aria-label={`View ${i + 1}`}
                aria-selected={i === activeIndex}
                role="tab"
                type="button"
              />
            ))}
          </div>
        )}
      </div>


      {/* ═══ DESKTOP: Vertical scroll with zoom lens + tilt ═══ */}
      <div className="gallery-desktop">
        <div className="gallery-stack">
          {media.map((item, i) => (
            <div key={i} className="gallery-stack-item">
              {item.type === 'video' ? (
                <button
                  className="gallery-stack-canvas gallery-stack-canvas--video"
                  onClick={() => openLightbox(i)}
                  type="button"
                  aria-label="Play product video"
                >
                  <img
                    src={item.poster}
                    alt={`${productName} video`}
                    className="gallery-stack-img"
                    loading="lazy"
                  />
                  <div className="gallery-video-play-icon" aria-hidden="true">
                    <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                      <circle cx="28" cy="28" r="27" stroke="currentColor" strokeWidth="1" opacity="0.7" />
                      <path d="M22 18l16 10-16 10V18z" fill="currentColor" />
                    </svg>
                  </div>
                </button>
              ) : (
                <div
                  className="gallery-stack-canvas"
                  onMouseMove={(e) => {
                    handleMouseMove(e, item.src);
                    handleTiltMove(e);
                  }}
                  onMouseLeave={handleMouseLeave}
                  onClick={() => openLightbox(i)}
                  role="button"
                  tabIndex={0}
                  aria-label={`View ${productName} image ${i + 1} full size`}
                  onKeyDown={(e) => { if (e.key === 'Enter') openLightbox(i); }}
                >
                  <img
                    src={item.src}
                    alt={alt(i)}
                    className="gallery-stack-img"
                    loading={i === 0 ? 'eager' : 'lazy'}
                    draggable="false"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Zoom lens (rendered outside the stack to avoid clipping) */}
        {lens.visible && (
          <div
            className="gallery-lens"
            style={{
              left: lens.x,
              top: lens.y,
              backgroundImage: `url(${lens.src})`,
              backgroundPosition: `${lens.bgX}% ${lens.bgY}%`,
            }}
            aria-hidden="true"
          />
        )}
      </div>


      {/* ═══ LIGHTBOX ═══ */}
      {lightboxOpen && (
        <Lightbox
          media={media}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}
