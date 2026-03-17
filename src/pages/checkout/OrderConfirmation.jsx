import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router';
import ShareableImage from '../../components/confirmation/ShareableImage';
import ShareButtons from '../../components/confirmation/ShareButtons';
import Skeleton from '../../components/ui/Skeleton';
import { formatPrice } from '../../utils/formatPrice';
import '../../styles/pages/OrderConfirmation.css';

export default function OrderConfirmation() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageBlob, setImageBlob] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);

  /* ─── Fetch order data ─── */
  useEffect(() => {
    if (!id) return;

    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${id}`);
        const result = await res.json();

        if (result.success && result.data) {
          setOrder(result.data);
        } else {
          setError('Order not found.');
        }
      } catch (err) {
        console.error('[confirmation] Failed to fetch order:', err);
        setError('Could not load order details.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  useEffect(() => {
    document.title = order
      ? `Order ${order.order_number} Confirmed. BlackTribe Fashion.`
      : 'Order Confirmed. BlackTribe Fashion.';
    return () => { document.title = 'BlackTribe Fashion. Redefining Luxury.'; };
  }, [order]);

  const handleImageReady = useCallback((blob, url) => {
    setImageBlob(blob);
    setImageUrl(url);
  }, []);

  /* ─── Loading state ─── */
  if (loading) {
    return (
      <div className="oc">
        <div className="oc__inner">
          <div className="oc__header">
            <Skeleton type="text" style={{ width: 48, height: 48, borderRadius: '50%', margin: '0 auto 16px' }} />
            <Skeleton type="text" style={{ width: 240, height: 32, margin: '0 auto 8px' }} />
            <Skeleton type="text" style={{ width: 160, height: 16, margin: '0 auto' }} />
          </div>
        </div>
      </div>
    );
  }

  /* ─── Error state ─── */
  if (error || !order) {
    return (
      <div className="oc">
        <div className="oc__inner oc__center">
          <h1 className="oc__title">Order not found</h1>
          <p className="oc__text">{error || 'This order could not be loaded.'}</p>
          <Link to="/shop" className="oc__continue">Continue Shopping</Link>
        </div>
      </div>
    );
  }

  /* ─── Extract data ─── */
  const firstItem = order.items?.[0];
  const email = order.guest_email || '';
  const shippingName = order.shipping_address?.name || '';

  return (
    <div className="oc page-enter">
      <div className="oc__inner">

        {/* ═══ Hero: Confirmation header ═══ */}
        <div className="oc__header">
          <svg className="oc__check" width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
            <circle cx="24" cy="24" r="23" stroke="var(--bt-success)" strokeWidth="1.5" />
            <polyline points="15 24 21 30 33 18" stroke="var(--bt-success)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>

          <h1 className="oc__title">Order confirmed.</h1>
          <p className="oc__order-number">{order.order_number}</p>
          <p className="oc__delivery">
            You will receive tracking details at {email} within 48 hours.
          </p>
        </div>


        {/* ═══ Shareable image + actions ═══ */}
        <div className="oc__share-section">
          <ShareableImage
            orderNumber={order.order_number}
            productImage={firstItem?.image_url}
            productName={firstItem?.name}
            onReady={handleImageReady}
          />
          <ShareButtons
            imageBlob={imageBlob}
            imageUrl={imageUrl}
            orderNumber={order.order_number}
          />
        </div>


        {/* ═══ Order details ═══ */}
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
            <div className="oc__row">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="oc__row">
              <span>Shipping</span>
              <span>{order.shipping_cost === 0 ? 'Free' : formatPrice(order.shipping_cost)}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="oc__row oc__row--discount">
                <span>Discount</span>
                <span>-{formatPrice(order.discount_amount)}</span>
              </div>
            )}
            <div className="oc__row oc__row--total">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>


        {/* ═══ Shipping address ═══ */}
        {shippingName && (
          <div className="oc__shipping">
            <h2 className="oc__section-label">Shipping to</h2>
            <p className="oc__shipping-name">{shippingName}</p>
            <p className="oc__shipping-address">
              {order.shipping_address?.street}
              {order.shipping_address?.city && `, ${order.shipping_address.city}`}
              {order.shipping_address?.state && `, ${order.shipping_address.state}`}
            </p>
          </div>
        )}


        {/* ═══ Footer ═══ */}
        <div className="oc__footer">
          <Link to="/shop" className="oc__continue">Continue Shopping</Link>
        </div>

      </div>
    </div>
  );
}
