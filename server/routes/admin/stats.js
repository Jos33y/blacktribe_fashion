/*
 * BLACKTRIBE FASHION — ADMIN: Dashboard Stats
 */

import express from 'express';
import { supabaseAdmin } from '../../config/database.js';

const router = express.Router();

router.get('/stats', async (req, res, next) => {
  try {
    const now = new Date();

    /* Revenue calculations */
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const weekStart = new Date(now);
    const dayOfWeek = weekStart.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    weekStart.setDate(weekStart.getDate() - diff);
    weekStart.setHours(0, 0, 0, 0);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const { data: paidOrders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('total, created_at')
      .eq('payment_status', 'paid');

    if (ordersError) throw ordersError;

    const orders = paidOrders || [];
    let revenueToday = 0;
    let revenueWeek = 0;
    let revenueMonth = 0;
    let revenueAllTime = 0;

    orders.forEach((o) => {
      const total = o.total || 0;
      const created = new Date(o.created_at);
      revenueAllTime += total;
      if (created >= monthStart) revenueMonth += total;
      if (created >= weekStart) revenueWeek += total;
      if (created >= todayStart) revenueToday += total;
    });

    /* Order counts by status */
    const { data: allOrders, error: countsError } = await supabaseAdmin
      .from('orders')
      .select('status, order_type');

    if (countsError) throw countsError;

    const statusCounts = {};
    let onlineCount = 0;
    let walkInCount = 0;

    (allOrders || []).forEach((o) => {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
      if (o.order_type === 'walk_in') walkInCount++;
      else onlineCount++;
    });

    /* Recent orders (last 10) */
    const { data: recentOrders, error: recentError } = await supabaseAdmin
      .from('orders')
      .select('id, order_number, status, total, payment_status, payment_method, order_type, guest_email, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (recentError) throw recentError;

    /* Low stock alerts */
    const { data: stockProducts, error: stockError } = await supabaseAdmin
      .from('products')
      .select('id, name, slug, sizes, show_inventory')
      .eq('show_inventory', true)
      .eq('is_active', true);

    if (stockError) throw stockError;

    const lowStockAlerts = [];
    (stockProducts || []).forEach((p) => {
      (p.sizes || []).forEach((s) => {
        if (s.stock < 5) {
          lowStockAlerts.push({
            product_id: p.id,
            product_name: p.name,
            product_slug: p.slug,
            size: s.size,
            stock: s.stock,
          });
        }
      });
    });

    /* Total counts */
    const { count: totalProducts } = await supabaseAdmin
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    const { count: totalCustomers } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'customer');

    res.json({
      success: true,
      data: {
        revenue: {
          today: revenueToday,
          week: revenueWeek,
          month: revenueMonth,
          allTime: revenueAllTime,
        },
        orders: {
          total: (allOrders || []).length,
          online: onlineCount,
          walkIn: walkInCount,
          byStatus: statusCounts,
        },
        recentOrders: recentOrders || [],
        lowStockAlerts,
        totalProducts: totalProducts || 0,
        totalCustomers: totalCustomers || 0,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
