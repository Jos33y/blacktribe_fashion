import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router';
import Skeleton from '../../components/ui/Skeleton';
import { formatPrice } from '../../utils/formatPrice';
import { setPageMeta, clearPageMeta } from '../../utils/pageMeta';
import '../../styles/pages/OrderConfirmation.css';

/**
 * OrderTracking — Guest order tracking.
 * URL: /track?order=BT-XXXXXXXX&token=abc123
 * No login required. Token validates access.
 * Reuses OrderConfirmation.css (same visual language).
 */

const STATUS_STEPS = [
  { key: 'pending', label: 'Order received', desc: 'Awaiting confirmation.' },
  { key: 'confirmed', label: 'Order confirmed', desc: 'Preparing for shipment.' },
  { key: 'processing', label: 'Being packed', desc: 'Your order is being packed.' },
  { key: 'shipped', label: 'On its way', desc: 'Your order is on its way.' },
  { key: 'delivered', label: 'Delivered', desc: 'We hope you enjoy your piece.' },
];

const STATUS_ORDER = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

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

  if (loading) {
    return (
      <div className="oc">
        <div className="oc__inner">
          <div className="oc__header">
            <Skeleton type="text" style={{ width: 200, height: 28, margin: '0 auto 12px' }} />
            <Skeleton type="text" style={{ width: 140, height: 14, margin: '0 auto' }} />
          </div>
        </div>
      </div>
    );
  }

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

  return (
    <div className="oc page-enter">
      <div className="oc__inner">

        <div className="oc__header">
          <h1 className="oc__title">Track Your Order</h1>
          <p className="oc__order-number">{order.order_number}</p>
        </div>

        {/* ─── Status tracker ─── */}
        {isCancelled ? (
          <div className="ot-cancelled">
            <p>This order has been cancelled.</p>
          </div>
        ) : (
          <div className="ot-tracker">
            {STATUS_STEPS.map((step, i) => {
              const isComplete = i <= currentIndex;
              const isCurrent = i === currentIndex;

              return (
                <div
                  key={step.key}
                  className={`ot-step ${isComplete ? 'ot-step--complete' : ''} ${isCurrent ? 'ot-step--current' : ''}`}
                >
                  <div className="ot-step__indicator">
                    <div className="ot-step__dot" />
                    {i < STATUS_STEPS.length - 1 && <div className="ot-step__line" />}
                  </div>
                  <div className="ot-step__content">
                    <span className="ot-step__label">{step.label}</span>
                    {isCurrent && <span className="ot-step__desc">{step.desc}</span>}
                    {step.key === 'shipped' && isCurrent && order.tracking_number && (
                      <span className="ot-step__tracking">Tracking: {order.tracking_number}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ─── Order items ─── */}
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

        <div className="oc__footer">
          <Link to="/shop" className="oc__continue">Continue Shopping</Link>
        </div>

      </div>
    </div>
  );
}
