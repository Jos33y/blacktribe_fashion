import '../../styles/product/SizeSelector.css';

export default function SizeSelector({ sizes = [], selectedSize, onSelect }) {
  if (sizes.length === 0) return null;

  return (
    <div className="size-selector" role="radiogroup" aria-label="Select size">
      <div className="size-selector-header">
        <span className="size-selector-label">Size</span>
        {selectedSize && (
          <span className="size-selector-selected">{selectedSize}</span>
        )}
      </div>
      <div className="size-selector-grid">
        {sizes.map((size, index) => {
          const sizeName = size.size || size.name;
          const isOutOfStock = size.stock === 0;
          const isSelected = selectedSize === sizeName;
          return (
            <button
              key={sizeName || index}
              className={`size-option ${isSelected ? 'size-option--active' : ''} ${isOutOfStock ? 'size-option--disabled' : ''}`}
              onClick={() => !isOutOfStock && onSelect(sizeName)}
              disabled={isOutOfStock}
              role="radio"
              aria-checked={isSelected}
              aria-label={`Size ${sizeName}${isOutOfStock ? ' - sold out' : ''}`}
              type="button"
            >
              {sizeName}
              {isOutOfStock && <span className="size-option-slash" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
