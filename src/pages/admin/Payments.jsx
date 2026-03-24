/*
 * BLACKTRIBE FASHION — ADMIN: Payments
 *
 * Payment overview dashboard:
 *   - Revenue cards by status (paid, pending, failed, refunded)
 *   - Payment method breakdown (Paystack, Cash, POS, Transfer)
 *   - Transaction list with filters
 *   - Each transaction links to its order
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import Button from '../../components/ui/Button';
import useAuthStore from '../../store/authStore';
import '../../styles/admin/admin-payments.css';

/* ═══ HELPERS ═══ */

function formatPrice(kobo) {
  if (!kobo && kobo !== 0) return '₦0';
  return '₦' + Math.floor(kobo / 100).toLocaleString('en-NG');
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const METHOD_LABELS = {
  paystack: 'Paystack',
  cash: 'Cash',
  pos_terminal: 'POS Terminal',
  bank_transfer: 'Bank Transfer',
};

const STATUS_LABELS = {
  paid: 'Paid',
  pending: 'Pending',
  failed: 'Failed',
  refunded: 'Refunded',
};

/* ═══ COMPONENT ═══ */

export default function Payments() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: 'all', method: 'all', search: '', period: '30d' });
  const [page, setPage] = useState(1);

  useEffect(() => {
    document.title = 'Payments. BlackTribe Admin.';
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [filter, page]);

  async function fetchPayments() {
    setLoading(true);
    try {
      const token = await useAuthStore.getState().getAccessToken();
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        period: filter.period,
      });
      if (filter.status !== 'all') params.set('status', filter.status);
      if (filter.method !== 'all') params.set('method', filter.method);
      if (filter.search) params.set('search', filter.search);

      const res = await fetch(`/api/admin/payments?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }

  const overview = data?.overview;
  const transactions = data?.transactions || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="admin-page pay">
      {/* Overview Cards */}
      <div className="pay__cards">
        <div className="pay__card pay__card--primary">
          <span className="pay__card-label">Total Processed</span>
          <span className="pay__card-value">{overview ? formatPrice(overview.totalProcessed) : '—'}</span>
          <span className="pay__card-sub">{overview?.totalTransactions || 0} transactions</span>
        </div>
        <div className="pay__card">
          <span className="pay__card-label">Paid</span>
          <span className="pay__card-value pay__card-value--success">{overview ? overview.statusBreakdown.paid : 0}</span>
          <span className="pay__card-sub">{overview ? formatPrice(overview.statusRevenue.paid) : '—'}</span>
        </div>
        <div className="pay__card">
          <span className="pay__card-label">Pending</span>
          <span className="pay__card-value pay__card-value--pending">{overview ? overview.statusBreakdown.pending : 0}</span>
          <span className="pay__card-sub">{overview ? formatPrice(overview.statusRevenue.pending) : '—'}</span>
        </div>
        <div className="pay__card">
          <span className="pay__card-label">Failed</span>
          <span className="pay__card-value pay__card-value--error">{overview ? overview.statusBreakdown.failed : 0}</span>
          <span className="pay__card-sub">{overview ? formatPrice(overview.statusRevenue.failed) : '—'}</span>
        </div>
      </div>

      {/* Payment Method Breakdown */}
      {overview && Object.keys(overview.methodBreakdown).length > 0 && (
        <div className="pay__methods">
          <h3 className="pay__section-title">By Payment Method</h3>
          <div className="pay__method-grid">
            {Object.entries(overview.methodBreakdown).map(([method, info]) => (
              <div key={method} className="pay__method-card">
                <span className="pay__method-name">{METHOD_LABELS[method] || method}</span>
                <span className="pay__method-revenue">{formatPrice(info.revenue)}</span>
                <span className="pay__method-count">{info.count} orders</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="pay__filters">
        <div className="pay__filter-row">
          <input
            type="text"
            className="pay__search"
            placeholder="Search by order number, reference, or email..."
            value={filter.search}
            onChange={(e) => { setFilter({ ...filter, search: e.target.value }); setPage(1); }}
          />
          <select
            className="pay__select"
            value={filter.status}
            onChange={(e) => { setFilter({ ...filter, status: e.target.value }); setPage(1); }}
          >
            <option value="all">All Statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
          <select
            className="pay__select"
            value={filter.method}
            onChange={(e) => { setFilter({ ...filter, method: e.target.value }); setPage(1); }}
          >
            <option value="all">All Methods</option>
            <option value="paystack">Paystack</option>
            <option value="cash">Cash</option>
            <option value="pos_terminal">POS Terminal</option>
            <option value="bank_transfer">Bank Transfer</option>
          </select>
          <select
            className="pay__select"
            value={filter.period}
            onChange={(e) => { setFilter({ ...filter, period: e.target.value }); setPage(1); }}
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </div>
      </div>

      {/* Transaction List */}
      <div className="pay__list">
        {loading && transactions.length === 0 && (
          <div className="pay__loading">Loading transactions...</div>
        )}

        {!loading && transactions.length === 0 && (
          <div className="pay__empty">No transactions found.</div>
        )}

        {transactions.map((tx) => (
          <button
            key={tx.id}
            className="pay__tx"
            onClick={() => navigate(`/admin/orders/${tx.id}`)}
          >
            <div className="pay__tx-left">
              <span className="pay__tx-order">{tx.order_number}</span>
              <span className="pay__tx-meta">
                {METHOD_LABELS[tx.payment_method] || tx.payment_method || 'Paystack'}
                {tx.order_type === 'walk_in' && <span className="pay__tx-tag">Walk-in</span>}
                {tx.payment_reference && (
                  <span className="pay__tx-ref">{tx.payment_reference}</span>
                )}
              </span>
            </div>
            <div className="pay__tx-right">
              <span className="pay__tx-amount">{formatPrice(tx.total)}</span>
              <span className={`pay__tx-status pay__tx-status--${tx.payment_status}`}>
                {STATUS_LABELS[tx.payment_status] || tx.payment_status}
              </span>
              <span className="pay__tx-date">{formatDate(tx.created_at)}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pay__pagination">
          <Button
            variant="secondary"
            size="small"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <span className="pay__page-info">Page {page} of {totalPages}</span>
          <Button
            variant="secondary"
            size="small"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
