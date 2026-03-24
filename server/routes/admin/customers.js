/*
 * BLACKTRIBE FASHION — ADMIN: Customers
 */

import express from 'express';
import { requirePermission } from '../../middleware/auth.js';
import { supabaseAdmin } from '../../config/database.js';

const router = express.Router();

router.get('/customers', requirePermission('customers'), async (req, res, next) => {
  try {
    const { data: profiles, error: profErr } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, phone, role, created_at')
      .eq('role', 'customer')
      .order('created_at', { ascending: false });

    if (profErr) throw profErr;

    const { data: { users }, error: usersErr } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 1000,
    });

    if (usersErr) throw usersErr;

    const emailMap = {};
    (users || []).forEach((u) => { emailMap[u.id] = u.email; });

    const { data: orders, error: ordErr } = await supabaseAdmin
      .from('orders')
      .select('user_id, total')
      .eq('payment_status', 'paid')
      .not('user_id', 'is', null);

    if (ordErr) throw ordErr;

    const orderAgg = {};
    (orders || []).forEach((o) => {
      if (!o.user_id) return;
      if (!orderAgg[o.user_id]) orderAgg[o.user_id] = { count: 0, total: 0 };
      orderAgg[o.user_id].count += 1;
      orderAgg[o.user_id].total += o.total || 0;
    });

    const data = (profiles || []).map((p) => ({
      id: p.id,
      full_name: p.full_name,
      email: emailMap[p.id] || '—',
      phone: p.phone,
      created_at: p.created_at,
      order_count: orderAgg[p.id]?.count || 0,
      total_spent: orderAgg[p.id]?.total || 0,
    }));

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});


/* Single customer detail with orders + addresses */
router.get('/customers/:id', requirePermission('customers'), async (req, res, next) => {
  try {
    /* Profile */
    const { data: profile, error: profErr } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, phone, role, created_at')
      .eq('id', req.params.id)
      .single();

    if (profErr || !profile) {
      return res.status(404).json({ success: false, error: 'Customer not found.' });
    }

    /* Email from auth */
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const user = (users || []).find((u) => u.id === req.params.id);
    const email = user?.email || '—';

    /* Orders */
    const { data: orders } = await supabaseAdmin
      .from('orders')
      .select('id, order_number, status, total, payment_status, payment_method, order_type, created_at')
      .eq('user_id', req.params.id)
      .order('created_at', { ascending: false });

    /* Addresses */
    const { data: addresses } = await supabaseAdmin
      .from('addresses')
      .select('*')
      .eq('user_id', req.params.id)
      .order('is_default', { ascending: false });

    res.json({
      success: true,
      data: {
        ...profile,
        email,
        orders: orders || [],
        addresses: addresses || [],
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
