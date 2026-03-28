/*
 * BLACKTRIBE FASHION — ADMIN DASHBOARD v2
 *
 * v2: Quick Actions above Recent Orders on mobile.
 * Quick Actions rendered as standalone section, moves to sidebar on desktop via CSS.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useToast } from '../../components/ui/Toast';
import Skeleton from '../../components/ui/Skeleton';
import '../../styles/admin/admin-dashboard.css';

function formatPrice(kobo) {
  if (!kobo && kobo !== 0) return '₦0';
  return '₦' + Math.floor(kobo / 100).toLocaleString('en-NG');
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function getStatusClass(status) {
  return { pending: 'pending', confirmed: 'confirmed', processing: 'processing', shipped: 'shipped', delivered: 'delivered', cancelled: 'cancelled' }[status] || 'pending';
}

function getStatusLabel(status) {
  return { pending: 'Pending', confirmed: 'Confirmed', processing: 'Processing', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled' }[status] || status;
}

const I = {
  revenue: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>),
  orders: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 8l-2-4H5L3 8"/><path d="M3 8h18v11a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/></svg>),
  products: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><circle cx="7" cy="7" r="1" fill="currentColor" stroke="none"/></svg>),
  customers: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>),
  alert: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>),
  plus: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>),
  chevron: (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="9 18 15 12 9 6"/></svg>),
  analytics: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>),
};

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => { document.title = 'Dashboard. BlackTribe Admin.'; fetchStats(); }, []);

  async function fetchStats() {
    try {
      const token = (await import('../../store/authStore')).default.getState().getAccessToken();
      const res = await fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.success) setData(json.data);
      else addToast('Failed to load dashboard data.', 'error');
    } catch { addToast('Unable to connect.', 'error'); }
    finally { setLoading(false); }
  }

  if (loading) return <DashboardSkeleton />;

  const revenue = data?.revenue || {};
  const orders = data?.orders || {};
  const recent = data?.recentOrders || [];
  const alerts = data?.lowStockAlerts || [];
  const totalProducts = data?.totalProducts || 0;
  const totalCustomers = data?.totalCustomers || 0;
  const pendingCount = orders.byStatus?.pending || 0;
  const processingCount = orders.byStatus?.processing || 0;

  return (
    <div className="admin-page dash">

      {/* ─── Revenue Stats ─── */}
      <div className="dash-stats">
        {[
          { label: 'Today', value: formatPrice(revenue.today) },
          { label: 'This Week', value: formatPrice(revenue.week) },
          { label: 'This Month', value: formatPrice(revenue.month) },
          { label: 'All Time', value: formatPrice(revenue.allTime) },
        ].map((s) => (
          <div key={s.label} className="dash-stat">
            <div className="dash-stat__header">
              <span className="dash-stat__icon">{I.revenue}</span>
              <span className="dash-stat__label">{s.label}</span>
            </div>
            <span className="dash-stat__value">{s.value}</span>
          </div>
        ))}
      </div>

      {/* ─── Overview Cards ─── */}
      <div className="dash-overview">
        <Link to="/admin/orders" className="dash-ov">
          <span className="dash-ov__icon">{I.orders}</span>
          <div className="dash-ov__content">
            <span className="dash-ov__value">{orders.total || 0}</span>
            <span className="dash-ov__label">Total Orders</span>
            <span className="dash-ov__sub">{orders.online || 0} online, {orders.walkIn || 0} walk-in</span>
          </div>
          <span className="dash-ov__chevron">{I.chevron}</span>
        </Link>
        <Link to="/admin/products" className="dash-ov">
          <span className="dash-ov__icon">{I.products}</span>
          <div className="dash-ov__content">
            <span className="dash-ov__value">{totalProducts}</span>
            <span className="dash-ov__label">Products</span>
          </div>
          <span className="dash-ov__chevron">{I.chevron}</span>
        </Link>
        <Link to="/admin/customers" className="dash-ov">
          <span className="dash-ov__icon">{I.customers}</span>
          <div className="dash-ov__content">
            <span className="dash-ov__value">{totalCustomers}</span>
            <span className="dash-ov__label">Customers</span>
          </div>
          <span className="dash-ov__chevron">{I.chevron}</span>
        </Link>
        <Link to="/admin/orders?status=pending,processing" className={`dash-ov ${(pendingCount + processingCount) > 0 ? 'dash-ov--highlight' : ''}`}>
          <span className="dash-ov__icon">{I.alert}</span>
          <div className="dash-ov__content">
            <span className="dash-ov__value">{pendingCount + processingCount}</span>
            <span className="dash-ov__label">Needs Attention</span>
            <span className="dash-ov__sub">{pendingCount} pending, {processingCount} processing</span>
          </div>
          <span className="dash-ov__chevron">{I.chevron}</span>
        </Link>
      </div>

      {/* ─── Quick Actions (mobile: here, desktop: moves to sidebar via CSS) ─── */}
      <div className="dash-quick-mobile">
        <div className="admin-card">
          <h3 className="dash-section-title">Quick Actions</h3>
          <div className="dash-actions">
            <Link to="/admin/orders/new" className="dash-action dash-action--primary">{I.plus} <span>New Walk-in Order</span></Link>
            <Link to="/admin/products/new" className="dash-action">{I.plus} <span>Add Product</span></Link>
            <Link to="/admin/orders" className="dash-action">{I.orders} <span>View All Orders</span></Link>
            <Link to="/admin/analytics" className="dash-action">{I.analytics} <span>Analytics</span></Link>
          </div>
        </div>
      </div>

      {/* ─── Two Column Body ─── */}
      <div className="dash-body">
        <div className="dash-body__main">
          <div className="admin-card admin-card--flush">
            <div className="admin-card__header">
              <span className="admin-card__title">Recent Orders</span>
              <Link to="/admin/orders" className="dash-view-all">View All {I.chevron}</Link>
            </div>
            {recent.length === 0 ? (
              <div className="dash-empty-feed"><p>No orders yet. They will appear here as they come in.</p></div>
            ) : (
              <div className="dash-orders">
                {recent.map((order) => (
                  <Link key={order.id} to={`/admin/orders/${order.id}`} className="dash-order">
                    <div className="dash-order__left">
                      <span className="dash-order__number">{order.order_number}</span>
                      <span className="dash-order__email">{order.guest_email || '—'}</span>
                    </div>
                    <div className="dash-order__middle">
                      <span className={`admin-status admin-status--${getStatusClass(order.status)}`}>{getStatusLabel(order.status)}</span>
                      {order.order_type === 'walk_in' && <span className="admin-type admin-type--walk_in">Walk-in</span>}
                    </div>
                    <div className="dash-order__right">
                      <span className="dash-order__total">{formatPrice(order.total)}</span>
                      <span className="dash-order__time">{formatDate(order.created_at)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="dash-body__side">
          {/* Quick Actions (desktop only — hidden on mobile, shown here in sidebar) */}
          <div className="dash-quick-desktop">
            <div className="admin-card">
              <h3 className="dash-section-title">Quick Actions</h3>
              <div className="dash-actions">
                <Link to="/admin/orders/new" className="dash-action dash-action--primary">{I.plus} <span>New Walk-in Order</span></Link>
                <Link to="/admin/products/new" className="dash-action">{I.plus} <span>Add Product</span></Link>
                <Link to="/admin/orders" className="dash-action">{I.orders} <span>View All Orders</span></Link>
                <Link to="/admin/analytics" className="dash-action">{I.analytics} <span>Analytics</span></Link>
              </div>
            </div>
          </div>

          {/* Stock Alerts */}
          <div className="admin-card">
            <h3 className="dash-section-title">Stock Alerts</h3>
            {alerts.length === 0 ? (
              <p className="dash-no-alerts">All stock levels are healthy.</p>
            ) : (
              <div className="dash-alerts">
                {alerts.map((a, i) => (
                  <Link key={i} to={`/admin/products/${a.product_id}/edit`} className="dash-alert">
                    <div className="dash-alert__info">
                      <span className="dash-alert__name">{a.product_name}</span>
                      <span className="dash-alert__size">Size {a.size}</span>
                    </div>
                    <span className={`dash-alert__count ${a.stock === 0 ? 'dash-alert__count--zero' : ''}`}>{a.stock} left</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Payment Breakdown */}
          <div className="admin-card">
            <h3 className="dash-section-title">Payment Methods</h3>
            <div className="dash-breakdown">
              <div className="dash-breakdown__row">
                <span className="dash-breakdown__label">Online (Paystack)</span>
                <span className="dash-breakdown__value">{orders.online || 0}</span>
              </div>
              <div className="dash-breakdown__row">
                <span className="dash-breakdown__label">Walk-in</span>
                <span className="dash-breakdown__value">{orders.walkIn || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="admin-page dash">
      <div className="dash-stats">{[1, 2, 3, 4].map((i) => (<div key={i} className="dash-stat"><Skeleton type="text" style={{ width: '60%', height: 12, marginBottom: 8 }}/><Skeleton type="text" style={{ width: '80%', height: 28 }}/></div>))}</div>
      <div className="dash-overview">{[1, 2, 3, 4].map((i) => (<Skeleton key={i} type="text" style={{ height: 72, borderRadius: 2 }}/>))}</div>
      <div className="dash-body"><div className="dash-body__main"><div className="admin-card" style={{ padding: 20 }}><Skeleton type="text" count={6} style={{ height: 16, marginBottom: 12 }}/></div></div><div className="dash-body__side"><div className="admin-card" style={{ padding: 20 }}><Skeleton type="text" count={4} style={{ height: 16, marginBottom: 12 }}/></div></div></div>
    </div>
  );
}
