import { useState, useRef } from 'react';
import { Link } from 'react-router';
import { formatPrice } from '../../utils/formatPrice';
import QuantitySelector from '../product/QuantitySelector';
import useCartStore from '../../store/cartStore';
import useUIStore from '../../store/uiStore';

export default function CartItem({ item }) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const closeCartDrawer = useUIStore((s) => s.closeCartDrawer);
  const [swiped, setSwiped] = useState(false);
  const touchStartX = useRef(0);

  const handleTouchStart = (e) => {
    touchStartX.current = e.changedTouches[0].screenX;
    setSwiped(false);
  };

  const handleTouchEnd = (e) => {
    const diff = touchStartX.current - e.changedTouches[0].screenX;
    if (diff > 80) setSwiped(true);
    else if (diff < -40) setSwiped(false);
  };

  const handleRemove = () => removeItem(item.productId, item.size);
  const lineTotal = item.price * item.quantity;

  return (
    <div
      className={`cart-item ${swiped ? 'cart-item--swiped' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Swipe delete zone */}
      <button
        className="cart-item__delete-zone"
        onClick={handleRemove}
        aria-label={`Remove ${item.name}`}
        type="button"
      >
        Remove
      </button>

      {/* Main content */}
      <div className="cart-item__content">
        <Link
          to={`/product/${item.slug}`}
          className="cart-item__image-link"
          onClick={closeCartDrawer}
          aria-label={item.name}
        >
          <div className="cart-item__image-wrap">
            <img src={item.image} alt={item.name} className="cart-item__image" loading="lazy" />
          </div>
        </Link>

        <div className="cart-item__details">
          <Link to={`/product/${item.slug}`} className="cart-item__name" onClick={closeCartDrawer}>
            {item.name}
          </Link>

          <div className="cart-item__meta">
            {item.size && <span>{item.size}</span>}
            {item.size && item.color && <span className="cart-item__sep">/</span>}
            {item.color && <span>{item.color}</span>}
          </div>

          <p className="cart-item__price">{formatPrice(lineTotal)}</p>

          <div className="cart-item__qty">
            <QuantitySelector
              quantity={item.quantity}
              maxStock={item.maxStock}
              onQuantityChange={(qty) => updateQuantity(item.productId, item.size, qty)}
              compact
            />
          </div>
        </div>

        {/* Desktop remove */}
        <button
          className="cart-item__remove"
          onClick={handleRemove}
          aria-label={`Remove ${item.name}`}
          type="button"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
