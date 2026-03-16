import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import useCartStore from '../../store/cartStore';
import useUIStore from '../../store/uiStore';
import CartItem from './CartItem';
import CartSummary from './CartSummary';
import '../../styles/ui/CartDrawer.css';

export default function CartDrawer() {
  const items = useCartStore((s) => s.items);
  const isOpen = useUIStore((s) => s.cartDrawerOpen);
  const closeCartDrawer = useUIStore((s) => s.closeCartDrawer);
  const panelRef = useRef(null);
  const closeRef = useRef(null);

  const isEmpty = items.length === 0;
  const itemCount = useCartStore((s) => s.getItemCount());

  /* ─── Lock body scroll + Escape ─── */
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    const handleKey = (e) => { if (e.key === 'Escape') closeCartDrawer(); };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen, closeCartDrawer]);

  /* ─── Focus trap ─── */
  useEffect(() => {
    if (!isOpen || !panelRef.current) return;
    const focusable = panelRef.current.querySelectorAll(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    const handleTab = (e) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [isOpen, items]);

  return (
    <>
      <div
        className={`cart-drawer__backdrop ${isOpen ? 'cart-drawer__backdrop--visible' : ''}`}
        onClick={closeCartDrawer}
        aria-hidden="true"
      />

      <aside
        ref={panelRef}
        className={`cart-drawer ${isOpen ? 'cart-drawer--open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={`Your bag, ${itemCount} items`}
        aria-hidden={!isOpen}
      >
        <div className="cart-drawer__header">
          <h2 className="cart-drawer__title">
            Your Bag
            <span className="cart-drawer__count">({itemCount})</span>
          </h2>
          <button
            ref={closeRef}
            className="cart-drawer__close"
            onClick={closeCartDrawer}
            aria-label="Close bag"
            type="button"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {isEmpty ? (
          <div className="cart-drawer__empty">
            <p className="cart-drawer__empty-text">Your bag is empty.</p>
            <Link to="/shop" className="cart-drawer__empty-link" onClick={closeCartDrawer}>
              Continue Shopping
            </Link>
          </div>
        ) : (
          <>
            <div className="cart-drawer__items">
              {items.map((item) => (
                <CartItem key={`${item.productId}::${item.size}`} item={item} />
              ))}
            </div>
            <CartSummary />
          </>
        )}
      </aside>
    </>
  );
}
