import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import AddressForm from '../../components/checkout/AddressForm';
import OrderSummary from '../../components/checkout/OrderSummary';
import useCartStore from '../../store/cartStore';
import useUIStore from '../../store/uiStore';
import { formatPrice } from '../../utils/formatPrice';
import '../../styles/pages/Checkout.css';

/* ─── Mock discounts ─── */
const MOCK_DISCOUNTS = {
  TRIBE10: { type: 'percentage', value: 10, minOrder: 5000000 },
  SHADOW20: { type: 'percentage', value: 20, minOrder: 10000000 },
  FIRST5K: { type: 'fixed', value: 500000, minOrder: 2500000 },
};

const FREE_SHIPPING_THRESHOLD = 5000000;
const DEFAULT_SHIPPING = 350000;

/* ─── Form persistence ─── */
const CHECKOUT_STORAGE = 'bt-checkout';

function loadFormState() {
  try {
    const raw = sessionStorage.getItem(CHECKOUT_STORAGE);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveFormState(data) {
  try { sessionStorage.setItem(CHECKOUT_STORAGE, JSON.stringify(data)); } catch {}
}

/* ─── Validation ─── */
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateCheckout(contact, address) {
  const errors = {};
  if (!contact.email.trim()) errors.email = 'Email is required.';
  else if (!validateEmail(contact.email)) errors.email = 'Enter a valid email address.';
  if (!address.fullName.trim()) errors.fullName = 'Full name is required.';
  if (!address.street.trim()) errors.street = 'Street address is required.';
  if (!address.city.trim()) errors.city = 'City is required.';
  if (!address.state) errors.state = 'State is required.';
  return errors;
}


export default function Checkout() {
  const navigate = useNavigate();
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.getSubtotal());
  const closeCartDrawer = useUIStore((s) => s.closeCartDrawer);

  useEffect(() => { closeCartDrawer(); }, [closeCartDrawer]);

  const saved = useRef(loadFormState());

  const [contact, setContact] = useState(
    saved.current?.contact || { email: '', phone: '' }
  );
  const [address, setAddress] = useState(
    saved.current?.address || { fullName: '', street: '', city: '', state: '', lga: '', phone: '' }
  );
  const [appliedDiscount, setAppliedDiscount] = useState(
    saved.current?.discount || null
  );
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(false);

  useEffect(() => {
    saveFormState({ contact, address, discount: appliedDiscount });
  }, [contact, address, appliedDiscount]);

  useEffect(() => {
    if (items.length === 0) navigate('/', { replace: true });
  }, [items.length, navigate]);

  useEffect(() => {
    document.title = 'Checkout. BlackTribe Fashion.';
    return () => { document.title = 'BlackTribe Fashion. Redefining Luxury.'; };
  }, []);

  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : DEFAULT_SHIPPING;

  const discountAmount = (() => {
    if (!appliedDiscount) return 0;
    if (appliedDiscount.type === 'percentage') {
      return Math.round(subtotal * (appliedDiscount.value / 100));
    }
    return appliedDiscount.value;
  })();

  const total = subtotal + shipping - discountAmount;

  const handleApplyDiscount = useCallback((code) => {
    const discount = MOCK_DISCOUNTS[code];
    if (!discount) return { error: 'This code is not valid.' };
    if (subtotal < discount.minOrder) {
      return { error: `Minimum order of ${formatPrice(discount.minOrder)} required for this code.` };
    }
    setAppliedDiscount({ ...discount, code });
    return {};
  }, [subtotal]);

  const handleRemoveDiscount = useCallback(() => {
    setAppliedDiscount(null);
  }, []);

  const handleSubmit = async () => {
    const validationErrors = validateCheckout(contact, address);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      const firstErrorField = document.querySelector('[aria-invalid="true"]');
      if (firstErrorField) firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setSubmitting(true);

    // TODO: Paystack integration
    await new Promise((r) => setTimeout(r, 2000));
    setSubmitting(false);

    console.log('Checkout submitted:', { contact, address, items, discount: appliedDiscount, total });
    alert('Checkout flow complete up to payment. Paystack integration is next.');
  };

  if (items.length === 0) return null;

  return (
    <div className="checkout page-enter">

      {/* ═══ MOBILE: Sticky order summary bar ═══ */}
      <div className="checkout__mobile-summary">
        <button
          className="checkout__mobile-summary-toggle"
          onClick={() => setMobileExpanded(!mobileExpanded)}
          type="button"
          aria-expanded={mobileExpanded}
        >
          <div className="checkout__mobile-summary-left">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" />
            </svg>
            <span>{mobileExpanded ? 'Hide order summary' : 'Show order summary'}</span>
            <svg
              className={`checkout__mobile-summary-chevron ${mobileExpanded ? 'checkout__mobile-summary-chevron--up' : ''}`}
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
          <span className="checkout__mobile-summary-total">{formatPrice(total)}</span>
        </button>

        {mobileExpanded && (
          <div className="checkout__mobile-summary-content">
            <OrderSummary
              shipping={shipping}
              discountAmount={discountAmount}
              appliedDiscount={appliedDiscount}
              onApplyDiscount={handleApplyDiscount}
              onRemoveDiscount={handleRemoveDiscount}
            />
          </div>
        )}
      </div>

      <div className="checkout__inner">

        <div className="checkout__form">
          <Link to="/shop" className="checkout__back">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Continue shopping
          </Link>

          <h1 className="checkout__title">Checkout</h1>

          <section className="checkout__section">
            <h2 className="checkout__section-title">Contact</h2>
            <Input
              label="Email"
              id="checkout-email"
              type="email"
              required
              value={contact.email}
              onChange={(e) => { setContact({ ...contact, email: e.target.value }); setErrors({ ...errors, email: undefined }); }}
              placeholder="you@example.com"
              error={errors.email}
              autoComplete="email"
            />
            <Input
              label="Phone"
              id="checkout-phone"
              type="tel"
              value={contact.phone}
              onChange={(e) => setContact({ ...contact, phone: e.target.value })}
              placeholder="+234 800 000 0000 (optional)"
              autoComplete="tel"
            />
          </section>

          <section className="checkout__section">
            <h2 className="checkout__section-title">Shipping Address</h2>
            <AddressForm
              address={address}
              onChange={(updated) => {
                setAddress(updated);
                setErrors((prev) => ({ ...prev, fullName: undefined, street: undefined, city: undefined, state: undefined }));
              }}
              errors={errors}
            />
          </section>

          <div className="checkout__pay checkout__pay--mobile">
            <Button
              variant="primary"
              fullWidth
              size="large"
              onClick={handleSubmit}
              loading={submitting}
              disabled={submitting}
            >
              Pay {formatPrice(total)}
            </Button>
          </div>
        </div>

        <div className="checkout__sidebar">
          <div className="checkout__sidebar-inner">
            <OrderSummary
              shipping={shipping}
              discountAmount={discountAmount}
              appliedDiscount={appliedDiscount}
              onApplyDiscount={handleApplyDiscount}
              onRemoveDiscount={handleRemoveDiscount}
            />

            <div className="checkout__pay checkout__pay--desktop">
              <Button
                variant="primary"
                fullWidth
                size="large"
                onClick={handleSubmit}
                loading={submitting}
                disabled={submitting}
              >
                Pay {formatPrice(total)}
              </Button>
              <p className="checkout__pay-note">
                Secure checkout via Paystack.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
