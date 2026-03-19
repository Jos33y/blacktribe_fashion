import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { api } from '../../utils/api';
import { formatPrice } from '../../utils/formatPrice';
import Skeleton from '../../components/ui/Skeleton';

/**
 * OrderList — "Orders" tab.
 * Clean cards with status badges, product thumbnail, price, Track link.
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

export default function OrderList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

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

        return (
          <div key={order.id} className="order-list__card">
            <div className="order-list__header">
              <span className="order-list__number">{order.order_number}</span>
              <span className={`order-list__status ${STATUS_CLASS[order.status] || ''}`}>
                {STATUS_LABELS[order.status] || order.status}
              </span>
            </div>

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
                {(order.status === 'shipped' || order.status === 'delivered') && order.tracking_number && (
                  <Link
                    to={`/track?order=${order.order_number}&token=${order.tracking_token}`}
                    className="order-list__track"
                  >
                    Track
                  </Link>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
