/*
 * BLACKTRIBE FASHION — ADMIN: Customer Detail
 *
 * Full customer profile:
 *   - Contact info (name, email, phone)
 *   - Lifetime stats (orders, total spent, avg order)
 *   - Full order history
 *   - Addresses
 *
 * Route: /admin/customers/:id
 */

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import { useToast } from '../../components/ui/Toast';
import '../../styles/admin/admin-orders.css';
import '../../styles/admin/admin-customers.css';

function formatPrice(kobo) {
  if (!kobo && kobo !== 0) return '₦0';
  return '₦' + Math.floor(kobo / 100).toLocaleString('en-NG');
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function getStatusLabel(s) {
  const map = { pending: 'Pending', confirmed: 'Confirmed', processing: 'Processing', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled' };
  return map[s] || s;
}

export default function CustomerDetail() {
  const { id } = useParams();
  const { addToast } = useToast();
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Customer Detail. BlackTribe Admin.';
    fetchCustomer();
  }, [id]);

  async function getToken() {
    return (await import('../../store/authStore')).default.getState().getAccessToken();
  }

  async function fetchCustomer() {
    try {
      const token = await getToken();

      /* Fetch customer profile */
      const profileRes = await fetch(`/api/admin/customers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const profileJson = await profileRes.json();

      if (profileJson.success) {
        setCustomer(profileJson.data);
        setOrders(profileJson.data.orders || []);
      } else {
        addToast('Customer not found.', 'error');
      }
    } catch {
      addToast('Failed to load customer.', 'error');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="admin-page">
        <Skeleton type="text" style={{ width: '40%', height: 24, marginBottom: 16 }} />
        <Skeleton type="text" count={4} style={{ height: 40, marginBottom: 12 }} />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="admin-page">
        <div className="admin-empty">
          <p className="admin-empty__title">Customer not found.</p>
          <Button to="/admin/customers" variant="secondary" size="small" style={{ marginTop: 12 }}>
            Back to Customers
          </Button>
        </div>
      </div>
    );
  }

  const totalSpent = orders.reduce((sum, o) => o.payment_status === 'paid' ? sum + (o.total || 0) : sum, 0);
  const paidOrders = orders.filter((o) => o.payment_status === 'paid');
  const avgOrder = paidOrders.length > 0 ? Math.round(totalSpent / paidOrders.length) : 0;

  return (
    <div className="admin-page customer-detail">
      <div className="admin-page-header">
        <div className="admin-page-header__info">
          <h2 className="admin-page-header__title">{customer.full_name || customer.email}</h2>
          <p className="admin-page-header__desc">
            Customer since {formatDate(customer.created_at)}
          </p>
        </div>
      </div>

      <div className="order-detail__body">
        {/* Left: orders */}
        <div className="order-detail__main">

          {/* Stats row */}
          <div className="cust-stats">
            <div className="cust-stat">
              <span className="cust-stat__value">{orders.length}</span>
              <span className="cust-stat__label">Orders</span>
            </div>
            <div className="cust-stat">
              <span className="cust-stat__value">{formatPrice(totalSpent)}</span>
              <span className="cust-stat__label">Total Spent</span>
            </div>
            <div className="cust-stat">
              <span className="cust-stat__value">{formatPrice(avgOrder)}</span>
              <span className="cust-stat__label">Avg Order</span>
            </div>
          </div>

          {/* Order history */}
          <div className="admin-card admin-card--flush">
            <div className="admin-card__header">
              <span className="admin-card__title">Order History ({orders.length})</span>
            </div>
            {orders.length === 0 ? (
              <div className="admin-empty" style={{ padding: '32px 20px' }}>
                <p className="admin-empty__title">No orders yet.</p>
              </div>
            ) : (
              <div className="cust-orders">
                {orders.map((o) => (
                  <Link key={o.id} to={`/admin/orders/${o.id}`} className="cust-order">
                    <div className="cust-order__left">
                      <span className="cust-order__number">{o.order_number}</span>
                      <span className="cust-order__date">{formatDate(o.created_at)}</span>
                    </div>
                    <div className="cust-order__right">
                      <span className="cust-order__total">{formatPrice(o.total)}</span>
                      <span className={`admin-status admin-status--${o.status}`}>
                        {getStatusLabel(o.status)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: contact info */}
        <div className="order-detail__side">
          <div className="admin-card">
            <h3 className="admin-form-section__title">Contact</h3>
            <div className="order-detail__fields">
              {customer.full_name && (
                <div className="admin-field">
                  <span className="admin-field__label">Name</span>
                  <span className="admin-field__value">{customer.full_name}</span>
                </div>
              )}
              <div className="admin-field">
                <span className="admin-field__label">Email</span>
                <span className="admin-field__value">{customer.email}</span>
              </div>
              {customer.phone && (
                <div className="admin-field">
                  <span className="admin-field__label">Phone</span>
                  <span className="admin-field__value">{customer.phone}</span>
                </div>
              )}
              <div className="admin-field">
                <span className="admin-field__label">Joined</span>
                <span className="admin-field__value">{formatDate(customer.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Addresses */}
          {customer.addresses && customer.addresses.length > 0 && (
            <div className="admin-card">
              <h3 className="admin-form-section__title">Addresses</h3>
              {customer.addresses.map((addr, i) => (
                <div key={i} className="order-detail__address" style={{ marginBottom: i < customer.addresses.length - 1 ? 16 : 0 }}>
                  {addr.label && <p style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--bt-text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>{addr.label}{addr.is_default ? ' (Default)' : ''}</p>}
                  <p>{addr.full_name}</p>
                  <p>{addr.street}</p>
                  <p>{addr.city}, {addr.state}{addr.lga ? `, ${addr.lga}` : ''}</p>
                  {addr.phone && <p>{addr.phone}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
