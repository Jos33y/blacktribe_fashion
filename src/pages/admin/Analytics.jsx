/*
 * BLACKTRIBE FASHION — ADMIN ANALYTICS v1.1
 *
 * v1.1: Removed duplicate h2 title (topbar already shows "Analytics").
 * Period selector moved to standalone toolbar row.
 */

import { useState, useEffect } from 'react';
import { useToast } from '../../components/ui/Toast';
import Skeleton from '../../components/ui/Skeleton';
import BehavioralAnalytics from '../../components/admin/BehavioralAnalytics';
import '../../styles/admin/admin-analytics.css';

let rechartsModule = null;
const rechartsPromise = import('recharts')
  .then((mod) => { rechartsModule = mod; })
  .catch(() => {});

function formatPrice(kobo) {
  if (!kobo && kobo !== 0) return '₦0';
  return '₦' + Math.floor(kobo / 100).toLocaleString('en-NG');
}

function formatShortPrice(kobo) {
  const naira = Math.floor(kobo / 100);
  if (naira >= 1000000) return '₦' + (naira / 1000000).toFixed(1) + 'M';
  if (naira >= 1000) return '₦' + (naira / 1000).toFixed(0) + 'K';
  return '₦' + naira.toLocaleString('en-NG');
}

function formatDateShort(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

const CHART_COLORS = ['#EDEBE8', '#9B9894', '#6A6662', '#4A4A4A', '#3A3A3A'];
const PERIOD_OPTIONS = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: '1y', label: '1 year' },
];

