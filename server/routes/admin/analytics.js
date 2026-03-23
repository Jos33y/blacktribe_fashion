/*
 * BLACKTRIBE FASHION — ADMIN: Analytics
 */

import express from 'express';
import { supabaseAdmin } from '../../config/database.js';

const router = express.Router();

router.get('/analytics', async (req, res, next) => {
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

    /* Paid orders in range */
    const { data: orders, error: ordersErr } = await supabaseAdmin
      .from('orders')
      .select('id, total, status, created_at, shipping_address, user_id, guest_email')
      .eq('payment_status', 'paid')
      .gte('created_at', startISO)
      .order('created_at', { ascending: true });

    if (ordersErr) throw ordersErr;

    /* Order items */
    const orderIds = (orders || []).map((o) => o.id);
    let allItems = [];
    if (orderIds.length > 0) {
      const chunks = [];
      for (let i = 0; i < orderIds.length; i += 100) {
        chunks.push(orderIds.slice(i, i + 100));
      }
      for (const chunk of chunks) {
        const { data: items, error: itemsErr } = await supabaseAdmin
          .from('order_items')
          .select('order_id, product_id, name, price, quantity')
          .in('order_id', chunk);
        if (itemsErr) throw itemsErr;
        allItems = allItems.concat(items || []);
      }
    }

    /* Categories for breakdown */
    const { data: categories } = await supabaseAdmin.from('categories').select('id, name');
    const catMap = {};
    (categories || []).forEach((c) => { catMap[c.id] = c.name; });

    const { data: products } = await supabaseAdmin.from('products').select('id, category_id');
    const prodCatMap = {};
    (products || []).forEach((p) => { prodCatMap[p.id] = p.category_id; });

    /* Revenue by day */
    const revByDay = {};
    const ordersByDayMap = {};
    (orders || []).forEach((o) => {
      const day = o.created_at.split('T')[0];
      revByDay[day] = (revByDay[day] || 0) + (o.total || 0);
      ordersByDayMap[day] = (ordersByDayMap[day] || 0) + 1;
    });

    const revenueByDay = Object.entries(revByDay).sort(([a], [b]) => a.localeCompare(b)).map(([date, total]) => ({ date, total }));
    const ordersByDay = Object.entries(ordersByDayMap).sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) => ({ date, count }));

    /* Top products */
    const productAgg = {};
    allItems.forEach((item) => {
      const key = item.name || 'Unknown';
      if (!productAgg[key]) productAgg[key] = { name: key, totalSold: 0, revenue: 0 };
      productAgg[key].totalSold += item.quantity;
      productAgg[key].revenue += item.price * item.quantity;
    });
    const topProducts = Object.values(productAgg).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

    /* Sales by category */
    const catAgg = {};
    allItems.forEach((item) => {
      const catId = prodCatMap[item.product_id];
      const catName = catId ? (catMap[catId] || 'Other') : 'Other';
      if (!catAgg[catName]) catAgg[catName] = { category: catName, revenue: 0, count: 0 };
      catAgg[catName].revenue += item.price * item.quantity;
      catAgg[catName].count += item.quantity;
    });
    const salesByCategory = Object.values(catAgg).sort((a, b) => b.revenue - a.revenue);

    /* Key metrics */
    const totalRevenue = (orders || []).reduce((sum, o) => sum + (o.total || 0), 0);
    const totalOrders = (orders || []).length;
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    const customerOrders = {};
    (orders || []).forEach((o) => {
      const key = o.user_id || o.guest_email || 'anon';
      customerOrders[key] = (customerOrders[key] || 0) + 1;
    });
    const totalCustomersInPeriod = Object.keys(customerOrders).length;
    const repeatCustomers = Object.values(customerOrders).filter((c) => c > 1).length;
    const repeatCustomerRate = totalCustomersInPeriod > 0 ? (repeatCustomers / totalCustomersInPeriod) * 100 : 0;

    /* Geographic breakdown */
    const geoAgg = {};
    (orders || []).forEach((o) => {
      const addr = o.shipping_address;
      const state = addr?.state || 'Unknown';
      if (state === 'Unknown' || !addr) return;
      if (!geoAgg[state]) geoAgg[state] = { state, orders: 0, revenue: 0 };
      geoAgg[state].orders += 1;
      geoAgg[state].revenue += o.total || 0;
    });
    const geographicBreakdown = Object.values(geoAgg).sort((a, b) => b.orders - a.orders);

    /* Customer growth */
    const { data: profileData } = await supabaseAdmin
      .from('profiles')
      .select('created_at')
      .eq('role', 'customer')
      .gte('created_at', startISO)
      .order('created_at', { ascending: true });

    const growthMap = {};
    (profileData || []).forEach((p) => {
      const day = p.created_at.split('T')[0];
      growthMap[day] = (growthMap[day] || 0) + 1;
    });

    let cumulative = 0;
    const customerGrowth = Object.entries(growthMap).sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) => {
      cumulative += count;
      return { date, count: cumulative };
    });

    res.json({
      success: true,
      data: {
        revenueByDay, ordersByDay, topProducts, salesByCategory,
        keyMetrics: { totalRevenue, totalOrders, avgOrderValue, repeatCustomerRate },
        geographicBreakdown, customerGrowth,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
