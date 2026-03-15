import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import '../../styles/product/Lightbox.css';

function LightboxContent({ media = [], initialIndex = 0, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isClosing, setIsClosing] = useState(false);

  const containerRef = useRef(null);
  const touchStartRef = useRef({ x: 0, y: 0 });
  const pinchStartRef = useRef({ dist: 0, scale: 1 });
  const panStartRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const isPanning = useRef(false);
  const lastTapRef = useRef(0);
  const videoRef = useRef(null);

  const current = media[currentIndex];
  const isZoomed = scale > 1.05;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
    if (videoRef.current) videoRef.current.pause();
  }, [currentIndex]);

  const goNext = useCallback(() => {
    if (currentIndex < media.length - 1) setCurrentIndex(i => i + 1);
  }, [currentIndex, media.length]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) setCurrentIndex(i => i - 1);
  }, [currentIndex]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => onClose?.(), 250);
  }, [onClose]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') handleClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleClose, goNext, goPrev]);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    setScale(prev => Math.min(Math.max(prev - e.deltaY * 0.002, 1), 3));
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const getTouchDist = (touches) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      pinchStartRef.current = { dist: getTouchDist(e.touches), scale };
    } else if (e.touches.length === 1) {
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      if (isZoomed) {
        isPanning.current = true;
        panStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, tx: translate.x, ty: translate.y };
      }
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dist = getTouchDist(e.touches);
      const ratio = dist / pinchStartRef.current.dist;
      setScale(Math.min(Math.max(pinchStartRef.current.scale * ratio, 1), 3));
    } else if (e.touches.length === 1 && isPanning.current && isZoomed) {
      e.preventDefault();
      const dx = e.touches[0].clientX - panStartRef.current.x;
      const dy = e.touches[0].clientY - panStartRef.current.y;
      setTranslate({ x: panStartRef.current.tx + dx, y: panStartRef.current.ty + dy });
    }
  };

  const handleTouchEnd = (e) => {
    isPanning.current = false;
    if (e.changedTouches.length === 1 && !isZoomed) {
      const dx = touchStartRef.current.x - e.changedTouches[0].clientX;
      const dy = touchStartRef.current.y - e.changedTouches[0].clientY;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      if (absDy > 80 && absDy > absDx * 1.5 && dy < 0) { handleClose(); return; }
      if (absDx > 50 && absDx > absDy) { dx > 0 ? goNext() : goPrev(); }
    }
    if (scale <= 1.05) { setScale(1); setTranslate({ x: 0, y: 0 }); }
  };

  const handleDoubleTap = (e) => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      e.preventDefault();
      if (isZoomed) { setScale(1); setTranslate({ x: 0, y: 0 }); }
      else { setScale(2.5); }
    }
    lastTapRef.current = now;
  };

  const handleBackdropClick = (e) => {
    if (e.target === containerRef.current || e.target.classList.contains('lightbox-stage')) {
      handleClose();
    }
  };

  return (
    <div
      ref={containerRef}
      className={`lightbox${isClosing ? ' lightbox--closing' : ''}`}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
    >
      <button className="lightbox-close" onClick={handleClose} type="button" aria-label="Close viewer">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      <div className="lightbox-counter">
        <span>{currentIndex + 1}</span>
        <span className="lightbox-counter-sep">/</span>
        <span>{media.length}</span>
      </div>

      {currentIndex > 0 && (
        <button className="lightbox-arrow lightbox-arrow--prev" onClick={goPrev} type="button" aria-label="Previous">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      )}

      {currentIndex < media.length - 1 && (
        <button className="lightbox-arrow lightbox-arrow--next" onClick={goNext} type="button" aria-label="Next">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      )}

      <div
        className="lightbox-stage"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleDoubleTap}
      >
        {current?.type === 'video' ? (
          <video
            ref={videoRef}
            src={current.src}
            poster={current.poster}
            controls
            playsInline
            className="lightbox-video"
            style={{ transform: `scale(${scale}) translate(${translate.x / scale}px, ${translate.y / scale}px)` }}
          />
        ) : (
          <img
            src={current?.src}
            alt={`View ${currentIndex + 1} of ${media.length}`}
            className="lightbox-image"
            draggable="false"
            style={{ transform: `scale(${scale}) translate(${translate.x / scale}px, ${translate.y / scale}px)` }}
          />
        )}
      </div>

      {media.length > 1 && (
        <div className="lightbox-thumbs">
          {media.map((item, i) => (
            <button
              key={i}
              className={`lightbox-thumb${i === currentIndex ? ' lightbox-thumb--active' : ''}`}
              onClick={() => setCurrentIndex(i)}
              type="button"
              aria-label={`View ${item.type === 'video' ? 'video' : `image ${i + 1}`}`}
            >
              <img src={item.type === 'video' ? item.poster : item.src} alt="" className="lightbox-thumb-img" />
              {item.type === 'video' && (
                <span className="lightbox-thumb-play">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Lightbox(props) {
  return createPortal(<LightboxContent {...props} />, document.body);
}
