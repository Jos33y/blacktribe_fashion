import { useState, useRef, useEffect } from 'react';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

export default function SortDropdown({ value = 'newest', onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentLabel = SORT_OPTIONS.find((o) => o.value === value)?.label || 'Newest';

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') setIsOpen(false);
  };

  return (
    <div className="sort-dropdown" ref={dropdownRef} onKeyDown={handleKeyDown}>
      <button
        className="sort-dropdown-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        type="button"
      >
        <span className="sort-dropdown-label">Sort:</span>
        <span className="sort-dropdown-value">{currentLabel}</span>
        <svg
          className={`sort-dropdown-icon ${isOpen ? 'sort-dropdown-icon--open' : ''}`}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <ul className="sort-dropdown-menu" role="listbox" aria-label="Sort options">
          {SORT_OPTIONS.map((option) => (
            <li key={option.value} role="option" aria-selected={value === option.value}>
              <button
                className={`sort-dropdown-item ${
                  value === option.value ? 'sort-dropdown-item--active' : ''
                }`}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                type="button"
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
