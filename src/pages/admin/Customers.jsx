/*
 * BLACKTRIBE FASHION — ADMIN CUSTOMERS
 *
 * List of all customers with aggregated order data.
 * Search by name or email. Click row to see customer detail.
 *
 * Fetches from GET /api/admin/customers.
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import Input from '../../components/ui/Input';
import Skeleton from '../../components/ui/Skeleton';
import { useToast } from '../../components/ui/Toast';
import '../../styles/admin/admin-customers.css';

function formatPrice(kobo) {
  if (!kobo && kobo !== 0) return '₦0';
  return '₦' + Math.floor(kobo / 100).toLocaleString('en-NG');
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Customers. BlackTribe Admin.';
    fetchCustomers();
  }, []);

  async function getToken() {
    return (await import('../../store/authStore')).default.getState().getAccessToken();
  }

  async function fetchCustomers() {
    try {
      const token = await getToken();
      const res = await fetch('/api/admin/customers', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setCustomers(json.data || []);
      } else {
        addToast('Failed to load customers.', 'error');
      }
    } catch {
      addToast('Unable to connect.', 'error');
    } finally {
      setLoading(false);
    }
  }

  const filtered = search
    ? customers.filter((c) => {
        const term = search.toLowerCase();
        return (
          (c.full_name || '').toLowerCase().includes(term) ||
          (c.email || '').toLowerCase().includes(term)
        );
      })
    : customers;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div className="admin-page-header__info">
          <h2 className="admin-page-header__title">Customers</h2>
          <p className="admin-page-header__desc">
            {customers.length} registered {customers.length === 1 ? 'customer' : 'customers'}
          </p>
        </div>
      </div>

      <div className="admin-toolbar">
        <div className="admin-toolbar__search">
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <CustomersSkeleton />
      ) : filtered.length === 0 ? (
        <div className="admin-empty">
          <p className="admin-empty__title">
            {search ? 'No customers match your search.' : 'No customers yet.'}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="customers-table-wrap">
            <div className="admin-card admin-card--flush">
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Email</th>
                      <th>Orders</th>
                      <th>Total Spent</th>
                      <th>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c) => (
                      <tr
                        key={c.id}
                        onClick={() => navigate(`/admin/customers/${c.id}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>
                          <span className="admin-table__primary">{c.full_name || '—'}</span>
                        </td>
                        <td>{c.email}</td>
                        <td className="admin-table__mono">{c.order_count || 0}</td>
                        <td className="admin-table__mono">{formatPrice(c.total_spent || 0)}</td>
                        <td>{formatDate(c.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Mobile Card List */}
          <div className="customers-card-wrap">
            <div className="admin-card-list">
              {filtered.map((c) => (
                <Link key={c.id} to={`/admin/customers/${c.id}`} className="admin-card-list__item">
                  <div className="admin-card-list__info">
                    <span className="admin-card-list__title">{c.full_name || c.email}</span>
                    <div className="admin-card-list__meta">
                      <span>{c.order_count || 0} orders</span>
                      <span>{formatPrice(c.total_spent || 0)}</span>
                      <span>{formatDate(c.created_at)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function CustomersSkeleton() {
  return (
    <div className="admin-card-list">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="admin-card-list__item" style={{ pointerEvents: 'none' }}>
          <div style={{ flex: 1 }}>
            <Skeleton type="text" style={{ width: '60%', height: 14, marginBottom: 6 }} />
            <Skeleton type="text" style={{ width: '40%', height: 12 }} />
          </div>
        </div>
      ))}
    </div>
  );
}
