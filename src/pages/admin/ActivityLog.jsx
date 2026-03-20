/*
 * BLACKTRIBE FASHION — ADMIN ACTIVITY LOG
 *
 * Superadmin only. Timeline of all admin actions.
 * Filters by user, action type, date range.
 */

import { useState, useEffect } from 'react';
import useAuthStore from '../../store/authStore';
import '../../styles/admin/admin-settings.css';

/* ─── Action labels ─── */

const ACTION_LABELS = {
  'auth.login': 'Signed in',
  'product.created': 'Created product',
  'product.updated': 'Updated product',
  'product.deactivated': 'Deactivated product',
  'order.status_changed': 'Updated order status',
  'order.walkin_created': 'Created walk-in order',
  'staff.created': 'Added staff member',
  'staff.updated': 'Updated staff permissions',
  'staff.revoked': 'Revoked staff access',
  'discount.created': 'Created discount code',
  'discount.updated': 'Updated discount code',
  'collection.created': 'Created collection',
  'collection.updated': 'Updated collection',
  'category.created': 'Created category',
  'category.updated': 'Updated category',
  'shipping.updated': 'Updated shipping rate',
};

const ACTION_COLORS = {
  'auth.login': 'var(--bt-text-muted)',
  'staff.created': '#F59E0B',
  'staff.updated': '#F59E0B',
  'staff.revoked': 'var(--bt-error)',
  'order.status_changed': 'var(--bt-info)',
  'order.walkin_created': 'var(--bt-success)',
  'product.created': 'var(--bt-success)',
  'product.updated': 'var(--bt-text-secondary)',
  'product.deactivated': 'var(--bt-error)',
};

function getActionLabel(action) {
  return ACTION_LABELS[action] || action;
}

function getActionColor(action) {
  return ACTION_COLORS[action] || 'var(--bt-text-secondary)';
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);

  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;

  return d.toLocaleDateString('en-NG', {
    day: 'numeric', month: 'short', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    hour: '2-digit', minute: '2-digit',
  });
}

function formatDetails(details) {
  if (!details || Object.keys(details).length === 0) return null;
  const parts = [];
  if (details.name) parts.push(details.name);
  if (details.order_number) parts.push(details.order_number);
  if (details.email) parts.push(details.email);
  if (details.status) parts.push(`Status: ${details.status}`);
  if (details.code) parts.push(`Code: ${details.code}`);
  if (details.zone) parts.push(details.zone);
  return parts.length > 0 ? parts.join(' · ') : null;
}

export default function ActivityLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const profile = useAuthStore((s) => s.profile);
  const LIMIT = 50;

  useEffect(() => {
    document.title = 'Activity Log. BlackTribe Admin.';
  }, []);

  useEffect(() => { fetchLogs(); }, [filter, page]);

  async function getToken() {
    return (await import('../../store/authStore')).default.getState().getAccessToken();
  }

  async function fetchLogs() {
    setLoading(true);
    try {
      const token = await getToken();
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (filter !== 'all') params.set('action_prefix', filter);

      const res = await fetch(`/api/admin/activity?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setLogs(json.data || []);
        setTotal(json.total || 0);
      }
    } catch { /* */ }
    finally { setLoading(false); }
  }

  /* Guard */
  if (profile?.role !== 'superadmin') {
    return (
      <div className="admin-page">
        <div className="admin-empty">
          <div className="admin-empty__icon"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg></div>
          <p className="admin-empty__title">Superadmin access required</p>
          <p className="admin-empty__desc">Only superadmin accounts can view the activity log.</p>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(total / LIMIT);

  /* Group logs by day */
  const grouped = {};
  logs.forEach((log) => {
    const day = new Date(log.created_at).toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(log);
  });

  const filters = [
    { value: 'all', label: 'All' },
    { value: 'auth', label: 'Auth' },
    { value: 'order', label: 'Orders' },
    { value: 'product', label: 'Products' },
    { value: 'staff', label: 'Staff' },
    { value: 'discount', label: 'Discounts' },
    { value: 'shipping', label: 'Shipping' },
  ];

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div className="admin-page-header__info">
          <h2 className="admin-page-header__title">Activity Log</h2>
          <p className="admin-page-header__desc">
            {total} logged actions. Every admin action is recorded.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="activity-filters">
        {filters.map((f) => (
          <button
            key={f.value}
            className={`activity-filter ${filter === f.value ? 'activity-filter--active' : ''}`}
            onClick={() => { setFilter(f.value); setPage(1); }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="shipping-skeleton">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="shipping-skeleton__row" />)}
        </div>
      ) : logs.length === 0 ? (
        <div className="admin-empty">
          <p className="admin-empty__title">No activity recorded yet</p>
          <p className="admin-empty__desc">Admin actions will appear here as they happen.</p>
        </div>
      ) : (
        <div className="activity-timeline">
          {Object.entries(grouped).map(([day, dayLogs]) => (
            <div key={day} className="activity-day">
              <div className="activity-day__header">{day}</div>
              <div className="activity-day__items">
                {dayLogs.map((log) => {
                  const detailStr = formatDetails(log.details);
                  return (
                    <div key={log.id} className="activity-item">
                      <div className="activity-item__dot" style={{ background: getActionColor(log.action) }} />
                      <div className="activity-item__content">
                        <div className="activity-item__top">
                          <span className="activity-item__action">{getActionLabel(log.action)}</span>
                          <span className="activity-item__time">{formatDate(log.created_at)}</span>
                        </div>
                        {detailStr && <p className="activity-item__details">{detailStr}</p>}
                        <span className="activity-item__user">{log.user_name || log.user_email || 'System'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="admin-pagination">
          <button className="admin-pagination__btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
          <span style={{ fontSize: 12, color: 'var(--bt-text-muted)', fontFamily: 'var(--font-mono)', padding: '0 12px' }}>
            {page} of {totalPages}
          </span>
          <button className="admin-pagination__btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}
