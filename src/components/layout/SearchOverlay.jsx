import { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router';
import useDebounce from '../../hooks/useDebounce';
import { searchProducts } from '../../utils/mockData';
import { formatPrice } from '../../utils/formatPrice';
import '../../styles/layout/SearchOverlay.css';

const MAX_RESULTS = 8;
const STORAGE_KEY = 'bt-recent-searches';

function getRecentSearches() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveRecentSearch(query) {
  try {
    const recent = getRecentSearches().filter((s) => s !== query);
    recent.unshift(query);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(recent.slice(0, 5)));
  } catch { /* sessionStorage unavailable */ }
}

export default function SearchOverlay({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 250);
  const inputRef = useRef(null);
  const [recentSearches, setRecentSearches] = useState([]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setRecentSearches(getRecentSearches());
      requestAnimationFrame(() => inputRef.current?.focus());
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const results = useMemo(() => {
    if (debouncedQuery.length < 2) return [];
    return searchProducts(debouncedQuery).slice(0, MAX_RESULTS);
  }, [debouncedQuery]);

  const handleResultClick = () => {
    if (query.trim()) saveRecentSearch(query.trim());
    setQuery('');
    onClose();
  };

  const clearRecent = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setRecentSearches([]);
  };

  if (!isOpen) return null;

  const showRecent = query.length < 2 && recentSearches.length > 0;
  const showResults = debouncedQuery.length >= 2;
  const noResults = showResults && results.length === 0;

  return (
    <div className="search-overlay" role="dialog" aria-modal="true" aria-label="Search">
      <div className="search-overlay-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="search-overlay-content">
        <div className="search-input-wrapper">
          <svg className="search-input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder="Search pieces..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search products"
            autoComplete="off"
          />
          <button className="search-close" onClick={onClose} aria-label="Close search" type="button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="search-body">
          {showRecent && (
            <div className="search-recent">
              <div className="search-recent-header">
                <span className="search-recent-label">Recent</span>
                <button className="search-recent-clear" onClick={clearRecent} type="button">Clear</button>
              </div>
              {recentSearches.map((term) => (
                <button key={term} className="search-recent-item" onClick={() => setQuery(term)} type="button">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                  </svg>
                  {term}
                </button>
              ))}
            </div>
          )}

          {showResults && !noResults && (
            <div className="search-results">
              {results.map((product) => (
                <Link key={product.id} to={`/product/${product.slug}`} className="search-result" onClick={handleResultClick}>
                  <div className="search-result-image">
                    <img src={product.images?.[0]} alt="" loading="lazy" />
                  </div>
                  <div className="search-result-info">
                    <span className="search-result-name">{product.name}</span>
                    <span className="search-result-price">{formatPrice(product.price)}</span>
                  </div>
                </Link>
              ))}
              {results.length >= MAX_RESULTS && (
                <Link
                  to={`/shop?search=${encodeURIComponent(query)}`}
                  className="search-view-all"
                  onClick={() => { if (query.trim()) saveRecentSearch(query.trim()); onClose(); }}
                >
                  View all results
                </Link>
              )}
            </div>
          )}

          {noResults && (
            <div className="search-no-results">
              <p className="search-no-results-text">No pieces match your search.</p>
              <button className="search-no-results-clear" onClick={() => setQuery('')} type="button">Clear Search</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
