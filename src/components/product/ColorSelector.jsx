import '../../styles/product/ColorSelector.css';

export default function ColorSelector({ colors = [], selectedColor, onSelect }) {
  if (colors.length === 0) return null;

  return (
    <div className="color-selector" role="radiogroup" aria-label="Select color">
      <div className="color-selector-header">
        <span className="color-selector-label">Color</span>
        {selectedColor && (
          <span className="color-selector-selected">{selectedColor}</span>
        )}
      </div>
      <div className="color-selector-options">
        {colors.map((color) => (
          <button
            key={color.name}
            className={`color-option ${selectedColor === color.name ? 'color-option--active' : ''}`}
            onClick={() => onSelect(color.name)}
            role="radio"
            aria-checked={selectedColor === color.name}
            aria-label={color.name}
            type="button"
          >
            <span className="color-swatch" style={{ backgroundColor: color.hex }} />
          </button>
        ))}
      </div>
    </div>
  );
}
