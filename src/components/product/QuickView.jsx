import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router';
import Badge from '../ui/Badge';
import SizeSelector from './SizeSelector';
import { formatPrice } from '../../utils/formatPrice';
import '../../styles/product/QuickView.css';

export default function QuickView({ product, isOpen, onClose }) {
  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [sizeError, setSizeError] = useState('');
  const touchStartY = useRef(0);
  const imgTouchStartX = useRef(0);

  useEffect(() => {
    if (product) {
      setActiveImage(0);
      setSelectedSize('');
      setSizeError('');
    }
  }, [product?.id]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
      document.addEventListener('keydown', handleKey);
      return () => {
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleKey);
      };
    }
  }, [isOpen, onClose]);

  const handleDragStart = (e) => { touchStartY.current = e.changedTouches[0].screenY; };
  const handleDragEnd = (e) => {
    if (e.changedTouches[0].screenY - touchStartY.current > 100) onClose();
  };

  const handleImgTouchStart = (e) => { imgTouchStartX.current = e.changedTouches[0].screenX; };
  const handleImgTouchEnd = (e) => {
    if (!product?.images) return;
    const diff = imgTouchStartX.current - e.changedTouches[0].screenX;
    if (diff > 50 && activeImage < product.images.length - 1) setActiveImage((p) => p + 1);
    else if (diff < -50 && activeImage > 0) setActiveImage((p) => p - 1);
  };

  const handleAddToBag = () => {
    if (product?.sizes?.length > 0 && !selectedSize) {
      setSizeError('Select a size');
      return;
    }
    setSizeError('');
    console.log('Quick add:', { product: product?.id, size: selectedSize });
    onClose();
  };

  if (!product) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`qv-backdrop ${isOpen ? 'qv-backdrop--visible' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        className={`qv-panel ${isOpen ? 'qv-panel--open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={`Quick view: ${product.name}`}
      >
        {/* Drag zone (mobile only) */}
        <div className="qv-drag-zone" onTouchStart={handleDragStart} onTouchEnd={handleDragEnd}>
          <div className="qv-drag-bar" />
        </div>

        {/* Header bar — gives the panel identity */}
        <div className="qv-header">
          <span className="qv-header-label">Quick View</span>
          <button className="qv-close" onClick={onClose} aria-label="Close" type="button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="qv-content">
          {/* Gallery */}
          <div className="qv-gallery">
            <div
              className="qv-image-main"
              onTouchStart={handleImgTouchStart}
              onTouchEnd={handleImgTouchEnd}
            >
              <img src={product.images?.[activeImage]} alt={product.name} className="qv-image" draggable="false" />
            </div>

            {product.images?.length > 1 && (
              <div className="qv-thumbs">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    className={`qv-thumb ${i === activeImage ? 'qv-thumb--active' : ''}`}
                    onClick={() => setActiveImage(i)}
                    aria-label={`Image ${i + 1}`}
                    type="button"
                  >
                    <img src={img} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product details */}
          <div className="qv-details">
            {product.badge && <div className="qv-badge"><Badge type={product.badge} /></div>}

            <h2 className="qv-name">{product.name}</h2>
            <p className="qv-price">{formatPrice(product.price)}</p>

            {(product.short_description || product.shortDescription) && (
              <p className="qv-description">{product.short_description || product.shortDescription}</p>
            )}

            {product.sizes?.length > 0 && (
              <>
                <SizeSelector
                  sizes={product.sizes}
                  selectedSize={selectedSize}
                  onSelect={(size) => { setSelectedSize(size); setSizeError(''); }}
                />
                {sizeError && <p className="qv-size-error" role="alert">{sizeError}</p>}
              </>
            )}
          </div>

          {/* Actions — pinned feel at bottom */}
          <div className="qv-actions">
            <button className="qv-add-btn" onClick={handleAddToBag} type="button">
              {product.badge === 'PRE-ORDER' ? 'Pre-Order Now' : 'Add to Bag'}
            </button>

            <Link to={`/product/${product.slug}`} className="qv-details-link" onClick={onClose}>
              View Full Details
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
