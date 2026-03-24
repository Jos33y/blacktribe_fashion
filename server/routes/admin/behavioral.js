/*
 * BLACKTRIBE FASHION — ADMIN: Behavioral Analytics
 *
 * Queries product_events table for:
 *   - Conversion funnel (view → cart → checkout → payment)
 *   - Most viewed products
 *   - Add-to-cart rate
 *   - Device breakdown
 *   - Search terms
 */

import express from 'express';
import { supabaseAdmin } from '../../config/database.js';

const router = express.Router();

router.get('/behavioral', async (req, res, next) => {
  try {
    const { period = '30d' } = req.query;

    const now = new Date();
    let startDate;
    switch (period) {
      case '7d': startDate = new Date(now - 7 * 86400000); break;
      case '90d': startDate = new Date(now - 90 * 86400000); break;
      case '1y': startDate = new Date(now - 365 * 86400000); break;
      default: startDate = new Date(now - 30 * 86400000); break;
    }
    const startISO = startDate.toISOString();

    /* Fetch all events in range */
    const { data: events, error } = await supabaseAdmin
      .from('product_events')
      .select('event_type, product_id, device_type, session_id, metadata, created_at')
      .gte('created_at', startISO)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const allEvents = events || [];

    /* ─── Conversion Funnel ─── */
    const funnelSessions = {
      page_view: new Set(),
      product_view: new Set(),
      add_to_cart: new Set(),
      checkout_start: new Set(),
      payment_success: new Set(),
      payment_failed: new Set(),
    };

    allEvents.forEach((e) => {
      if (funnelSessions[e.event_type]) {
        funnelSessions[e.event_type].add(e.session_id);
      }
    });

    const funnel = {
      page_views: funnelSessions.page_view.size,
      product_views: funnelSessions.product_view.size,
      add_to_cart: funnelSessions.add_to_cart.size,
      checkout_start: funnelSessions.checkout_start.size,
      payment_success: funnelSessions.payment_success.size,
      payment_failed: funnelSessions.payment_failed.size,
    };

    /* Drop-off rates */
    funnel.view_to_cart_rate = funnel.product_views > 0
      ? ((funnel.add_to_cart / funnel.product_views) * 100).toFixed(1)
      : '0.0';
    funnel.cart_to_checkout_rate = funnel.add_to_cart > 0
      ? ((funnel.checkout_start / funnel.add_to_cart) * 100).toFixed(1)
      : '0.0';
    funnel.checkout_to_payment_rate = funnel.checkout_start > 0
      ? ((funnel.payment_success / funnel.checkout_start) * 100).toFixed(1)
      : '0.0';
    funnel.overall_conversion_rate = funnel.page_views > 0
      ? ((funnel.payment_success / funnel.page_views) * 100).toFixed(2)
      : '0.00';

    /* ─── Most Viewed Products ─── */
    const productViews = {};
    const productCarts = {};

    allEvents.forEach((e) => {
      if (e.event_type === 'product_view' && e.product_id) {
        productViews[e.product_id] = (productViews[e.product_id] || 0) + 1;
      }
      if (e.event_type === 'add_to_cart' && e.product_id) {
        productCarts[e.product_id] = (productCarts[e.product_id] || 0) + 1;
      }
    });

    /* Fetch product names for the top viewed */
    const topProductIds = Object.entries(productViews)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 15)
      .map(([id]) => id);

    let productNameMap = {};
    if (topProductIds.length > 0) {
      const { data: products } = await supabaseAdmin
        .from('products')
        .select('id, name, slug, images, price')
        .in('id', topProductIds);

      (products || []).forEach((p) => {
        productNameMap[p.id] = {
          name: p.name,
          slug: p.slug,
          image: p.images?.[0] || null,
          price: p.price,
        };
      });
    }

    const mostViewed = topProductIds.map((id) => ({
      product_id: id,
      name: productNameMap[id]?.name || 'Unknown',
      slug: productNameMap[id]?.slug || '',
      image: productNameMap[id]?.image || null,
      price: productNameMap[id]?.price || 0,
      views: productViews[id] || 0,
      carts: productCarts[id] || 0,
      cart_rate: productViews[id] > 0
        ? ((productCarts[id] || 0) / productViews[id] * 100).toFixed(1)
        : '0.0',
    }));

    /* ─── Device Breakdown ─── */
    const deviceCounts = { mobile: 0, tablet: 0, desktop: 0 };
    const deviceSessions = { mobile: new Set(), tablet: new Set(), desktop: new Set() };

    allEvents.forEach((e) => {
      if (e.device_type && deviceCounts[e.device_type] !== undefined) {
        deviceCounts[e.device_type]++;
        deviceSessions[e.device_type].add(e.session_id);
      }
    });

    const totalDeviceEvents = deviceCounts.mobile + deviceCounts.tablet + deviceCounts.desktop;
    const deviceBreakdown = {
      mobile: { events: deviceCounts.mobile, sessions: deviceSessions.mobile.size, percentage: totalDeviceEvents > 0 ? ((deviceCounts.mobile / totalDeviceEvents) * 100).toFixed(1) : '0.0' },
      tablet: { events: deviceCounts.tablet, sessions: deviceSessions.tablet.size, percentage: totalDeviceEvents > 0 ? ((deviceCounts.tablet / totalDeviceEvents) * 100).toFixed(1) : '0.0' },
      desktop: { events: deviceCounts.desktop, sessions: deviceSessions.desktop.size, percentage: totalDeviceEvents > 0 ? ((deviceCounts.desktop / totalDeviceEvents) * 100).toFixed(1) : '0.0' },
    };

    /* ─── Events by Day (for trend chart) ─── */
    const eventsByDay = {};
    allEvents.forEach((e) => {
      const day = e.created_at.split('T')[0];
      if (!eventsByDay[day]) eventsByDay[day] = { date: day, views: 0, carts: 0, checkouts: 0, payments: 0 };
      if (e.event_type === 'product_view') eventsByDay[day].views++;
      if (e.event_type === 'add_to_cart') eventsByDay[day].carts++;
      if (e.event_type === 'checkout_start') eventsByDay[day].checkouts++;
      if (e.event_type === 'payment_success') eventsByDay[day].payments++;
    });

    const eventTrends = Object.values(eventsByDay).sort((a, b) => a.date.localeCompare(b.date));

    /* ─── Top Search Terms ─── */
    const searchTerms = {};
    allEvents.forEach((e) => {
      if (e.event_type === 'search' && e.metadata?.query) {
        const q = e.metadata.query.toLowerCase().trim();
        searchTerms[q] = (searchTerms[q] || 0) + 1;
      }
    });

    const topSearches = Object.entries(searchTerms)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([term, count]) => ({ term, count }));

    /* ─── Summary Metrics ─── */
    const uniqueSessions = new Set(allEvents.map((e) => e.session_id)).size;
    const totalEvents = allEvents.length;

    res.json({
      success: true,
      data: {
        funnel,
        mostViewed,
        deviceBreakdown,
        eventTrends,
        topSearches,
        summary: {
          totalEvents,
          uniqueSessions,
          avgEventsPerSession: uniqueSessions > 0 ? (totalEvents / uniqueSessions).toFixed(1) : '0.0',
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
