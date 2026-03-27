import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router';
import Skeleton from '../../components/ui/Skeleton';
import Badge from '../../components/ui/Badge';
import { formatPrice } from '../../utils/formatPrice';
import { setPageMeta, clearPageMeta } from '../../utils/pageMeta';
import '../../styles/pages/OrderConfirmation.css';

/**
 * OrderTracking — Guest + authenticated order tracking.
 * URL: /track?order=BT-XXXXXXXX&token=abc123
 * No login required. Token validates access.
 *
 * Premium redesign: monochrome tracker (no green — stays on-brand),
 * checkmarks on completed steps, status summary, timestamps, help section.
 */

const STATUS_STEPS = [
  { key: 'pending', label: 'Order received', desc: 'We have received your order.' },
  { key: 'confirmed', label: 'Confirmed', desc: 'Your order has been confirmed and is being prepared.' },
  { key: 'processing', label: 'Being packed', desc: 'Your pieces are being carefully packed.' },
  { key: 'shipped', label: 'Shipped', desc: 'Your order is on its way to you.' },
  { key: 'delivered', label: 'Delivered', desc: 'Your order has been delivered.' },
];

const STATUS_ORDER = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

/* Status summary — one confident sentence per the brand voice */
const STATUS_SUMMARY = {
  pending: 'Your order has been received.',
  confirmed: 'Your order is confirmed and being prepared.',
  processing: 'Your order is being packed.',
  shipped: 'Your order is on its way.',
  delivered: 'Your order has been delivered.',
  cancelled: 'This order has been cancelled.',
};

/* Checkmark SVG for completed steps */
function CheckIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3.5 8.5L6.5 11.5L12.5 4.5"
        stroke="var(--bt-bg)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* Format date to "15 Mar 2026, 2:30 PM" */
function formatDate(dateStr) {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }) + ', ' + d.toLocaleTimeString('en-NG', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return null;
  }
}

/* Map known timestamps from order data to steps */
function getStepTimestamp(stepKey, order) {
  switch (stepKey) {
    case 'pending': return formatDate(order.created_at);
    case 'shipped': return formatDate(order.shipped_at);
    case 'delivered': return formatDate(order.delivered_at);
    default: return null;
  }
}

