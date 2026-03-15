import { useEffect, useRef, useCallback } from 'react';

export default function FilterDrawer({
  isOpen,
  onClose,
  categories = [],
  sizes = [],
  activeFilters = {},
  onFilterChange,
  onClearAll,
}) {
  const drawerRef = useRef(null);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  const toggleFilter = (type, value) => {
    const current = activeFilters[type] || [];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onFilterChange(type, updated);
  };

  const hasActiveFilters =
    Object.values(activeFilters).some((arr) => arr && arr.length > 0);

  return (
    <>
      {isOpen && (
        <div className="filter-overlay" onClick={onClose} aria-hidden="true" />
      )}
      <aside
        className={`filter-drawer ${isOpen ? 'filter-drawer--open' : ''}`}
        ref={drawerRef}
        role="dialog"
        aria-modal={isOpen}
        aria-label="Filter products"
      >
        <div className="filter-drawer-header">
          <h3 className="filter-drawer-title">Filter</h3>
          <button
            className="filter-drawer-close"
            onClick={onClose}
            aria-label="Close filters"
            type="button"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="filter-drawer-body">
          {/* Categories */}
          <div className="filter-section">
            <h4 className="filter-section-title">Category</h4>
            <div className="filter-options">
              {categories.map((cat) => (
                <button
                  key={cat.slug}
                  className={`filter-option ${
                    (activeFilters.category || []).includes(cat.slug)
                      ? 'filter-option--active'
                      : ''
                  }`}
                  onClick={() => toggleFilter('category', cat.slug)}
                  type="button"
                >
                  {cat.name}
                  <span className="filter-option-count">{cat.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sizes */}
          <div className="filter-section">
            <h4 className="filter-section-title">Size</h4>
            <div className="filter-size-grid">
              {sizes.map((size) => (
                <button
                  key={size}
                  className={`filter-size ${
                    (activeFilters.size || []).includes(size)
                      ? 'filter-size--active'
                      : ''
                  }`}
                  onClick={() => toggleFilter('size', size)}
                  type="button"
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="filter-section">
            <h4 className="filter-section-title">Price</h4>
            <div className="filter-options">
              {[
                { label: 'Under ₦25,000', value: '0-25000' },
                { label: '₦25,000 - ₦50,000', value: '25000-50000' },
                { label: '₦50,000 - ₦100,000', value: '50000-100000' },
                { label: 'Over ₦100,000', value: '100000-up' },
              ].map((range) => (
                <button
                  key={range.value}
                  className={`filter-option ${
                    (activeFilters.price || []).includes(range.value)
                      ? 'filter-option--active'
                      : ''
                  }`}
                  onClick={() => toggleFilter('price', range.value)}
                  type="button"
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="filter-drawer-footer">
          {hasActiveFilters && (
            <button
              className="filter-clear-btn"
              onClick={onClearAll}
              type="button"
            >
              Clear All
            </button>
          )}
          <button
            className="filter-apply-btn"
            onClick={onClose}
            type="button"
          >
            Apply
          </button>
        </div>
      </aside>
    </>
  );
}
