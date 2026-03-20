/*
 * BLACKTRIBE FASHION — ADMIN ORDER DETAIL
 *
 * Single order view. Staff can:
 *   - View all order info (customer, items, totals, payment)
 *   - Update order status (dropdown)
 *   - Add tracking number (when shipped)
 *   - Write admin notes
 *
 * Fetches from GET /api/admin/orders/:id
 * Updates via PATCH /api/admin/orders/:id
 */

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Skeleton from '../../components/ui/Skeleton';
import { useToast } from '../../components/ui/Toast';
import '../../styles/admin/admin-orders.css';

const STATUS_FLOW = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

function formatPrice(kobo) {
  if (!kobo && kobo !== 0) return '₦0';
  return '₦' + Math.floor(kobo / 100).toLocaleString('en-NG');
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function getStatusLabel(s) {
  const map = { pending: 'Pending', confirmed: 'Confirmed', processing: 'Processing', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled' };
  return map[s] || s;
}

function getPaymentLabel(m) {
  const map = { paystack: 'Paystack', cash: 'Cash', pos_terminal: 'POS Terminal', bank_transfer: 'Bank Transfer' };
  return map[m] || m;
}

export default function AdminOrderDetail() {
  const { id } = useParams();
  const { addToast } = useToast();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /* Editable fields */
  const [status, setStatus] = useState('');
  const [tracking, setTracking] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    document.title = 'Order Detail. BlackTribe Admin.';
    fetchOrder();
  }, [id]);

  async function getToken() {
    return (await import('../../store/authStore')).default.getState().getAccessToken();
  }

  async function fetchOrder() {
    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success && json.data) {
        setOrder(json.data);
        setStatus(json.data.status || '');
        setTracking(json.data.tracking_number || '');
        setNotes(json.data.notes || '');
      } else {
        addToast('Order not found.', 'error');
      }
    } catch {
      addToast('Failed to load order.', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          tracking_number: tracking.trim() || null,
          notes: notes.trim() || null,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setOrder(json.data);
        addToast('Order updated.', 'info');
      } else {
        addToast(json.error || 'Failed to update.', 'error');
      }
    } catch {
      addToast('Something went wrong.', 'error');
    } finally {
      setSaving(false);
    }
  }

  const hasChanges = order && (
    status !== order.status ||
    tracking !== (order.tracking_number || '') ||
    notes !== (order.notes || '')
  );

  if (loading) {
    return (
      <div className="admin-page">
        <Skeleton type="text" style={{ width: '40%', height: 24, marginBottom: 16 }} />
        <Skeleton type="text" count={6} style={{ height: 40, marginBottom: 12 }} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="admin-page">
        <div className="admin-empty">
          <p className="admin-empty__title">Order not found.</p>
          <Button to="/admin/orders" variant="secondary" size="small" style={{ marginTop: 12 }}>
            Back to Orders
          </Button>
        </div>
      </div>
    );
  }

  const items = order.items || [];
  const addr = order.shipping_address;

  return (
    <div className="admin-page order-detail">

      {/* Header */}
      <div className="admin-page-header">
        <div className="admin-page-header__info">
          <h2 className="admin-page-header__title">{order.order_number}</h2>
          <p className="admin-page-header__desc">
            Placed {formatDate(order.created_at)}
            {order.order_type === 'walk_in' && ' · Walk-in order'}
          </p>
        </div>
        <div className="admin-page-header__actions">
          {hasChanges && (
            <Button variant="primary" size="small" onClick={handleSave} loading={saving}>
              Save Changes
            </Button>
          )}
        </div>
      </div>

      <div className="order-detail__body">

        {/* ─── Left: items + customer ─── */}
        <div className="order-detail__main">

          {/* Status + Type badges */}
          <div className="order-detail__badges">
            <span className={`admin-status admin-status--${order.status}`}>
              {getStatusLabel(order.status)}
            </span>
            <span className={`admin-type ${order.order_type === 'walk_in' ? 'admin-type--walk_in' : ''}`}>
              {order.order_type === 'walk_in' ? 'Walk-in' : 'Online'}
            </span>
            <span className={`admin-status admin-status--${order.payment_status === 'paid' ? 'paid' : 'failed'}`}>
              {order.payment_status === 'paid' ? 'Paid' : order.payment_status}
            </span>
          </div>

          {/* Order Items */}
          <div className="admin-card admin-card--flush">
            <div className="admin-card__header">
              <span className="admin-card__title">
                Items ({items.length})
              </span>
            </div>
            <div className="order-detail__items">
              {items.map((item, i) => (
                <div key={i} className="order-detail__item">
                  {item.image_url ? (
                    <img src={item.image_url} alt="" className="order-detail__item-img" />
                  ) : (
                    <div className="order-detail__item-img order-detail__item-img--empty" />
                  )}
                  <div className="order-detail__item-info">
                    <span className="order-detail__item-name">{item.name}</span>
                    <span className="order-detail__item-meta">
                      Size {item.size}
                      {item.color && ` · ${item.color}`}
                      {item.quantity > 1 && ` · Qty ${item.quantity}`}
                    </span>
                  </div>
                  <span className="order-detail__item-price">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Info */}
          <div className="admin-card">
            <h3 className="admin-form-section__title">Customer</h3>
            <div className="order-detail__fields">
              <div className="admin-field">
                <span className="admin-field__label">Email</span>
                <span className="admin-field__value">{order.guest_email || order.customer?.full_name || '—'}</span>
              </div>
              {order.customer && (
                <div className="admin-field">
                  <span className="admin-field__label">Name</span>
                  <span className="admin-field__value">{order.customer.full_name || '—'}</span>
                </div>
              )}
              {order.customer?.phone && (
                <div className="admin-field">
                  <span className="admin-field__label">Phone</span>
                  <span className="admin-field__value">{order.customer.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Shipping Address (not shown for walk-in) */}
          {addr && order.order_type !== 'walk_in' && (
            <div className="admin-card">
              <h3 className="admin-form-section__title">Shipping Address</h3>
              <div className="order-detail__address">
                <p>{addr.name || addr.full_name}</p>
                <p>{addr.street}</p>
                <p>{addr.city}, {addr.state}{addr.lga ? `, ${addr.lga}` : ''}</p>
                {addr.phone && <p>{addr.phone}</p>}
              </div>
            </div>
          )}
        </div>

        {/* ─── Right: totals, status update, tracking, notes ─── */}
        <div className="order-detail__side">

          {/* Totals */}
          <div className="admin-card">
            <h3 className="admin-form-section__title">Summary</h3>
            <div className="order-detail__totals">
              <div className="order-detail__total-row">
                <span>Subtotal</span>
                <span className="admin-field__value--mono">{formatPrice(order.subtotal)}</span>
              </div>
              <div className="order-detail__total-row">
                <span>Shipping</span>
                <span className="admin-field__value--mono">
                  {order.shipping_cost ? formatPrice(order.shipping_cost) : 'Free'}
                </span>
              </div>
              {order.discount_amount > 0 && (
                <div className="order-detail__total-row">
                  <span>Discount{order.discount_code ? ` (${order.discount_code})` : ''}</span>
                  <span className="admin-field__value--mono" style={{ color: 'var(--bt-success)' }}>
                    -{formatPrice(order.discount_amount)}
                  </span>
                </div>
              )}
              <div className="order-detail__total-row order-detail__total-row--final">
                <span>Total</span>
                <span className="admin-field__value--mono">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="admin-card">
            <h3 className="admin-form-section__title">Payment</h3>
            <div className="order-detail__fields">
              <div className="admin-field">
                <span className="admin-field__label">Method</span>
                <span className="admin-field__value">{getPaymentLabel(order.payment_method)}</span>
              </div>
              <div className="admin-field">
                <span className="admin-field__label">Status</span>
                <span className="admin-field__value">{order.payment_status}</span>
              </div>
              {order.payment_reference && (
                <div className="admin-field">
                  <span className="admin-field__label">Reference</span>
                  <span className="admin-field__value admin-field__value--mono" style={{ fontSize: 11, wordBreak: 'break-all' }}>
                    {order.payment_reference}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Status Update */}
          <div className="admin-card">
            <h3 className="admin-form-section__title">Update Status</h3>
            <Select
              label="Order Status"
              options={STATUS_FLOW.map((s) => ({ value: s, label: getStatusLabel(s) }))}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              placeholder={null}
            />

            {/* Tracking number: visible when shipped */}
            {(status === 'shipped' || status === 'delivered') && (
              <div style={{ marginTop: 12 }}>
                <Input
                  label="Tracking Number"
                  value={tracking}
                  onChange={(e) => setTracking(e.target.value)}
                  placeholder="Enter tracking number"
                />
              </div>
            )}
          </div>

          {/* Admin Notes */}
          <div className="admin-card">
            <h3 className="admin-form-section__title">Notes</h3>
            <textarea
              className="admin-textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal notes (not visible to customer)."
              rows={3}
            />
          </div>

          {/* Timestamps */}
          <div className="admin-card">
            <h3 className="admin-form-section__title">Timeline</h3>
            <div className="order-detail__timeline">
              <TimelineRow label="Created" date={order.created_at} />
              {order.shipped_at && <TimelineRow label="Shipped" date={order.shipped_at} />}
              {order.delivered_at && <TimelineRow label="Delivered" date={order.delivered_at} />}
            </div>
          </div>

          {/* Save bar (mobile) */}
          {hasChanges && (
            <div className="order-detail__save-mobile">
              <Button variant="primary" fullWidth onClick={handleSave} loading={saving}>
                Save Changes
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TimelineRow({ label, date }) {
  return (
    <div className="order-detail__timeline-row">
      <span className="order-detail__timeline-dot" />
      <div>
        <span className="order-detail__timeline-label">{label}</span>
        <span className="order-detail__timeline-date">{formatDate(date)}</span>
      </div>
    </div>
  );
}
