import '../../styles/product/QuantitySelector.css';

export default function QuantitySelector({ quantity, maxStock, onQuantityChange, compact = false }) {
  const atMin = quantity <= 1;
  const atMax = maxStock != null && quantity >= maxStock;

  return (
    <div className={`qty-selector ${compact ? 'qty-selector--compact' : ''}`}>
      {!compact && (
        <span className="qty-selector__label">Qty</span>
      )}
      <div className="qty-selector__controls">
        <button
          className="qty-selector__btn"
          onClick={() => !atMin && onQuantityChange(quantity - 1)}
          disabled={atMin}
          aria-label="Decrease quantity"
          type="button"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <span className="qty-selector__value" aria-label={`Quantity: ${quantity}`}>
          {quantity}
        </span>
        <button
          className="qty-selector__btn"
          onClick={() => !atMax && onQuantityChange(quantity + 1)}
          disabled={atMax}
          aria-label={atMax ? 'Maximum quantity reached' : 'Increase quantity'}
          type="button"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>
      {atMax && maxStock != null && (
        <span className="qty-selector__limit">Max {maxStock}</span>
      )}
    </div>
  );
}
