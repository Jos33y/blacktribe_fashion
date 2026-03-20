/*
 * BLACKTRIBE FASHION — ADMIN NEWSLETTER
 *
 * Subscriber list. Search, export CSV, manage opt-outs.
 * Reads from newsletter table via /api/admin/newsletter.
 */

import { useState, useEffect } from 'react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminNewsletter() {
  const [subscribers, setSubscribers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { addToast } = useToast();

  useEffect(() => {
    document.title = 'Newsletter. BlackTribe Admin.';
    fetchSubscribers();
  }, []);

  async function getToken() {
    return (await import('../../store/authStore')).default.getState().getAccessToken();
  }

  async function fetchSubscribers() {
    try {
      const token = await getToken();
      const res = await fetch('/api/admin/newsletter', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setSubscribers(json.data || []);
        setTotal(json.total || 0);
      }
    } catch { addToast('Failed to load subscribers.', 'error'); }
    finally { setLoading(false); }
  }

  function exportCSV() {
    const active = subscribers.filter((s) => s.is_active);
    if (active.length === 0) { addToast('No active subscribers to export.', 'error'); return; }

    const csv = 'email,subscribed_at\n' + active.map((s) =>
      `${s.email},${s.subscribed_at}`
    ).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blacktribe-subscribers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('CSV exported.', 'info');
  }

  const filtered = search
    ? subscribers.filter((s) => s.email.toLowerCase().includes(search.toLowerCase()))
    : subscribers;

  const activeCount = subscribers.filter((s) => s.is_active).length;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div className="admin-page-header__info">
          <h2 className="admin-page-header__title">Newsletter</h2>
          <p className="admin-page-header__desc">
            {activeCount} active subscribers of {total} total
          </p>
        </div>
        <div className="admin-page-header__actions">
          <Button variant="secondary" size="small" onClick={exportCSV}>
            Export CSV
          </Button>
        </div>
      </div>

      <div className="admin-toolbar">
        <div className="admin-toolbar__search">
          <Input placeholder="Search email..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <p style={{ color: 'var(--bt-text-muted)', fontSize: 13 }}>Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="admin-empty">
          <p className="admin-empty__title">{search ? 'No subscribers match.' : 'No subscribers yet.'}</p>
        </div>
      ) : (
        <div className="admin-card admin-card--flush">
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Subscribed</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id}>
                    <td className="admin-table__primary">{s.email}</td>
                    <td>
                      <span className={`admin-status ${s.is_active ? 'admin-status--confirmed' : 'admin-status--cancelled'}`}>
                        {s.is_active ? 'Active' : 'Unsubscribed'}
                      </span>
                    </td>
                    <td>{formatDate(s.subscribed_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
