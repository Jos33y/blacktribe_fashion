/*
 * BLACKTRIBE FASHION — ADMIN ORDER DETAIL
 *
 * Single order view. Staff can:
 *   - View all order info (customer, items, totals, payment)
 *   - Update order status (dropdown)
 *   - Add tracking number (when shipped)
 *   - Add delivery info: rider name, phone, method (when shipped)
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
import WalkInReceiptImage from '../../components/admin/WalkInReceiptImage';
import '../../styles/admin/admin-orders.css';

const STATUS_FLOW = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

const DELIVERY_METHODS = [
  { value: '', label: 'Select method' },
  { value: 'bolt', label: 'Bolt' },
  { value: 'uber', label: 'Uber' },
  { value: 'indrive', label: 'InDrive' },
  { value: 'logistics', label: 'Logistics Partner' },
  { value: 'internal', label: 'Internal Dispatch' },
  { value: 'other', label: 'Other' },
];

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
  const [refunding, setRefunding] = useState(false);
  const [showRefundConfirm, setShowRefundConfirm] = useState(false);
  const [refundReason, setRefundReason] = useState('');

  /* Delivery info (Nigerian delivery tracking) */
  const [riderName, setRiderName] = useState('');
  const [riderPhone, setRiderPhone] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('');

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
        /* Load delivery info */
        const di = json.data.delivery_info;
        if (di) {
          setRiderName(di.rider_name || '');
          setRiderPhone(di.rider_phone || '');
          setDeliveryMethod(di.delivery_method || '');
        }
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

    /* Build delivery_info object (only include if any field has data) */
    const hasDeliveryInfo = riderName.trim() || riderPhone.trim() || deliveryMethod;
    const deliveryInfo = hasDeliveryInfo
      ? {
        rider_name: riderName.trim() || null,
        rider_phone: riderPhone.trim() || null,
        delivery_method: deliveryMethod || null,
      }
      : null;

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
          delivery_info: deliveryInfo,
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

  async function handleRefund() {
    setRefunding(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/orders/${id}/refund`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: refundReason.trim() || null }),
      });
      const json = await res.json();
      if (json.success) {
        setOrder(json.data);
        setStatus(json.data.status);
        setShowRefundConfirm(false);
        setRefundReason('');
        addToast('Refund processed.', 'info');
      } else {
        addToast(json.error || 'Refund failed.', 'error');
      }
    } catch {
      addToast('Something went wrong.', 'error');
    } finally {
      setRefunding(false);
    }
  }

  const hasChanges = order && (
    status !== order.status ||
    tracking !== (order.tracking_number || '') ||
    notes !== (order.notes || '') ||
    riderName !== (order.delivery_info?.rider_name || '') ||
    riderPhone !== (order.delivery_info?.rider_phone || '') ||
    deliveryMethod !== (order.delivery_info?.delivery_method || '')
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
  const showDelivery = status === 'shipped' || status === 'delivered';

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
                <span className="admin-field__value">{order.guest_email || order.customer_email || '—'}</span>
              </div>
              {(order.customer?.full_name || order.shipping_address?.name) && (
                <div className="admin-field">
                  <span className="admin-field__label">Name</span>
                  <span className="admin-field__value">{order.customer?.full_name || order.shipping_address?.name || '—'}</span>
                </div>
              )}
              {(order.customer?.phone || order.shipping_address?.phone) && (
                <div className="admin-field">
                  <span className="admin-field__label">Phone</span>
                  <span className="admin-field__value">{order.customer?.phone || order.shipping_address?.phone}</span>
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

        {/* ─── Right: totals, status update, tracking, delivery, notes ─── */}
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

          {/* Refund */}
          {order.payment_status === 'paid' && (
            <div className="admin-card">
              <h3 className="admin-form-section__title">Refund</h3>
              {!showRefundConfirm ? (
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => setShowRefundConfirm(true)}
                  style={{ color: 'var(--bt-error)' }}
                >
                  Process Refund
                </Button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <p style={{ fontSize: 13, color: 'var(--bt-text-secondary)', lineHeight: 1.5 }}>
                    This will {order.payment_method === 'paystack' ? 'refund the customer via Paystack and ' : ''}mark this order as refunded. This action cannot be undone.
                  </p>
                  <textarea
                    className="admin-textarea"
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    placeholder="Reason for refund (optional)"
                    rows={2}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => { setShowRefundConfirm(false); setRefundReason(''); }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="small"
                      onClick={handleRefund}
                      loading={refunding}
                      style={{ background: 'var(--bt-error)', color: '#fff' }}
                    >
                      Confirm Refund — {formatPrice(order.total)}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {order.payment_status === 'refunded' && (
            <div className="admin-card" style={{ borderColor: 'rgba(248, 113, 113, 0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--bt-error)', fontSize: 13, fontWeight: 500 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                Order refunded
              </div>
            </div>
          )}

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

            {/* Tracking number: visible when shipped/delivered */}
            {showDelivery && (
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

          {/* Delivery Info (Nigerian delivery tracking) */}
          {showDelivery && order.order_type !== 'walk_in' && (
            <div className="admin-card">
              <h3 className="admin-form-section__title">Delivery</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Select
                  label="Delivery Method"
                  options={DELIVERY_METHODS}
                  value={deliveryMethod}
                  onChange={(e) => setDeliveryMethod(e.target.value)}
                  placeholder={null}
                />
                <Input
                  label="Rider Name"
                  value={riderName}
                  onChange={(e) => setRiderName(e.target.value)}
                  placeholder="e.g. Chidi"
                />
                <Input
                  label="Rider Phone"
                  type="tel"
                  value={riderPhone}
                  onChange={(e) => setRiderPhone(e.target.value)}
                  placeholder="+234 812 345 6789"
                />
              </div>
            </div>
          )}

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

          {/* Walk-in Receipt (regenerate anytime from order detail) */}
          {order.order_type === 'walk_in' && items.length > 0 && (
            <div className="admin-card">
              <h3 className="admin-form-section__title">Receipt</h3>
              <WalkInReceiptImage order={order} items={items} />
            </div>
          )}

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