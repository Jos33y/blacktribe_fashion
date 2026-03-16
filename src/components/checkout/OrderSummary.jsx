import { useState } from 'react';
import { formatPrice } from '../../utils/formatPrice';
import DiscountInput from './DiscountInput';
import useCartStore from '../../store/cartStore';

export default function OrderSummary({
  shipping = 0,
  discountAmount = 0,
  appliedDiscount = null,
  onApplyDiscount,
  onRemoveDiscount,
}) {
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.getSubtotal());
  const itemCount = useCartStore((s) => s.getItemCount());
  const [expanded, setExpanded] = useState(true);

  const total = subtotal + shipping - discountAmount;

  return (
    <div className="checkout-summary">
      <button
        className="checkout-summary__toggle"
        onClick={() => setExpanded(!expanded)}
        type="button"
        aria-expanded={expanded}
      >
        <span className="checkout-summary__toggle-label">
          Order Summary ({itemCount} {itemCount === 1 ? 'piece' : 'pieces'})
        </span>
        <svg
          className={`checkout-summary__chevron ${expanded ? 'checkout-summary__chevron--up' : ''}`}
          width="16" height="16" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {expanded && (
        <div className="checkout-summary__items">
          {items.map((item) => (
            <div className="checkout-summary__item" key={`${item.productId}::${item.size}`}>
              <div className="checkout-summary__item-image">
                <img src={item.image} alt={item.name} loading="lazy" />
                {item.quantity > 1 && (
                  <span className="checkout-summary__item-qty">{item.quantity}</span>
                )}
              </div>
              <div className="checkout-summary__item-info">
                <span className="checkout-summary__item-name">{item.name}</span>
                <span className="checkout-summary__item-meta">
                  {item.size}{item.size && item.color ? ' / ' : ''}{item.color}
                </span>
              </div>
              <span className="checkout-summary__item-price">
                {formatPrice(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>
      )}

      {onApplyDiscount && (
        <div className="checkout-summary__discount">
          <DiscountInput
            onApply={onApplyDiscount}
            onRemove={onRemoveDiscount}
            appliedCode={appliedDiscount?.code}
            discountDisplay={discountAmount > 0 ? `You save ${formatPrice(discountAmount)}` : ''}
          />
        </div>
      )}

      <div className="checkout-summary__totals">
        <div className="checkout-summary__row">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="checkout-summary__row">
          <span>Shipping</span>
          <span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
        </div>
        {discountAmount > 0 && (
          <div className="checkout-summary__row checkout-summary__row--discount">
            <span>Discount</span>
            <span>-{formatPrice(discountAmount)}</span>
          </div>
        )}
        <div className="checkout-summary__row checkout-summary__row--total">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>
    </div>
  );
}
