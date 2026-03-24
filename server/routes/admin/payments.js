/*
 * BLACKTRIBE FASHION — ADMIN: Payments
 *
 * Payment transaction overview:
 *   - All orders with payment data
 *   - Payment method breakdown
 *   - Failed payment tracking
 *   - Revenue by payment method
 */

import express from 'express';
import { requirePermission } from '../../middleware/auth.js';
import { supabaseAdmin } from '../../config/database.js';

const router = express.Router();

router.get('/payments', requirePermission('orders'), async (req, res, next) => {
  try {
    const { status, method, search, page = 1, limit = 20, period } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    /* Date filter */
    let startISO = null;
    if (period) {
      const now = new Date();
      switch (period) {
        case '7d': startISO = new Date(now - 7 * 86400000).toISOString(); break;
        case '30d': startISO = new Date(now - 30 * 86400000).toISOString(); break;
        case '90d': startISO = new Date(now - 90 * 86400000).toISOString(); break;
        default: break;
      }
    }

    /* Paginated transactions */
    let query = supabaseAdmin
      .from('orders')
      .select('id, order_number, total, payment_status, payment_method, payment_reference, order_type, guest_email, created_at, status', { count: 'exact' });

    if (status && status !== 'all') query = query.eq('payment_status', status);
    if (method && method !== 'all') query = query.eq('payment_method', method);
    if (search) query = query.or(`order_number.ilike.%${search}%,payment_reference.ilike.%${search}%,guest_email.ilike.%${search}%`);
    if (startISO) query = query.gte('created_at', startISO);

    query = query.order('created_at', { ascending: false }).range(offset, offset + parseInt(limit) - 1);

    const { data: transactions, count, error } = await query;
    if (error) throw error;

    /* Aggregate stats (all time or filtered by period) */
    let aggQuery = supabaseAdmin
      .from('orders')
      .select('total, payment_status, payment_method');

    if (startISO) aggQuery = aggQuery.gte('created_at', startISO);

    const { data: allOrders, error: aggErr } = await aggQuery;
    if (aggErr) throw aggErr;

    const orders = allOrders || [];

    /* Payment status breakdown */
    const statusBreakdown = { paid: 0, pending: 0, failed: 0, refunded: 0 };
    const statusRevenue = { paid: 0, pending: 0, failed: 0, refunded: 0 };
    orders.forEach((o) => {
      const s = o.payment_status || 'pending';
      statusBreakdown[s] = (statusBreakdown[s] || 0) + 1;
      statusRevenue[s] = (statusRevenue[s] || 0) + (o.total || 0);
    });

    /* Payment method breakdown (paid orders only) */
    const methodBreakdown = {};
    orders.filter((o) => o.payment_status === 'paid').forEach((o) => {
      const m = o.payment_method || 'paystack';
      if (!methodBreakdown[m]) methodBreakdown[m] = { count: 0, revenue: 0 };
      methodBreakdown[m].count++;
      methodBreakdown[m].revenue += o.total || 0;
    });

    /* Failed payments (recent, for alerts) */
    const failedCount = orders.filter((o) => o.payment_status === 'failed').length;

    /* Total processed */
    const totalProcessed = statusRevenue.paid;
    const totalTransactions = orders.length;

    res.json({
      success: true,
      data: {
        transactions: transactions || [],
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        overview: {
          totalProcessed,
          totalTransactions,
          failedCount,
          statusBreakdown,
          statusRevenue,
          methodBreakdown,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
