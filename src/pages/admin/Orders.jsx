/*
 * BLACKTRIBE FASHION — ADMIN ORDERS LIST
 *
 * Desktop: table with order number, customer, status, type, total, date.
 * Mobile: card list with key info per order.
 * Filters: status, order type (online/walk-in), search by order number or email.
 * Pagination: 20 per page.
 */

import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Skeleton from '../../components/ui/Skeleton';
import { useToast } from '../../components/ui/Toast';
import '../../styles/admin/admin-orders.css';

const LIMIT = 20;

function formatPrice(kobo) {
  if (!kobo && kobo !== 0) return '₦0';
  return '₦' + Math.floor(kobo / 100).toLocaleString('en-NG');
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function getStatusLabel(s) {
  const map = { pending: 'Pending', confirmed: 'Confirmed', processing: 'Processing', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled' };
  return map[s] || s;
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'online', label: 'Online' },
  { value: 'walk_in', label: 'Walk-in' },
];

export default function AdminOrders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const { addToast } = useToast();

  const page = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const orderType = searchParams.get('order_type') || '';

  useEffect(() => {
    document.title = 'Orders. BlackTribe Admin.';
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [page, search, status, orderType]);

  async function getToken() {
    return (await import('../../store/authStore')).default.getState().getAccessToken();
  }

  async function fetchOrders() {
    setLoading(true);
    try {
      const token = await getToken();
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
        ...(search && { search }),
        ...(status && { status }),
        ...(orderType && { order_type: orderType }),
      });
      const res = await fetch(`/api/admin/orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setOrders(json.data || []);
        setTotal(json.total || 0);
      } else {
        addToast('Failed to load orders.', 'error');
      }
    } catch (err) {
      console.error('[orders] fetch error:', err);
      addToast('Unable to connect.', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleExportCSV() {
    setExporting(true);
    try {
      const token = await getToken();
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (orderType) params.set('order_type', orderType);

      const res = await fetch(`/api/admin/orders/export/csv?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      /* Backend returns 404 JSON when no orders to export */
      if (res.status === 404) {
        addToast('No orders to export.', 'error');
        return;
      }

      if (!res.ok) {
        addToast('Failed to export.', 'error');
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `blacktribe-orders-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addToast('Orders exported.', 'info');
    } catch {
      addToast('Export failed.', 'error');
    } finally {
      setExporting(false);
    }
  }

  function updateFilter(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.set('page', '1');
    setSearchParams(next);
  }

  const totalPages = Math.ceil(total / LIMIT);
  const hasOrders = total > 0;

  return (
    <div className="admin-page">

      {/* Header */}
      <div className="admin-page-header">
        <div className="admin-page-header__info">
          <h2 className="admin-page-header__title">Orders</h2>
          <p className="admin-page-header__desc">
            {total} {total === 1 ? 'order' : 'orders'} total
          </p>
        </div>
        <div className="admin-page-header__actions">
          <Button
            variant="secondary"
            size="small"
            onClick={handleExportCSV}
            disabled={!hasOrders || exporting}
          >
            {exporting ? 'Exporting...' : 'Export CSV'}
          </Button>
          <Button to="/admin/orders/new" variant="primary" size="small">
            + Walk-in Order
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="admin-toolbar">
        <div className="admin-toolbar__search">
          <Input
            placeholder="Search order number or email..."
            value={search}
            onChange={(e) => updateFilter('search', e.target.value)}
          />
        </div>
        <div className="admin-toolbar__filters">
          <Select
            options={STATUS_OPTIONS}
            value={status}
            onChange={(e) => updateFilter('status', e.target.value)}
            placeholder={null}
          />
          <Select
            options={TYPE_OPTIONS}
            value={orderType}
            onChange={(e) => updateFilter('order_type', e.target.value)}
            placeholder={null}
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <OrdersSkeleton />
      ) : orders.length === 0 ? (
        <div className="admin-empty">
          <p className="admin-empty__title">
            {search || status || orderType ? 'No orders match your filters.' : 'No orders yet.'}
          </p>
          <p className="admin-empty__desc">
            Orders will appear here as they come in.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="orders-table-wrap">
            <div className="admin-card admin-card--flush">
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Customer</th>
                      <th>Status</th>
                      <th>Type</th>
                      <th>Payment</th>
                      <th>Total</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id}>
                        <td>
                          <Link to={`/admin/orders/${o.id}`} className="admin-table__primary">
                            {o.order_number}
                          </Link>
                        </td>
                        <td>{o.customer_email || o.guest_email || '—'}</td>
                        <td>
                          <span className={`admin-status admin-status--${o.status}`}>
                            {getStatusLabel(o.status)}
                          </span>
                        </td>
                        <td>
                          <span className={`admin-type ${o.order_type === 'walk_in' ? 'admin-type--walk_in' : ''}`}>
                            {o.order_type === 'walk_in' ? 'Walk-in' : 'Online'}
                          </span>
                        </td>
                        <td>
                          <span className={`admin-status admin-status--${o.payment_status === 'paid' ? 'paid' : 'pending'}`}>
                            {o.payment_status === 'paid' ? 'Paid' : o.payment_status}
                          </span>
                        </td>
                        <td className="admin-table__mono">{formatPrice(o.total)}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <span>{formatDate(o.created_at)}</span>
                          <br />
                          <span style={{ fontSize: 11, color: 'var(--bt-text-muted)' }}>{formatTime(o.created_at)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Mobile Card List */}
          <div className="orders-card-wrap">
            <div className="admin-card-list">
              {orders.map((o) => (
                <Link key={o.id} to={`/admin/orders/${o.id}`} className="admin-card-list__item orders-card">
                  <div className="admin-card-list__info">
                    <div className="orders-card__top">
                      <span className="admin-card-list__title">{o.order_number}</span>
                      <span className="admin-card-list__price">{formatPrice(o.total)}</span>
                    </div>
                    <div className="orders-card__email">{o.customer_email || o.guest_email || '—'}</div>
                    <div className="admin-card-list__meta">
                      <span className={`admin-status admin-status--${o.status}`}>
                        {getStatusLabel(o.status)}
                      </span>
                      {o.order_type === 'walk_in' && (
                        <span className="admin-type admin-type--walk_in">Walk-in</span>
                      )}
                      <span>{formatDate(o.created_at)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="admin-pagination">
              <button
                className="admin-pagination__btn"
                disabled={page <= 1}
                onClick={() => updateFilter('page', String(page - 1))}
              >
                ‹
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let p;
                if (totalPages <= 7) {
                  p = i + 1;
                } else if (page <= 4) {
                  p = i + 1;
                } else if (page >= totalPages - 3) {
                  p = totalPages - 6 + i;
                } else {
                  p = page - 3 + i;
                }
                return (
                  <button
                    key={p}
                    className={`admin-pagination__btn ${p === page ? 'admin-pagination__btn--active' : ''}`}
                    onClick={() => updateFilter('page', String(p))}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                className="admin-pagination__btn"
                disabled={page >= totalPages}
                onClick={() => updateFilter('page', String(page + 1))}
              >
                ›
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function OrdersSkeleton() {
  return (
    <div className="admin-card-list">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="admin-card-list__item" style={{ pointerEvents: 'none' }}>
          <div style={{ flex: 1 }}>
            <Skeleton type="text" style={{ width: '50%', height: 14, marginBottom: 6 }} />
            <Skeleton type="text" style={{ width: '70%', height: 12, marginBottom: 6 }} />
            <Skeleton type="text" style={{ width: '40%', height: 12 }} />
          </div>
        </div>
      ))}
    </div>
  );
}
