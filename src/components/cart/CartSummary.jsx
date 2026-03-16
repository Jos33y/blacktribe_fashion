import { Link } from 'react-router';
import { formatPrice } from '../../utils/formatPrice';
import useCartStore from '../../store/cartStore';
import useUIStore from '../../store/uiStore';

export default function CartSummary() {
  const subtotal = useCartStore((s) => s.getSubtotal());
  const closeCartDrawer = useUIStore((s) => s.closeCartDrawer);

  return (
    <div className="cart-summary">
      <div className="cart-summary__row">
        <span className="cart-summary__label">Subtotal</span>
        <span className="cart-summary__value">{formatPrice(subtotal)}</span>
      </div>

      <p className="cart-summary__note">
        Shipping calculated at checkout.
      </p>

      <Link
        to="/checkout"
        className="cart-summary__checkout"
        onClick={closeCartDrawer}
      >
        Checkout
      </Link>
    </div>
  );
}
