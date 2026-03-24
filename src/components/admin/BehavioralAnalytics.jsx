/*
 * BLACKTRIBE FASHION — BEHAVIORAL ANALYTICS
 *
 * Conversion funnel: Views → Cart → Checkout → Payment
 * Most viewed products with add-to-cart rate
 * Device breakdown (mobile/tablet/desktop)
 * Event trends by day
 * Top search terms
 *
 * Data from: GET /api/admin/behavioral?period=30d
 *
 * Usage: Import into Analytics page as a tab, or mount standalone.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import useAuthStore from '../../store/authStore';
import '../../styles/admin/admin-behavioral.css';

/* ═══ HELPERS ═══ */

function formatPrice(kobo) {
  if (!kobo && kobo !== 0) return '₦0';
  return '₦' + Math.floor(kobo / 100).toLocaleString('en-NG');
}

function formatNum(n) {
  return (n || 0).toLocaleString('en-NG');
}

/* ═══ COMPONENT ═══ */

export default function BehavioralAnalytics({ period = '30d' }) {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [period]);

  async function fetchData() {
    setLoading(true);
    try {
      const token = await useAuthStore.getState().getAccessToken();
      const res = await fetch(`/api/admin/behavioral?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }

  if (loading && !data) {
    return (
      <div className="beh">
        <div className="beh__loading">Loading behavioral data...</div>
      </div>
    );
  }

  if (!data) return null;

  const { funnel, mostViewed, deviceBreakdown, eventTrends, topSearches, summary } = data;

  return (
    <div className="beh">

      {/* Summary Strip */}
      <div className="beh__summary">
        <div className="beh__summary-item">
          <span className="beh__summary-value">{formatNum(summary.uniqueSessions)}</span>
          <span className="beh__summary-label">Sessions</span>
        </div>
        <div className="beh__summary-item">
          <span className="beh__summary-value">{formatNum(summary.totalEvents)}</span>
          <span className="beh__summary-label">Events</span>
        </div>
        <div className="beh__summary-item">
          <span className="beh__summary-value">{summary.avgEventsPerSession}</span>
          <span className="beh__summary-label">Avg/Session</span>
        </div>
        <div className="beh__summary-item">
          <span className="beh__summary-value">{funnel.overall_conversion_rate}%</span>
          <span className="beh__summary-label">Conversion</span>
        </div>
      </div>

      {/* Conversion Funnel */}
      <div className="beh__section">
        <h3 className="beh__section-title">Conversion Funnel</h3>
        <div className="beh__funnel">
          <FunnelStep
            label="Page Views"
            count={funnel.page_views}
            percentage={100}
            isFirst
          />
          <FunnelStep
            label="Product Views"
            count={funnel.product_views}
            percentage={funnel.page_views > 0 ? (funnel.product_views / funnel.page_views) * 100 : 0}
          />
          <FunnelStep
            label="Added to Cart"
            count={funnel.add_to_cart}
            percentage={funnel.page_views > 0 ? (funnel.add_to_cart / funnel.page_views) * 100 : 0}
            rate={`${funnel.view_to_cart_rate}% of viewers`}
          />
          <FunnelStep
            label="Checkout Started"
            count={funnel.checkout_start}
            percentage={funnel.page_views > 0 ? (funnel.checkout_start / funnel.page_views) * 100 : 0}
            rate={`${funnel.cart_to_checkout_rate}% of carts`}
          />
          <FunnelStep
            label="Payment Success"
            count={funnel.payment_success}
            percentage={funnel.page_views > 0 ? (funnel.payment_success / funnel.page_views) * 100 : 0}
            rate={`${funnel.checkout_to_payment_rate}% of checkouts`}
            isLast
          />
          {funnel.payment_failed > 0 && (
            <div className="beh__funnel-failed">
              <span className="beh__funnel-failed-count">{funnel.payment_failed}</span>
              <span className="beh__funnel-failed-label">Failed Payments</span>
            </div>
          )}
        </div>
      </div>

      {/* Most Viewed Products */}
      <div className="beh__section">
        <h3 className="beh__section-title">Most Viewed Products</h3>
        {mostViewed.length === 0 ? (
          <p className="beh__empty-text">No product view data yet.</p>
        ) : (
          <div className="beh__products">
            {mostViewed.map((p, i) => (
              <div key={p.product_id} className="beh__product">
                <span className="beh__product-rank">{i + 1}</span>
                {p.image && (
                  <img src={p.image} alt="" className="beh__product-img" />
                )}
                <div className="beh__product-info">
                  <span className="beh__product-name">{p.name}</span>
                  <span className="beh__product-meta">
                    {formatPrice(p.price)} · {p.views} views · {p.carts} carts
                  </span>
                </div>
                <div className="beh__product-rate">
                  <span className="beh__product-rate-value">{p.cart_rate}%</span>
                  <span className="beh__product-rate-label">cart rate</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Device Breakdown */}
      <div className="beh__section">
        <h3 className="beh__section-title">Device Breakdown</h3>
        <div className="beh__devices">
          <DeviceBar label="Mobile" data={deviceBreakdown.mobile} />
          <DeviceBar label="Tablet" data={deviceBreakdown.tablet} />
          <DeviceBar label="Desktop" data={deviceBreakdown.desktop} />
        </div>
      </div>

      {/* Top Search Terms */}
      {topSearches.length > 0 && (
        <div className="beh__section">
          <h3 className="beh__section-title">Top Search Terms</h3>
          <div className="beh__searches">
            {topSearches.map((s, i) => (
              <div key={i} className="beh__search-item">
                <span className="beh__search-term">{s.term}</span>
                <span className="beh__search-count">{s.count} searches</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Event Trends (simple daily bars) */}
      {eventTrends.length > 0 && (
        <div className="beh__section">
          <h3 className="beh__section-title">Daily Activity</h3>
          <div className="beh__trends">
            <div className="beh__trends-legend">
              <span className="beh__legend-item"><span className="beh__legend-dot beh__legend-dot--views" />Views</span>
              <span className="beh__legend-item"><span className="beh__legend-dot beh__legend-dot--carts" />Carts</span>
              <span className="beh__legend-item"><span className="beh__legend-dot beh__legend-dot--payments" />Payments</span>
            </div>
            <div className="beh__trends-chart">
              {eventTrends.slice(-14).map((day) => {
                const max = Math.max(day.views, day.carts, day.payments, 1);
                return (
                  <div key={day.date} className="beh__trends-day">
                    <div className="beh__trends-bars">
                      <div className="beh__trends-bar beh__trends-bar--views" style={{ height: `${(day.views / max) * 100}%` }} title={`${day.views} views`} />
                      <div className="beh__trends-bar beh__trends-bar--carts" style={{ height: `${(day.carts / max) * 100}%` }} title={`${day.carts} carts`} />
                      <div className="beh__trends-bar beh__trends-bar--payments" style={{ height: `${(day.payments / max) * 100}%` }} title={`${day.payments} payments`} />
                    </div>
                    <span className="beh__trends-label">{day.date.slice(5)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


/* ═══ FUNNEL STEP ═══ */

function FunnelStep({ label, count, percentage, rate, isFirst, isLast }) {
  const barWidth = Math.max(percentage, 4);

  return (
    <div className={`beh__funnel-step ${isLast ? 'beh__funnel-step--last' : ''}`}>
      <div className="beh__funnel-bar-wrap">
        <div
          className={`beh__funnel-bar ${isLast ? 'beh__funnel-bar--success' : ''}`}
          style={{ width: `${barWidth}%` }}
        />
      </div>
      <div className="beh__funnel-info">
        <div className="beh__funnel-row">
          <span className="beh__funnel-label">{label}</span>
          <span className="beh__funnel-count">{formatNum(count)}</span>
        </div>
        {rate && <span className="beh__funnel-rate">{rate}</span>}
      </div>
    </div>
  );
}


/* ═══ DEVICE BAR ═══ */

function DeviceBar({ label, data }) {
  return (
    <div className="beh__device">
      <div className="beh__device-header">
        <span className="beh__device-label">{label}</span>
        <span className="beh__device-value">{data.percentage}%</span>
      </div>
      <div className="beh__device-bar-track">
        <div
          className="beh__device-bar-fill"
          style={{ width: `${Math.max(parseFloat(data.percentage), 1)}%` }}
        />
      </div>
      <span className="beh__device-sub">{formatNum(data.sessions)} sessions</span>
    </div>
  );
}
