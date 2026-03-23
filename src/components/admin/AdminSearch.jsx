/*
 * BLACKTRIBE FASHION — ADMIN SEARCH (Command Palette)
 *
 * Triggered by: Ctrl+K / Cmd+K or topbar search button.
 * Searches: products, orders, customers simultaneously.
 * Keyboard navigable: arrow keys, Enter to go, Escape to close.
 * Recent searches stored in localStorage.
 *
 * Design: centered overlay with large input, grouped results.
 * Inspired by Linear, Raycast, Spotlight. Zero AI aesthetics.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';
import useAuthStore from '../../store/authStore';
import '../../styles/admin/admin-search.css';

/* ═══ ICONS ═══ */

const SI = {
  search: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  product: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
      <circle cx="7" cy="7" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  order: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 8l-2-4H5L3 8" /><path d="M3 8h18v11a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
      <path d="M12 12v4" />
    </svg>
  ),
  customer: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  ),
  arrow: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  clock: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  enter: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="9 10 4 15 9 20" /><path d="M20 4v7a4 4 0 01-4 4H4" />
    </svg>
  ),
};


/* ═══ HELPERS ═══ */

function formatPrice(kobo) {
  if (!kobo && kobo !== 0) return '₦0';
  return '₦' + Math.floor(kobo / 100).toLocaleString('en-NG');
}

const RECENT_KEY = 'bt-admin-recent-searches';
const MAX_RECENT = 5;

function getRecentSearches() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY)) || [];
  } catch { return []; }
}

function saveRecentSearch(query) {
  try {
    const recent = getRecentSearches().filter((s) => s !== query);
    recent.unshift(query);
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
  } catch { /* silent */ }
}

function clearRecentSearches() {
  try { localStorage.removeItem(RECENT_KEY); } catch { /* silent */ }
}


/* ═══ COMPONENT ═══ */

