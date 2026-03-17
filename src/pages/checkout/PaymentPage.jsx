import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, Link } from 'react-router';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import { formatPrice } from '../../utils/formatPrice';
import '../../styles/pages/PaymentPage.css';

const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;

export default function PaymentPage() {
  const { orderNumber } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paying, setPaying] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paid, setPaid] = useState(false);
  const paymentComplete = useRef(false);

  /* ─── Fetch order ─── */
  useEffect(() => {
    if (!orderNumber || !token) {
      setError('Invalid payment link.');
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/pay/${orderNumber}?token=${token}`);
        const result = await res.json();

        if (result.success && result.data) {
          if (result.data.alreadyPaid) {
            setPaid(true);
          } else if (result.data.expired) {
            setError('This payment link has expired.');
          } else {
            setOrder(result.data);
          }
        } else {
          setError('Order not found.');
        }
      } catch {
        setError('Could not load order.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderNumber, token]);

  useEffect(() => {
    document.title = `Pay ${orderNumber || ''}. BlackTribe Fashion.`;
    return () => { document.title = 'BlackTribe Fashion. Redefining Luxury.'; };
  }, [orderNumber]);

  /* ─── Pay with Paystack ─── */
  const handlePay = async () => {
    if (!order || !window.PaystackPop) return;

    setPaying(true);
    setPaymentError('');

    const email = order.guest_email || '';
    const reference = `bt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const paystackInstance = new window.PaystackPop();

    // Update payment reference on server BEFORE opening popup
    // so the webhook can match this reference
    try {
      await fetch(`/api/orders/${order.id}/update-ref`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference }),
      });
    } catch {
      // Non-blocking — webhook might not match but payment still works
    }

    paystackInstance.newTransaction({
      key: PAYSTACK_PUBLIC_KEY,
      email,
      amount: order.total,
      ref: reference,
      currency: 'NGN',
      channels: ['card', 'bank', 'ussd', 'bank_transfer'],
      metadata: {
        order_id: order.id,
        order_number: order.order_number,
      },

      onSuccess: (transaction) => {
        console.log('[pay] Payment success:', transaction.reference);
        paymentComplete.current = true;
        setPaying(false);
        setPaid(true);
      },

      onCancel: () => {
        setPaying(false);
        setPaymentError('Payment was cancelled. You can try again.');
      },

      onError: (err) => {
        console.error('[pay] Error:', err);
        setPaying(false);
        setPaymentError('Payment could not be completed. Please try again.');
      },
    });
  };


  /* ─── Loading ─── */
  if (loading) {
    return (
      <div className="pay-page">
        <div className="pay-page__inner">
          <Skeleton type="text" style={{ width: 200, height: 28, margin: '0 auto 16px' }} />
          <Skeleton type="text" style={{ width: 160, height: 16, margin: '0 auto 48px' }} />
          <Skeleton type="text" style={{ width: '100%', height: 200 }} />
        </div>
      </div>
    );
  }

  /* ─── Already paid ─── */
  if (paid) {
    return (
      <div className="pay-page">
        <div className="pay-page__inner pay-page__center">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
            <circle cx="24" cy="24" r="23" stroke="#4ADE80" strokeWidth="1.5" />
            <polyline points="15 24 21 30 33 18" stroke="#4ADE80" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h1 className="pay-page__title">Payment complete.</h1>
          <p className="pay-page__subtitle">Order {orderNumber} has been confirmed.</p>
          <p className="pay-page__text">You will receive tracking details at your email within 48 hours.</p>
          <Link to="/shop" className="pay-page__link">Continue Shopping</Link>
        </div>
      </div>
    );
  }

  /* ─── Error / Expired ─── */
  if (error) {
    return (
      <div className="pay-page">
        <div className="pay-page__inner pay-page__center">
          <h1 className="pay-page__title">{error}</h1>
          <p className="pay-page__text">If you believe this is a mistake, contact support@blacktribefashion.com.</p>
          <Link to="/shop" className="pay-page__link">Back to Shop</Link>
        </div>
      </div>
    );
  }

  /* ─── Payment page ─── */
  const shippingName = order.shipping_address?.name || '';
  const itemCount = order.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;

  return (
    <div className="pay-page">
      <div className="pay-page__inner">

        {/* Header */}
        <div className="pay-page__header">
          <div className="pay-page__wordmark">BLACKTRIBE</div>
          <h1 className="pay-page__title">Complete Your Order</h1>
          <p className="pay-page__order-num">{orderNumber}</p>
        </div>

        {/* Items */}
        <div className="pay-page__items">
          {order.items?.map((item) => (
            <div className="pay-page__item" key={item.id}>
              <div className="pay-page__item-image">
                <img src={item.image_url} alt={item.name} loading="lazy" />
              </div>
              <div className="pay-page__item-info">
                <span className="pay-page__item-name">{item.name}</span>
                <span className="pay-page__item-meta">
                  {item.size}{item.color ? ' / ' + item.color : ''}
                  {item.quantity > 1 ? ` × ${item.quantity}` : ''}
                </span>
              </div>
              <span className="pay-page__item-price">{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="pay-page__total">
          <span>Total</span>
          <span>{formatPrice(order.total)}</span>
        </div>

        {/* Error */}
        {paymentError && (
          <div className="pay-page__error" role="alert">
            <p>{paymentError}</p>
          </div>
        )}

        {/* Pay button */}
        <div className="pay-page__action">
          <Button
            variant="primary"
            fullWidth
            size="large"
            onClick={handlePay}
            loading={paying}
            disabled={paying}
          >
            {paying ? 'Processing...' : `Pay ${formatPrice(order.total)}`}
          </Button>
        </div>

        {/* Expiry note */}
        <p className="pay-page__expiry">
          This link expires 48 hours after the order was placed.
        </p>

        {shippingName && (
          <div className="pay-page__shipping">
            <p className="pay-page__shipping-label">Shipping to</p>
            <p className="pay-page__shipping-name">{shippingName}</p>
          </div>
        )}

      </div>
    </div>
  );
}
