import { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router';
import Badge from '../ui/Badge';
import SizeSelector from './SizeSelector';
import QuantitySelector from './QuantitySelector';
import WishlistHeart from './WishlistHeart';
import { useToast } from '../ui/Toast';
import useCartStore from '../../store/cartStore';
import useUIStore from '../../store/uiStore';
import { formatPrice } from '../../utils/formatPrice';
import '../../styles/product/QuickView.css';
import '../../styles/product/WishlistHeart.css';

export default function QuickView({ product, isOpen, onClose }) {
  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [sizeError, setSizeError] = useState('');
  const touchStartY = useRef(0);
  const imgTouchStartX = useRef(0);

  const { addToast } = useToast();
  const addItem = useCartStore((s) => s.addItem);
  const openCartDrawer = useUIStore((s) => s.openCartDrawer);

  useEffect(() => {
    if (product) {
      setActiveImage(0);
      setSelectedSize('');
      setQuantity(1);
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

  /* ─── Stock for selected size ─── */
  const selectedSizeStock = useMemo(() => {
    if (!product?.sizes?.length || !selectedSize) return null;
    const sizeObj = product.sizes.find((s) => (s.size || s.name) === selectedSize);
    return sizeObj ? sizeObj.stock : null;
  }, [product, selectedSize]);

  const isSoldOut = useMemo(() => {
    if (!product?.sizes?.length) return false;
    return product.sizes.every((s) => s.stock === 0);
  }, [product]);

  /* Reset quantity on size change */
  useEffect(() => { setQuantity(1); }, [selectedSize]);

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
    if (isSoldOut) return;

    if (product?.sizes?.length > 0 && !selectedSize) {
      setSizeError('Select a size');
      return;
    }
    setSizeError('');

    const added = addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      size: selectedSize,
      color: product.colors?.[0]?.name || '',
      image: product.images?.[0] || '',
      badge: product.badge || null,
      quantity,
      maxStock: selectedSizeStock,
    });

    if (added) {
      onClose();
      addToast('Added to bag.', 'success');
      setTimeout(() => openCartDrawer(), 200);
    } else {
      addToast('Maximum stock reached for this size.', 'info');
    }
  };

  if (!product) return null;

  let btnLabel = 'Add to Bag';
  if (isSoldOut) btnLabel = 'Sold Out';
  else if (product.badge === 'PRE-ORDER') btnLabel = 'Pre-Order Now';

  return (
    <>
      <div
        className={`qv-backdrop ${isOpen ? 'qv-backdrop--visible' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`qv-panel ${isOpen ? 'qv-panel--open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={`Quick view: ${product.name}`}
      >
        <div className="qv-drag-zone" onTouchStart={handleDragStart} onTouchEnd={handleDragEnd}>
          <div className="qv-drag-bar" />
        </div>

        <div className="qv-header">
          <span className="qv-header-label">Quick View</span>
          <button className="qv-close" onClick={onClose} aria-label="Close" type="button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="qv-content">
          {/* Gallery */}
          <div className="qv-gallery">
            <div className="qv-image-main" onTouchStart={handleImgTouchStart} onTouchEnd={handleImgTouchEnd}>
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

          {/* Details */}
          <div className="qv-details">
            {product.badge && <div className="qv-badge"><Badge type={product.badge} /></div>}
            <div className="qv-name-row">
              <h2 className="qv-name">{product.name}</h2>
              <WishlistHeart productId={product.id} />
            </div>
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

            {/* Quantity — show when size is selected or no sizes */}
            {(!product.sizes?.length || selectedSize) && !isSoldOut && (
              <div className="qv-quantity">
                <QuantitySelector
                  quantity={quantity}
                  maxStock={selectedSizeStock}
                  onQuantityChange={setQuantity}
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="qv-actions">
            <button
              className={`qv-add-btn ${isSoldOut ? 'qv-add-btn--disabled' : ''}`}
              onClick={handleAddToBag}
              disabled={isSoldOut}
              type="button"
            >
              {btnLabel}
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