const tooltipStyle = {
  backgroundColor: '#161616',
  border: '1px solid #2A2A2A',
  borderRadius: '2px',
  padding: '8px 12px',
  fontSize: '12px',
  color: '#EDEBE8',
  fontFamily: "'DM Mono', monospace",
};

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartsReady, setChartsReady] = useState(!!rechartsModule);
  const [period, setPeriod] = useState('30d');
  const [tab, setTab] = useState('revenue');
  const { addToast } = useToast();

  useEffect(() => {
    document.title = 'Analytics. BlackTribe Admin.';
    if (!rechartsModule) {
      rechartsPromise.then(() => { if (rechartsModule) setChartsReady(true); });
    }
  }, []);

  useEffect(() => { fetchAnalytics(); }, [period]);

  async function fetchAnalytics() {
    setLoading(true);
    try {
      const token = (await import('../../store/authStore')).default.getState().getAccessToken();
      const res = await fetch(`/api/admin/analytics?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setData(json.data);
      else addToast('Failed to load analytics.', 'error');
    } catch { addToast('Unable to connect.', 'error'); }
    finally { setLoading(false); }
  }

  const RC = rechartsModule || {};
  const chartsAvailable = chartsReady && !!RC.LineChart;
  const { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis,
          Tooltip, ResponsiveContainer, PieChart, Pie, Cell } = RC;

  if (loading) return <AnalyticsSkeleton />;

  const {
    revenueByDay = [], ordersByDay = [], topProducts = [],
    salesByCategory = [], keyMetrics = {},
    geographicBreakdown = [], customerGrowth = [],
  } = data || {};

  return (
    <div className="admin-page analytics">

      {/* Period selector only — no duplicate title (topbar already shows "Analytics") */}
      <div className="admin-page-header">
        <div className="admin-page-header__info">
          <p className="admin-page-header__desc">
            Sales performance, customer insights, and conversion data.
          </p>
        </div>
        <div className="analytics-period">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`analytics-period__btn ${period === opt.value ? 'analytics-period__btn--active' : ''}`}
              onClick={() => setPeriod(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div className="analytics-tabs">
        <button
          className={`analytics-tabs__btn ${tab === 'revenue' ? 'analytics-tabs__btn--active' : ''}`}
          onClick={() => setTab('revenue')}
        >
          Revenue
        </button>
        <button
          className={`analytics-tabs__btn ${tab === 'behavior' ? 'analytics-tabs__btn--active' : ''}`}
          onClick={() => setTab('behavior')}
        >
          Behavior
        </button>
      </div>

      {/* Behavior tab */}
      {tab === 'behavior' && (
        <BehavioralAnalytics period={period} />
      )}

      {/* Revenue tab */}
      {tab === 'revenue' && (<>

      {!chartsAvailable && (
        <div className="analytics-notice">
          <p>Charts require <code>recharts</code>. Run <code>npm install recharts</code> to enable.</p>
        </div>
      )}

      {/* Key Metrics */}
      <div className="analytics-metrics">
        <MetricCard label="Avg Order Value" value={formatPrice(keyMetrics.avgOrderValue || 0)} />
        <MetricCard label="Repeat Customer Rate" value={`${(keyMetrics.repeatCustomerRate || 0).toFixed(1)}%`} />
        <MetricCard label="Total Revenue" value={formatPrice(keyMetrics.totalRevenue || 0)} />
        <MetricCard label="Total Orders" value={keyMetrics.totalOrders || 0} />
      </div>

      {/* Revenue Chart */}
      <div className="analytics-chart-card">
        <h3 className="analytics-chart-card__title">Revenue</h3>
        {chartsAvailable && revenueByDay.length > 0 ? (
          <div className="analytics-chart">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={revenueByDay}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EDEBE8" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#EDEBE8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tickFormatter={formatDateShort} tick={{ fill: '#6A6662', fontSize: 10, fontFamily: "'DM Mono', monospace" }} axisLine={{ stroke: '#2A2A2A' }} tickLine={false} />
                <YAxis tickFormatter={formatShortPrice} tick={{ fill: '#6A6662', fontSize: 10, fontFamily: "'DM Mono', monospace" }} axisLine={false} tickLine={false} width={60} />
                <Tooltip contentStyle={tooltipStyle} formatter={(val) => [formatPrice(val), 'Revenue']} labelFormatter={formatDateShort} />
                <Area type="monotone" dataKey="total" stroke="#EDEBE8" strokeWidth={2} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <ChartPlaceholder label="Revenue trend" />
        )}
      </div>

      {/* Order Volume + Top Products */}
      <div className="analytics-row">
        <div className="analytics-chart-card">
          <h3 className="analytics-chart-card__title">Order Volume</h3>
          {chartsAvailable && ordersByDay.length > 0 ? (
            <div className="analytics-chart">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={ordersByDay}>
                  <XAxis dataKey="date" tickFormatter={formatDateShort} tick={{ fill: '#6A6662', fontSize: 10, fontFamily: "'DM Mono', monospace" }} axisLine={{ stroke: '#2A2A2A' }} tickLine={false} />
                  <YAxis tick={{ fill: '#6A6662', fontSize: 10, fontFamily: "'DM Mono', monospace" }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" fill="#EDEBE8" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <ChartPlaceholder label="Daily orders" />
          )}
        </div>

        <div className="analytics-chart-card">
          <h3 className="analytics-chart-card__title">Top Products</h3>
          {topProducts.length > 0 ? (
            <div className="analytics-top-products">
              {topProducts.slice(0, 8).map((p, i) => (
                <div key={i} className="analytics-product-row">
                  <span className="analytics-product-row__rank">{i + 1}</span>
                  <span className="analytics-product-row__name">{p.name}</span>
                  <span className="analytics-product-row__sold">{p.totalSold} sold</span>
                  <span className="analytics-product-row__rev">{formatPrice(p.revenue)}</span>
                </div>
              ))}
            </div>
          ) : (
            <ChartPlaceholder label="Top selling products" />
          )}
        </div>
      </div>

      {/* Category Breakdown + Customer Growth */}
      <div className="analytics-row">
        <div className="analytics-chart-card">
          <h3 className="analytics-chart-card__title">Sales by Category</h3>
          {chartsAvailable && salesByCategory.length > 0 ? (
            <div className="analytics-category">
              <div className="analytics-chart" style={{ maxWidth: 200, margin: '0 auto' }}>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={salesByCategory} dataKey="revenue" nameKey="category" innerRadius={50} outerRadius={80} paddingAngle={2}>
                      {salesByCategory.map((_, i) => (<Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(val) => formatPrice(val)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="analytics-category__legend">
                {salesByCategory.map((c, i) => (
                  <div key={i} className="analytics-category__item">
                    <span className="analytics-category__dot" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="analytics-category__name">{c.category}</span>
                    <span className="analytics-category__value">{formatPrice(c.revenue)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <ChartPlaceholder label="Category distribution" />
          )}
        </div>

        <div className="analytics-chart-card">
          <h3 className="analytics-chart-card__title">Customer Growth</h3>
          {chartsAvailable && customerGrowth.length > 0 ? (
            <div className="analytics-chart">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={customerGrowth}>
                  <XAxis dataKey="date" tickFormatter={formatDateShort} tick={{ fill: '#6A6662', fontSize: 10, fontFamily: "'DM Mono', monospace" }} axisLine={{ stroke: '#2A2A2A' }} tickLine={false} />
                  <YAxis tick={{ fill: '#6A6662', fontSize: 10, fontFamily: "'DM Mono', monospace" }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="count" stroke="#EDEBE8" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <ChartPlaceholder label="New customers over time" />
          )}
        </div>
      </div>

      {/* Geographic Breakdown */}
      <div className="analytics-chart-card">
        <h3 className="analytics-chart-card__title">Orders by State</h3>
        {geographicBreakdown.length > 0 ? (
          <div className="analytics-geo">
            <div className="analytics-geo__header">
              <span>State</span>
              <span>Orders</span>
              <span>Revenue</span>
            </div>
            {geographicBreakdown.slice(0, 15).map((g, i) => (
              <div key={i} className="analytics-geo__row">
                <span className="analytics-geo__state">{g.state}</span>
                <span className="analytics-geo__orders">{g.orders}</span>
                <span className="analytics-geo__revenue">{formatPrice(g.revenue)}</span>
              </div>
            ))}
          </div>
        ) : (
          <ChartPlaceholder label="Geographic distribution" />
        )}
      </div>

      </>)}
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="analytics-metric">
      <span className="analytics-metric__value">{value}</span>
      <span className="analytics-metric__label">{label}</span>
    </div>
  );
}

function ChartPlaceholder({ label }) {
  return (
    <div className="analytics-placeholder">
      <span>{label}</span>
      <p>No data yet for this period.</p>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="admin-page analytics">
      <div className="admin-page-header">
        <div className="admin-page-header__info">
          <Skeleton type="text" style={{ width: '50%', height: 14 }} />
        </div>
      </div>
      <div className="analytics-metrics">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="analytics-metric">
            <Skeleton type="text" style={{ width: '70%', height: 24, marginBottom: 6 }} />
            <Skeleton type="text" style={{ width: '50%', height: 12 }} />
          </div>
        ))}
      </div>
      <div className="analytics-chart-card" style={{ padding: 24 }}>
        <Skeleton type="text" style={{ width: '100%', height: 280 }} />
      </div>
    </div>
  );
}
