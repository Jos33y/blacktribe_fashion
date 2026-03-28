import { useEffect } from 'react';
import { Link } from 'react-router';
import useCartStore from '../../store/cartStore';
import useUIStore from '../../store/uiStore';
import useFocusTrap from '../../hooks/useFocusTrap';
import useScrollLock from '../../hooks/useScrollLock';
import { announce } from '../../utils/announcer';
import CartItem from './CartItem';
import CartSummary from './CartSummary';
import '../../styles/ui/CartDrawer.css';

export default function CartDrawer() {
  const items = useCartStore((s) => s.items);
  const isOpen = useUIStore((s) => s.cartDrawerOpen);
  const closeCartDrawer = useUIStore((s) => s.closeCartDrawer);

  const isEmpty = items.length === 0;
  const itemCount = useCartStore((s) => s.getItemCount());

  /* ─── Focus trap (handles Tab cycling + Escape + focus restore) ─── */
  const trapRef = useFocusTrap(isOpen, closeCartDrawer);

  /* ─── Lock background scroll (works on iOS Safari) ─── */
  useScrollLock(isOpen);

  /* ─── Announce to screen readers ─── */
  useEffect(() => {
    if (isOpen) {
      announce(`Shopping bag opened. ${itemCount} ${itemCount === 1 ? 'item' : 'items'} in bag.`);
    }
  }, [isOpen, itemCount]);

  return (
    <>
      <div
        className={`cart-drawer__backdrop ${isOpen ? 'cart-drawer__backdrop--visible' : ''}`}
        onClick={closeCartDrawer}
        aria-hidden="true"
      />

      <aside
        ref={trapRef}
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