export default function AdminSearch({ isOpen, onClose }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState([]);

  /* Flatten results for keyboard navigation */
  const flatItems = [];
  if (results) {
    results.products.forEach((p) => flatItems.push({ type: 'product', data: p }));
    results.orders.forEach((o) => flatItems.push({ type: 'order', data: o }));
    results.customers.forEach((c) => flatItems.push({ type: 'customer', data: c }));
  }

  /* Focus input on open */
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults(null);
      setActiveIndex(-1);
      setRecentSearches(getRecentSearches());
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  /* Search with debounce */
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults(null);
      setActiveIndex(-1);
      return;
    }

    const timer = setTimeout(() => doSearch(), 250);
    return () => clearTimeout(timer);
  }, [query]);

  async function doSearch() {
    setLoading(true);
    try {
      const token = await useAuthStore.getState().getAccessToken();
      const res = await fetch(`/api/admin/search?q=${encodeURIComponent(query.trim())}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setResults(json.data);
        setActiveIndex(-1);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }

  /* Navigate to result */
  const goTo = useCallback((type, data) => {
    saveRecentSearch(query.trim());

    switch (type) {
      case 'product':
        navigate(`/admin/products/${data.id}/edit`);
        break;
      case 'order':
        navigate(`/admin/orders/${data.id}`);
        break;
      case 'customer':
        navigate(`/admin/customers`);
        break;
      default:
        break;
    }
    onClose();
  }, [navigate, onClose, query]);

  /* Use recent search */
  function useRecent(term) {
    setQuery(term);
    inputRef.current?.focus();
  }

  /* Keyboard navigation */
  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      onClose();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, flatItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < flatItems.length) {
        const item = flatItems[activeIndex];
        goTo(item.type, item.data);
      }
    }
  }

  /* Scroll active item into view */
  useEffect(() => {
    if (activeIndex < 0) return;
    const el = listRef.current?.querySelector(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  if (!isOpen) return null;

  const hasResults = results && (results.products.length || results.orders.length || results.customers.length);
  const noResults = results && !results.products.length && !results.orders.length && !results.customers.length;
  let itemIndex = -1;

  return (
    <>
      <div className="cmd-backdrop" onClick={onClose} />
      <div className="cmd" role="dialog" aria-label="Search" onKeyDown={handleKeyDown}>

        {/* Input */}
        <div className="cmd__input-wrap">
          <div className="cmd__input-icon">{SI.search}</div>
          <input
            ref={inputRef}
            className="cmd__input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, orders, customers..."
            autoComplete="off"
            spellCheck="false"
          />
          <div className="cmd__input-hints">
            {loading && <span className="cmd__loading" />}
            <kbd className="cmd__kbd">ESC</kbd>
          </div>
        </div>

        {/* Results */}
        <div className="cmd__body" ref={listRef}>

          {/* Recent searches (shown when no query) */}
          {!query.trim() && recentSearches.length > 0 && (
            <div className="cmd__section">
              <div className="cmd__section-header">
                <span>Recent</span>
                <button className="cmd__clear-recent" onClick={() => { clearRecentSearches(); setRecentSearches([]); }}>Clear</button>
              </div>
              {recentSearches.map((term, i) => (
                <button key={i} className="cmd__item cmd__item--recent" onClick={() => useRecent(term)}>
                  <span className="cmd__item-icon">{SI.clock}</span>
                  <span className="cmd__item-label">{term}</span>
                  {SI.arrow}
                </button>
              ))}
            </div>
          )}

          {/* Empty query hint */}
          {!query.trim() && recentSearches.length === 0 && (
            <div className="cmd__empty">
              <p>Type to search across products, orders, and customers.</p>
              <div className="cmd__shortcuts">
                <span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
                <span><kbd className="cmd__kbd--inline">{SI.enter}</kbd> Select</span>
                <span><kbd>ESC</kbd> Close</span>
              </div>
            </div>
          )}

          {/* No results */}
          {noResults && query.trim() && (
            <div className="cmd__empty">
              <p>No results for "{query}"</p>
            </div>
          )}

          {/* Products */}
          {hasResults && results.products.length > 0 && (
            <div className="cmd__section">
              <div className="cmd__section-header"><span>Products</span></div>
              {results.products.map((p) => {
                itemIndex++;
                const idx = itemIndex;
                return (
                  <button
                    key={p.id}
                    className={`cmd__item ${activeIndex === idx ? 'cmd__item--active' : ''}`}
                    data-index={idx}
                    onClick={() => goTo('product', p)}
                    onMouseEnter={() => setActiveIndex(idx)}
                  >
                    <span className="cmd__item-icon cmd__item-icon--product">{SI.product}</span>
                    {p.image && <img src={p.image} alt="" className="cmd__item-thumb" />}
                    <div className="cmd__item-content">
                      <span className="cmd__item-label">{p.name}</span>
                      <span className="cmd__item-meta">
                        {formatPrice(p.price)}
                        {!p.is_active && <span className="cmd__item-badge cmd__item-badge--inactive">Inactive</span>}
                        {p.badge && <span className="cmd__item-badge">{p.badge}</span>}
                      </span>
                    </div>
                    <span className="cmd__item-action">{SI.arrow}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Orders */}
          {hasResults && results.orders.length > 0 && (
            <div className="cmd__section">
              <div className="cmd__section-header"><span>Orders</span></div>
              {results.orders.map((o) => {
                itemIndex++;
                const idx = itemIndex;
                return (
                  <button
                    key={o.id}
                    className={`cmd__item ${activeIndex === idx ? 'cmd__item--active' : ''}`}
                    data-index={idx}
                    onClick={() => goTo('order', o)}
                    onMouseEnter={() => setActiveIndex(idx)}
                  >
                    <span className="cmd__item-icon cmd__item-icon--order">{SI.order}</span>
                    <div className="cmd__item-content">
                      <span className="cmd__item-label">{o.order_number}</span>
                      <span className="cmd__item-meta">
                        {formatPrice(o.total)}
                        <span className={`cmd__item-status cmd__item-status--${o.status}`}>{o.status}</span>
                        {o.email && <span className="cmd__item-email">{o.email}</span>}
                      </span>
                    </div>
                    <span className="cmd__item-action">{SI.arrow}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Customers */}
          {hasResults && results.customers.length > 0 && (
            <div className="cmd__section">
              <div className="cmd__section-header"><span>Customers</span></div>
              {results.customers.map((c) => {
                itemIndex++;
                const idx = itemIndex;
                return (
                  <button
                    key={c.id}
                    className={`cmd__item ${activeIndex === idx ? 'cmd__item--active' : ''}`}
                    data-index={idx}
                    onClick={() => goTo('customer', c)}
                    onMouseEnter={() => setActiveIndex(idx)}
                  >
                    <span className="cmd__item-icon cmd__item-icon--customer">{SI.customer}</span>
                    <div className="cmd__item-content">
                      <span className="cmd__item-label">{c.full_name || c.email}</span>
                      <span className="cmd__item-meta">
                        {c.email !== '—' && c.full_name && <span>{c.email}</span>}
                      </span>
                    </div>
                    <span className="cmd__item-action">{SI.arrow}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {hasResults && (
          <div className="cmd__footer">
            <span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
            <span><kbd className="cmd__kbd--inline">{SI.enter}</kbd> Open</span>
            <span><kbd>ESC</kbd> Close</span>
          </div>
        )}
      </div>
    </>
  );
}