export default function OrderTracking() {
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const orderNumber = searchParams.get('order');
  const token = searchParams.get('token');

  useEffect(() => {
    setPageMeta({
      title: 'Track Your Order. BlackTribe Fashion.',
      description: 'Track your BlackTribe Fashion order status.',
      path: '/track',
    });
    return () => clearPageMeta();
  }, []);

  useEffect(() => {
    if (!orderNumber || !token) {
      setError('Invalid tracking link.');
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/track?order=${orderNumber}&token=${token}`);
        const result = await res.json();

        if (result.success && result.data) {
          setOrder(result.data);
        } else {
          setError(result.error || 'Order not found.');
        }
      } catch (err) {
        console.error('[tracking] Failed to fetch:', err);
        setError('Could not load order details.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderNumber, token]);

  /* ═══ LOADING ═══ */
  if (loading) {
    return (
      <div className="oc">
        <div className="oc__inner">
          <div style={{ textAlign: 'center', padding: '24px 0 48px' }}>
            <Skeleton type="text" style={{ width: 100, height: 12, margin: '0 auto 16px' }} />
            <Skeleton type="text" style={{ width: 180, height: 16, margin: '0 auto 12px' }} />
            <Skeleton type="text" style={{ width: 260, height: 14, margin: '0 auto 24px' }} />
          </div>
          <div style={{ padding: '24px 0' }}>
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} style={{ display: 'flex', gap: 16, marginBottom: 28 }}>
                <Skeleton type="text" style={{ width: 14, height: 14, borderRadius: '50%', flexShrink: 0 }} />
                <div>
                  <Skeleton type="text" style={{ width: 100 + i * 20, height: 14, marginBottom: 4 }} />
                  <Skeleton type="text" style={{ width: 160, height: 11 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ═══ ERROR ═══ */
  if (error || !order) {
    return (
      <div className="oc">
        <div className="oc__inner oc__center">
          <h1 className="oc__title">Order not found</h1>
          <p className="oc__text">{error || 'This tracking link is invalid or expired.'}</p>
          <Link to="/shop" className="oc__continue">Continue Shopping</Link>
        </div>
      </div>
    );
  }

  const currentIndex = STATUS_ORDER.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';
  const summary = STATUS_SUMMARY[order.status] || '';

  return (
    <div className="oc page-enter">
      <div className="oc__inner">

        {/* ═══ HEADER ═══ */}
        <div className="ot-header">
          <span className="ot-eyebrow">Order Status</span>
          <p className="ot-order-id">{order.order_number}</p>
          <p className="ot-summary">{summary}</p>
          {!isCancelled && (
            <div className="ot-badge-wrap">
              <span className={`ot-badge ot-badge--${order.status}`}>
                {order.status === 'delivered' ? 'Delivered' : order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>
          )}
        </div>

        {/* ═══ TRACKER ═══ */}
        {isCancelled ? (
          <div className="ot-cancelled">
            <div className="ot-cancelled__icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <path d="M15 9l-6 6M9 9l6 6" />
              </svg>
            </div>
            <p>This order has been cancelled.</p>
            <p className="ot-cancelled__sub">
              If you believe this is an error, contact{' '}
              <a href="mailto:support@blacktribefashion.com">support@blacktribefashion.com</a>
            </p>
          </div>
        ) : (
          <div className="ot-tracker">
            {STATUS_STEPS.map((step, i) => {
              const isComplete = i < currentIndex;
              const isCurrent = i === currentIndex;
              const isFuture = i > currentIndex;
              const isLast = i === STATUS_STEPS.length - 1;
              const timestamp = (isComplete || isCurrent)
                ? getStepTimestamp(step.key, order)
                : null;

              return (
                <div
                  key={step.key}
                  className={[
                    'ot-step',
                    isComplete && 'ot-step--complete',
                    isCurrent && 'ot-step--current',
                    isFuture && 'ot-step--future',
                  ].filter(Boolean).join(' ')}
                >
                  {/* Indicator column */}
                  <div className="ot-step__indicator">
                    <div className="ot-step__dot">
                      {isComplete && <CheckIcon />}
                    </div>
                    {!isLast && <div className="ot-step__line" />}
                  </div>

                  {/* Content column */}
                  <div className="ot-step__content">
                    <span className="ot-step__label">{step.label}</span>
                    {isCurrent && (
                      <span className="ot-step__desc">{step.desc}</span>
                    )}
                    {timestamp && (
                      <span className="ot-step__time">{timestamp}</span>
                    )}
                    {step.key === 'shipped' && (isCurrent || isComplete) && order.tracking_number && (
                      <span className="ot-step__tracking">
                        Tracking: {order.tracking_number}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ═══ ORDER ITEMS ═══ */}
        <div className="oc__details">
          <h2 className="oc__section-label">Order Details</h2>
          <div className="oc__items">
            {order.items?.map((item) => (
              <div className="oc__item" key={item.id}>
                <div className="oc__item-image">
                  <img src={item.image_url} alt={item.name} loading="lazy" />
                </div>
                <div className="oc__item-info">
                  <span className="oc__item-name">{item.name}</span>
                  <span className="oc__item-meta">
                    {item.size}{item.size && item.color ? ' / ' : ''}{item.color}
                    {item.quantity > 1 && ` × ${item.quantity}`}
                  </span>
                </div>
                <span className="oc__item-price">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="oc__totals">
            <div className="oc__row oc__row--total">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        {/* ═══ SHIPPING ═══ */}
        {order.shipping_address?.name && (
          <div className="oc__shipping">
            <h2 className="oc__section-label">Shipping to</h2>
            <p className="oc__shipping-name">{order.shipping_address.name}</p>
            <p className="oc__shipping-address">
              {order.shipping_address.street}
              {order.shipping_address.city && `, ${order.shipping_address.city}`}
              {order.shipping_address.state && `, ${order.shipping_address.state}`}
            </p>
          </div>
        )}

        {/* ═══ HELP ═══ */}
        <div className="ot-help">
          <h2 className="oc__section-label">Need help?</h2>
          <p className="ot-help__text">
            Questions about your order? Contact us at{' '}
            <a href="mailto:support@blacktribefashion.com" className="ot-help__link">
              support@blacktribefashion.com
            </a>
          </p>
        </div>

        {/* ═══ FOOTER ═══ */}
        <div className="oc__footer">
          <Link to="/shop" className="oc__continue">Continue Shopping</Link>
        </div>

      </div>
    </div>
  );
}
