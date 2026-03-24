import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import AddressForm from '../../components/checkout/AddressForm';
import OrderSummary from '../../components/checkout/OrderSummary';
import useCartStore from '../../store/cartStore';
import useUIStore from '../../store/uiStore';
import useAuth from '../../hooks/useAuth';
import { api } from '../../utils/api';
import { formatPrice } from '../../utils/formatPrice';
import { trackCheckoutStart, trackPaymentSuccess, trackPaymentFailed } from '../../utils/tracker';
import '../../styles/pages/Checkout.css';

/* Discount validation uses POST /api/admin/validate-discount */

const FREE_SHIPPING_THRESHOLD = 5000000;
const DEFAULT_SHIPPING = 350000;

const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;

/* ─── Persistence (localStorage — survives browser close) ─── */
const CHECKOUT_STORAGE = 'bt-checkout';
const PENDING_ORDER_STORAGE = 'bt-pending-order';

function loadFormState() {
  try {
    const raw = localStorage.getItem(CHECKOUT_STORAGE);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveFormState(data) {
  try { localStorage.setItem(CHECKOUT_STORAGE, JSON.stringify(data)); } catch { }
}

function clearFormState() {
  try { localStorage.removeItem(CHECKOUT_STORAGE); } catch { }
}

function loadPendingOrder() {
  try {
    const raw = localStorage.getItem(PENDING_ORDER_STORAGE);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.createdAt && Date.now() - parsed.createdAt > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(PENDING_ORDER_STORAGE);
      return null;
    }
    return parsed;
  } catch { return null; }
}

function savePendingOrder(orderId, orderNumber, reference) {
  try {
    localStorage.setItem(PENDING_ORDER_STORAGE, JSON.stringify({
      orderId, orderNumber, reference, createdAt: Date.now(),
    }));
  } catch { }
}

function clearPendingOrder() {
  try { localStorage.removeItem(PENDING_ORDER_STORAGE); } catch { }
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
  const clearCart = useCartStore((s) => s.clearCart);
  const closeCartDrawer = useUIStore((s) => s.closeCartDrawer);
  const { isAuthenticated, email: userEmail, profile } = useAuth();

  /*
   * paymentComplete ref prevents the empty-cart redirect from firing
   * after clearCart(). Without this, clearCart() sets items to [],
   * the useEffect sees items.length === 0, and navigates to '/'
   * before navigate('/order-confirmation/...') can complete.
   */
  const paymentComplete = useRef(false);

  useEffect(() => { closeCartDrawer(); }, [closeCartDrawer]);

  const saved = useRef(loadFormState());
  const pendingOrder = useRef(loadPendingOrder());

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
  const [paymentError, setPaymentError] = useState('');
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const [showRecovery, setShowRecovery] = useState(!!pendingOrder.current);

  useEffect(() => {
    saveFormState({ contact, address, discount: appliedDiscount });
  }, [contact, address, appliedDiscount]);

  /* ─── Redirect if cart empty (but NOT after successful payment) ─── */
  useEffect(() => {
    if (items.length === 0 && !paymentComplete.current) {
      navigate('/', { replace: true });
    }
  }, [items.length, navigate]);

  useEffect(() => {
    document.title = 'Checkout. BlackTribe Fashion.';
    trackCheckoutStart();
    return () => { document.title = 'BlackTribe Fashion. Redefining Luxury.'; };
  }, []);

  /* ─── Pre-fill from auth (only if form is empty / no saved state) ─── */
  useEffect(() => {
    if (!isAuthenticated) return;

    // Pre-fill email if empty
    if (!contact.email && userEmail) {
      setContact((prev) => ({ ...prev, email: userEmail }));
    }

    // Pre-fill name if empty
    if (!address.fullName && profile?.full_name) {
      setAddress((prev) => ({ ...prev, fullName: profile.full_name }));
    }

    // Pre-fill phone if empty
    if (!contact.phone && profile?.phone) {
      setContact((prev) => ({ ...prev, phone: profile.phone }));
    }

    // Fetch default saved address if address fields are empty
    if (!address.street) {
      api('/api/auth/addresses')
        .then((result) => {
          if (result.success && result.data?.length > 0) {
            const defaultAddr = result.data.find((a) => a.is_default) || result.data[0];
            setAddress((prev) => ({
              fullName: prev.fullName || defaultAddr.full_name || '',
              street: defaultAddr.street || '',
              city: defaultAddr.city || '',
              state: defaultAddr.state || '',
              lga: defaultAddr.lga || '',
              phone: prev.phone || defaultAddr.phone || '',
            }));
          }
        })
        .catch(() => { });
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [isAuthenticated]);

  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : DEFAULT_SHIPPING;

  const discountAmount = (() => {
    if (!appliedDiscount) return 0;
    /* Use server-calculated amount if available */
    if (appliedDiscount.discountAmount) return appliedDiscount.discountAmount;
    if (appliedDiscount.type === 'percentage') {
      return Math.round(subtotal * (appliedDiscount.value / 100));
    }
    return appliedDiscount.value;
  })();

  const total = subtotal + shipping - discountAmount;

  const handleApplyDiscount = useCallback(async (code) => {
    try {
      const res = await fetch('/api/admin/validate-discount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal }),
      });
      const json = await res.json();

      if (!json.success) {
        return { error: json.error || 'This code is not valid.' };
      }

      setAppliedDiscount({
        code: json.data.code,
        type: json.data.type,
        value: json.data.value,
        discountAmount: json.data.discount_amount,
      });
      return {};
    } catch {
      return { error: 'Unable to validate code. Try again.' };
    }
  }, [subtotal]);

  const handleRemoveDiscount = useCallback(() => {
    setAppliedDiscount(null);
  }, []);


  /* ═══════════════════════════════════════════════════════════
     PAYMENT FLOW — Paystack Inline v2
     Uses: new PaystackPop() → .newTransaction()
     This opens a true iframe popup overlay on the page.
     ═══════════════════════════════════════════════════════════ */

  const handleSubmit = async () => {
    const validationErrors = validateCheckout(contact, address);
    setErrors(validationErrors);
    setPaymentError('');
    setShowRecovery(false);

    if (Object.keys(validationErrors).length > 0) {
      const firstErrorField = document.querySelector('[aria-invalid="true"]');
      if (firstErrorField) firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setSubmitting(true);

    try {
      // ─── 1. Create/retry order on server ───
      const existing = loadPendingOrder();

      const payload = {
        contact,
        address,
        items,
        discount: appliedDiscount ? { code: appliedDiscount.code, amount: discountAmount } : null,
        subtotal,
        shipping,
        total,
      };

      if (existing?.orderId) {
        payload.pendingOrderId = existing.orderId;
      }

      const res = await fetch('/api/cart/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create order.');
      }

      const { orderId, orderNumber, reference, email, amount } = result.data;

      // Save pending order for recovery
      savePendingOrder(orderId, orderNumber, reference);

      // ─── 2. Open Paystack inline popup (v2 API) ───
      if (typeof window.PaystackPop === 'undefined') {
        throw new Error('Payment system is loading. Please try again.');
      }

      const paystackInstance = new window.PaystackPop();

      paystackInstance.newTransaction({
        key: PAYSTACK_PUBLIC_KEY,
        email: email,
        amount: amount,
        ref: reference,
        currency: 'NGN',
        channels: ['card', 'bank', 'ussd', 'bank_transfer'],
        metadata: {
          order_id: orderId,
          order_number: orderNumber,
          custom_fields: [
            { display_name: 'Order Number', variable_name: 'order_number', value: orderNumber || '' },
          ],
        },

        onSuccess: (transaction) => {
          console.log('[paystack] Payment success:', transaction.reference);
          // Set flag BEFORE clearing cart to prevent redirect race
          paymentComplete.current = true;
          clearCart();
          clearFormState();
          clearPendingOrder();
          setSubmitting(false);
          trackPaymentSuccess(orderId, amount);
          navigate(`/order-confirmation/${orderId}`);
        },

        onCancel: () => {
          console.log('[paystack] Popup closed — order preserved for retry');
          setSubmitting(false);
          setPaymentError('Payment was cancelled. Your order has been saved. You can try again anytime.');

          // Send payment reminder email (one time only, non-blocking)
          fetch(`/api/orders/${orderId}/remind`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: contact.email }),
          }).catch(() => { });
        },

        onError: (error) => {
          console.error('[paystack] Payment error:', error);
          setSubmitting(false);
          trackPaymentFailed(orderId, 'Payment error');
          setPaymentError('Payment could not be completed. Please try again.');
        },
      });

    } catch (err) {
      console.error('[checkout] Error:', err);
      setSubmitting(false);
      setPaymentError(err.message || 'Something went wrong. Try again.');
    }
  };


  const handleClearPending = () => {
    clearPendingOrder();
    pendingOrder.current = null;
    setShowRecovery(false);
  };


  if (items.length === 0 && !paymentComplete.current) return null;

  return (
    <div className="checkout page-enter">

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

          {showRecovery && (
            <div className="checkout__recovery" role="status">
              <p>You have an incomplete order. Click Pay to complete your purchase.</p>
              <button
                className="checkout__recovery-dismiss"
                onClick={handleClearPending}
                type="button"
              >
                Start fresh
              </button>
            </div>
          )}

          {paymentError && (
            <div className="checkout__error" role="alert">
              <p>{paymentError}</p>
              <button
                className="checkout__error-dismiss"
                onClick={() => setPaymentError('')}
                type="button"
                aria-label="Dismiss"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

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
              {submitting ? 'Processing...' : `Pay ${formatPrice(total)}`}
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
                {submitting ? 'Processing...' : `Pay ${formatPrice(total)}`}
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