/*
 * BLACKTRIBE FASHION — ADMIN NOTIFICATIONS
 *
 * Dropdown panel triggered by the bell icon in the topbar.
 *
 * Data sources (all from existing /api/admin/stats):
 *   - Recent orders (last 24h) → "New order" notifications
 *   - Low stock alerts → "Low stock" warnings
 *
 * Read tracking:
 *   - localStorage stores timestamp of last view
 *   - Items newer than that timestamp show as "unread"
 *   - Opening the panel marks everything as read
 *
 * No database table needed. Lightweight, real-time-ish (polls on open).
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';
import useAuthStore from '../../store/authStore';
import '../../styles/admin/admin-notifications.css';

/* ═══ ICONS ═══ */

const NI = {
  order: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 8l-2-4H5L3 8" /><path d="M3 8h18v11a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
      <path d="M12 12v4" />
    </svg>
  ),
  stock: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  walkin: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" />
    </svg>
  ),
  empty: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  ),
  check: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
};


/* ═══ HELPERS ═══ */

const SEEN_KEY = 'bt-admin-notif-seen';

function getLastSeen() {
  try {
    const ts = localStorage.getItem(SEEN_KEY);
    return ts ? new Date(ts) : new Date(0);
  } catch { return new Date(0); }
}

function markAsSeen() {
  try {
    localStorage.setItem(SEEN_KEY, new Date().toISOString());
  } catch { /* silent */ }
}

function formatPrice(kobo) {
  if (!kobo && kobo !== 0) return '₦0';
  return '₦' + Math.floor(kobo / 100).toLocaleString('en-NG');
}

function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}


/* ═══ COMPONENT ═══ */

export default function AdminNotifications({ isOpen, onClose, onUnreadCount }) {
  const navigate = useNavigate();
  const panelRef = useRef(null);

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastSeen, setLastSeen] = useState(getLastSeen);

  /* Fetch on open */
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  /* Close on outside click */
  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose();
      }
    }
    /* Delay to avoid catching the open click */
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
    }, 50);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [isOpen, onClose]);

  /* Close on Escape */
  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  async function fetchNotifications() {
    setLoading(true);
    try {
      const token = await useAuthStore.getState().getAccessToken();
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        buildNotifications(json.data);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }

  function buildNotifications(data) {
    const items = [];
    const now = new Date();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);

    /* Recent orders (last 24h) */
    (data.recentOrders || []).forEach((order) => {
      const created = new Date(order.created_at);
      if (created >= oneDayAgo) {
        const isWalkIn = order.order_type === 'walk_in';
        items.push({
          id: `order-${order.id}`,
          type: isWalkIn ? 'walkin' : 'order',
          title: isWalkIn ? 'Walk-in order' : 'New online order',
          subtitle: `${order.order_number} · ${formatPrice(order.total)}`,
          time: order.created_at,
          route: `/admin/orders/${order.id}`,
          isNew: created > lastSeen,
        });
      }
    });

    /* Low stock alerts */
    (data.lowStockAlerts || []).forEach((alert) => {
      items.push({
        id: `stock-${alert.product_id}-${alert.size}`,
        type: 'stock',
        title: 'Low stock',
        subtitle: `${alert.product_name} · ${alert.size} · ${alert.stock} left`,
        time: null,
        route: `/admin/products`,
        isNew: true, /* Stock alerts are always "active" until resolved */
      });
    });

    /* Sort: new items first, then by time */
    items.sort((a, b) => {
      if (a.isNew && !b.isNew) return -1;
      if (!a.isNew && b.isNew) return 1;
      if (a.time && b.time) return new Date(b.time) - new Date(a.time);
      return 0;
    });

    setNotifications(items);

    /* Report unread count */
    const unread = items.filter((n) => n.isNew).length;
    if (onUnreadCount) onUnreadCount(unread);
  }

  function handleMarkAllRead() {
    markAsSeen();
    setLastSeen(new Date());
    setNotifications((prev) => prev.map((n) => ({ ...n, isNew: false })));
    if (onUnreadCount) onUnreadCount(0);
  }

  function handleClickNotif(notif) {
    navigate(notif.route);
    onClose();
  }

  /* Also check unread count on mount (for the badge dot) */
  useEffect(() => {
    checkUnreadCount();
  }, []);

  async function checkUnreadCount() {
    try {
      const token = await useAuthStore.getState().getAccessToken();
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        const data = json.data;
        const seen = getLastSeen();
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        let count = 0;

        (data.recentOrders || []).forEach((order) => {
          const created = new Date(order.created_at);
          if (created >= oneDayAgo && created > seen) count++;
        });

        count += (data.lowStockAlerts || []).length;

        if (onUnreadCount) onUnreadCount(count);
      }
    } catch { /* silent */ }
  }

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => n.isNew).length;

  return (
    <div className="notif" ref={panelRef} role="dialog" aria-label="Notifications">
      {/* Header */}
      <div className="notif__header">
        <span className="notif__title">Notifications</span>
        {unreadCount > 0 && (
          <button className="notif__mark-read" onClick={handleMarkAllRead}>
            {NI.check}
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Body */}
      <div className="notif__body">
        {loading && notifications.length === 0 && (
          <div className="notif__loading">
            <div className="notif__loading-dot" />
            <div className="notif__loading-dot" />
            <div className="notif__loading-dot" />
          </div>
        )}

        {!loading && notifications.length === 0 && (
          <div className="notif__empty">
            <span className="notif__empty-icon">{NI.empty}</span>
            <p>No notifications right now.</p>
          </div>
        )}

        {notifications.map((notif) => (
          <button
            key={notif.id}
            className={`notif__item ${notif.isNew ? 'notif__item--new' : ''}`}
            onClick={() => handleClickNotif(notif)}
          >
            <span className={`notif__item-icon notif__item-icon--${notif.type}`}>
              {notif.type === 'order' && NI.order}
              {notif.type === 'walkin' && NI.walkin}
              {notif.type === 'stock' && NI.stock}
            </span>
            <div className="notif__item-content">
              <span className="notif__item-title">{notif.title}</span>
              <span className="notif__item-subtitle">{notif.subtitle}</span>
            </div>
            <div className="notif__item-right">
              {notif.time && <span className="notif__item-time">{timeAgo(notif.time)}</span>}
              {notif.isNew && <span className="notif__item-dot" />}
            </div>
          </button>
        ))}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="notif__footer">
          <button className="notif__footer-link" onClick={() => { navigate('/admin/orders'); onClose(); }}>
            View all orders
          </button>
        </div>
      )}
    </div>
  );
}
