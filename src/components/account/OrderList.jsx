import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { api } from '../../utils/api';
import { formatPrice } from '../../utils/formatPrice';
import Skeleton from '../../components/ui/Skeleton';

/**
 * OrderList — "Orders" tab.
 * Shows all orders including pending (with Complete Payment button).
 * Each order expands to show full detail: all items, address, totals, tracking.
 */

const STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const STATUS_CLASS = {
  pending: 'account-status--pending',
  confirmed: 'account-status--confirmed',
  processing: 'account-status--processing',
  shipped: 'account-status--shipped',
  delivered: 'account-status--delivered',
  cancelled: 'account-status--cancelled',
};

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function OrderList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const result = await api('/api/orders');
        if (result.success && result.data) {
          setOrders(result.data);
        }
      } catch (err) {
        console.error('[orders] Failed to fetch:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const toggleExpand = (orderId) => {
    setExpandedId((prev) => (prev === orderId ? null : orderId));
  };

  if (loading) {
    return (
      <div className="order-list">
        {[1, 2, 3].map((i) => (
          <div key={i} className="order-list__card">
            <Skeleton type="text" style={{ width: '40%', height: 14, marginBottom: 8 }} />
            <Skeleton type="text" style={{ width: '70%', height: 14, marginBottom: 4 }} />
            <Skeleton type="text" style={{ width: '30%', height: 14 }} />
          </div>
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="account__empty">
        <div className="account__empty-line" />
        <p className="account__empty-quote">
          No orders yet. Your first piece is waiting.
        </p>
        <Link to="/shop" className="account__empty-cta">Start Shopping</Link>
      </div>
    );
  }

  return (
    <div className="order-list">
      {orders.map((order) => {
        const firstItem = order.items?.[0];
        const itemCount = order.items?.length || 0;
        const isExpanded = expandedId === order.id;
        const isPending = order.status === 'pending' || order.payment_status === 'pending';
        const isCancelled = order.status === 'cancelled';
        const address = order.shipping_address;

        return (
          <div
            key={order.id}
            className={`order-list__card ${isExpanded ? 'order-list__card--expanded' : ''} ${isPending ? 'order-list__card--pending' : ''}`}
          >
            {/* ─── Header (always visible) ─── */}
            <div
              className="order-list__header"
              onClick={() => toggleExpand(order.id)}
              role="button"
              tabIndex={0}
              aria-expanded={isExpanded}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleExpand(order.id); } }}
            >
              <div className="order-list__header-left">
                <span className="order-list__number">{order.order_number}</span>
                <span className="order-list__date">{formatDate(order.created_at)}</span>
              </div>
              <span className={`order-list__status ${STATUS_CLASS[order.status] || ''}`}>
                {STATUS_LABELS[order.status] || order.status}
              </span>
            </div>

            {/* ─── Preview (always visible) ─── */}
            <div className="order-list__body">
              {firstItem && (
                <div className="order-list__product">
                  <div className="order-list__image">
                    <img src={firstItem.image_url} alt={firstItem.name} loading="lazy" />
                  </div>
                  <div className="order-list__info">
                    <span className="order-list__name">
                      {firstItem.name}
                      {firstItem.size && ` · ${firstItem.size}`}
                    </span>
                    {itemCount > 1 && (
                      <span className="order-list__more">+ {itemCount - 1} more</span>
                    )}
                  </div>
                </div>
              )}

              <div className="order-list__meta">
                <span className="order-list__total">{formatPrice(order.total)}</span>
                {!isPending && !isCancelled && (
                  <button
                    className="order-list__detail-toggle"
                    onClick={(e) => { e.stopPropagation(); toggleExpand(order.id); }}
                  >
                    {isExpanded ? 'Hide Details' : 'View Details'}
                  </button>
                )}
              </div>
            </div>

            {/* ─── Pending: Complete Payment CTA ─── */}
            {isPending && !isCancelled && (
              <div className="order-list__pending-actions">
                <Link
                  to={`/pay/${order.order_number}?token=${order.tracking_token}`}
                  className="order-list__payment-btn"
                >
                  Complete Payment
                </Link>
                <button
                  className="order-list__detail-toggle"
                  onClick={(e) => { e.stopPropagation(); toggleExpand(order.id); }}
                >
                  {isExpanded ? 'Hide Details' : 'View Details'}
                </button>
              </div>
            )}

            {/* ─── Expanded Detail ─── */}
            {isExpanded && (
              <div className="order-list__detail">
                {/* All items */}
                <div className="order-list__detail-section">
                  <span className="order-list__detail-label">Items</span>
                  {(order.items || []).map((item, idx) => (
                    <div key={idx} className="order-list__detail-item">
                      <div className="order-list__detail-item-info">
                        <span className="order-list__detail-item-name">{item.name}</span>
                        <span className="order-list__detail-item-meta">
                          {item.size || ''}
                          {item.color ? ` / ${item.color}` : ''}
                          {item.quantity > 1 ? ` × ${item.quantity}` : ''}
                        </span>
                      </div>
                      <span className="order-list__detail-item-price">
                        {formatPrice(item.price * (item.quantity || 1))}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Shipping address */}
                {address && (
                  <div className="order-list__detail-section">
                    <span className="order-list__detail-label">Shipping To</span>
                    <p className="order-list__detail-address">
                      {address.name && <span>{address.name}<br /></span>}
                      {address.street}
                      {address.city && `, ${address.city}`}
                      {address.state && `, ${address.state}`}
                      {address.phone && <><br />{address.phone}</>}
                    </p>
                  </div>
                )}

                {/* Totals */}
                <div className="order-list__detail-section">
                  <div className="order-list__detail-row">
                    <span>Subtotal</span>
                    <span>{formatPrice(order.subtotal)}</span>
                  </div>
                  <div className="order-list__detail-row">
                    <span>Shipping</span>
                    <span>{order.shipping_cost === 0 ? 'Free' : formatPrice(order.shipping_cost)}</span>
                  </div>
                  {order.discount_amount > 0 && (
                    <div className="order-list__detail-row order-list__detail-row--discount">
                      <span>Discount{order.discount_code ? ` (${order.discount_code})` : ''}</span>
                      <span>-{formatPrice(order.discount_amount)}</span>
                    </div>
                  )}
                  <div className="order-list__detail-row order-list__detail-row--total">
                    <span>Total</span>
                    <span>{formatPrice(order.total)}</span>
                  </div>
                </div>

                {/* Tracking */}
                {order.tracking_number && (
                  <div className="order-list__detail-section">
                    <span className="order-list__detail-label">Tracking</span>
                    <p className="order-list__detail-tracking">{order.tracking_number}</p>
                  </div>
                )}

                {/* Track link for all non-cancelled orders */}
                {order.status !== 'cancelled' && order.tracking_token && (
                  <div className="order-list__detail-actions">
                    <Link
                      to={`/track?order=${order.order_number}&token=${order.tracking_token}`}
                      className="order-list__track-btn"
                    >
                      Track Order
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}