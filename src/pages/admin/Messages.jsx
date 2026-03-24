/*
 * BLACKTRIBE FASHION — ADMIN CONTACT MESSAGES
 *
 * Lists contact form submissions from the database.
 * Click to expand and read. Mark as read/unread.
 * Accessible from Settings page.
 * Route: /admin/messages
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Skeleton from '../../components/ui/Skeleton';
import { useToast } from '../../components/ui/Toast';
import '../../styles/admin/admin-shared.css';

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

function timeAgo(dateStr) {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(dateStr);
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Messages' },
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' },
];

export default function AdminMessages() {
  const [messages, setMessages] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const { addToast } = useToast();

  useEffect(() => {
    document.title = 'Messages. BlackTribe Admin.';
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [statusFilter]);

  async function getToken() {
    return (await import('../../store/authStore')).default.getState().getAccessToken();
  }

  async function fetchMessages() {
    setLoading(true);
    try {
      const token = await getToken();
      const params = new URLSearchParams({ limit: '50' });
      if (statusFilter) params.set('status', statusFilter);

      const res = await fetch(`/api/contact/messages?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setMessages(json.data || []);
        setTotal(json.total || 0);
      }
    } catch {
      addToast('Failed to load messages.', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function toggleRead(msg, e) {
    e.stopPropagation();
    try {
      const token = await getToken();
      const res = await fetch(`/api/contact/messages/${msg.id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_read: !msg.is_read }),
      });
      const json = await res.json();
      if (json.success) {
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, is_read: !msg.is_read } : m))
        );
      }
    } catch {
      addToast('Failed to update.', 'error');
    }
  }

  function handleExpand(msg) {
    if (expandedId === msg.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(msg.id);

    /* Auto-mark as read when expanded */
    if (!msg.is_read) {
      const token = getToken().then((t) => {
        fetch(`/api/contact/messages/${msg.id}`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_read: true }),
        }).catch(() => {});
      });
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, is_read: true } : m))
      );
    }
  }

  const unreadCount = messages.filter((m) => !m.is_read).length;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div className="admin-page-header__info">
          <h2 className="admin-page-header__title">Messages</h2>
          <p className="admin-page-header__desc">
            {total} {total === 1 ? 'message' : 'messages'}
            {unreadCount > 0 && ` · ${unreadCount} unread`}
          </p>
        </div>
      </div>

      <div className="admin-toolbar">
        <div className="admin-toolbar__filters">
          <Select
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            placeholder={null}
          />
        </div>
      </div>

      {loading ? (
        <div className="admin-card-list">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="admin-card-list__item" style={{ pointerEvents: 'none' }}>
              <div style={{ flex: 1 }}>
                <Skeleton type="text" style={{ width: '50%', height: 14, marginBottom: 6 }} />
                <Skeleton type="text" style={{ width: '70%', height: 12 }} />
              </div>
            </div>
          ))}
        </div>
      ) : messages.length === 0 ? (
        <div className="admin-empty">
          <p className="admin-empty__title">
            {statusFilter ? 'No messages match this filter.' : 'No messages yet.'}
          </p>
          <p className="admin-empty__desc">Contact form submissions will appear here.</p>
        </div>
      ) : (
        <div className="admin-card-list">
          {messages.map((msg) => (
            <div key={msg.id}>
              <div
                className="admin-card-list__item"
                onClick={() => handleExpand(msg)}
                style={{ cursor: 'pointer' }}
              >
                <div className="admin-card-list__info" style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {!msg.is_read && (
                      <span style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: 'var(--bt-interactive)', flexShrink: 0,
                      }} />
                    )}
                    <span className="admin-card-list__title" style={{ fontWeight: msg.is_read ? 400 : 600 }}>
                      {msg.name}
                    </span>
                  </div>
                  <div className="admin-card-list__meta">
                    <span>{msg.email}</span>
                    <span>{timeAgo(msg.created_at)}</span>
                  </div>
                  <p style={{
                    fontSize: 13, color: 'var(--bt-text-secondary)', marginTop: 4,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    maxWidth: '100%',
                  }}>
                    {msg.message}
                  </p>
                </div>
                <button
                  onClick={(e) => toggleRead(msg, e)}
                  style={{
                    background: 'none', border: 'none', color: 'var(--bt-text-muted)',
                    fontSize: 11, fontFamily: 'var(--font-mono)', cursor: 'pointer',
                    padding: '4px 8px', flexShrink: 0, letterSpacing: '0.04em',
                  }}
                  title={msg.is_read ? 'Mark as unread' : 'Mark as read'}
                >
                  {msg.is_read ? 'UNREAD' : 'READ'}
                </button>
              </div>

              {/* Expanded message */}
              {expandedId === msg.id && (
                <div style={{
                  padding: '16px 20px 20px',
                  background: 'var(--bt-surface)',
                  borderBottom: '1px solid var(--bt-border)',
                  marginTop: -1,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--bt-text)', marginBottom: 2 }}>{msg.name}</p>
                      <a href={`mailto:${msg.email}`} style={{ fontSize: 13, color: 'var(--bt-text-secondary)', textDecoration: 'underline', textUnderlineOffset: 3 }}>
                        {msg.email}
                      </a>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--bt-text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {formatDate(msg.created_at)} {formatTime(msg.created_at)}
                    </span>
                  </div>
                  <p style={{ fontSize: 14, color: 'var(--bt-text)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                    {msg.message}
                  </p>
                  <div style={{ marginTop: 16 }}>
                    <a
                      href={`mailto:${msg.email}?subject=Re: Your message to BlackTribe Fashion`}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '8px 16px', border: '1px solid var(--bt-border-hover)',
                        color: 'var(--bt-text)', fontSize: 12, fontFamily: 'var(--font-body)',
                        fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase',
                        textDecoration: 'none',
                      }}
                    >
                      Reply
                    </a>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
