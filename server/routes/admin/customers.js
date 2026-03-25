/*
 * BLACKTRIBE FASHION — ADMIN: Customers
 *
 * Fixed: orders now matched by BOTH user_id AND guest_email.
 * Before this fix, only user_id was checked — but the original checkout
 * never set user_id on orders, so all online orders showed as 0.
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

    /* Get all auth users to map id → email */
    const { data: { users }, error: usersErr } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 1000,
    });

    if (usersErr) throw usersErr;

    const emailMap = {};
    (users || []).forEach((u) => { emailMap[u.id] = u.email; });

    /* Fetch ALL paid orders (both user_id-linked and guest) */
    const { data: orders, error: ordErr } = await supabaseAdmin
      .from('orders')
      .select('user_id, guest_email, total')
      .eq('payment_status', 'paid');

    if (ordErr) throw ordErr;

    /* Build reverse map: email → user_id for matching guest orders */
    const reverseEmailMap = {};
    Object.entries(emailMap).forEach(([id, email]) => {
      if (email) reverseEmailMap[email.toLowerCase()] = id;
    });

    /* Aggregate orders by user_id, also matching guest_email → user_id */
    const orderAgg = {};
    (orders || []).forEach((o) => {
      let userId = o.user_id;

      /* If no user_id, try to match guest_email to a registered user */
      if (!userId && o.guest_email) {
        userId = reverseEmailMap[o.guest_email.toLowerCase()] || null;
      }

      if (!userId) return;

      if (!orderAgg[userId]) orderAgg[userId] = { count: 0, total: 0 };
      orderAgg[userId].count += 1;
      orderAgg[userId].total += o.total || 0;
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
    let email = '—';
    try {
      const { data: { user }, error } = await supabaseAdmin.auth.admin.getUserById(req.params.id);
      if (!error && user?.email) email = user.email;
    } catch {
      /* Fallback: list users (slower but works) */
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      const user = (users || []).find((u) => u.id === req.params.id);
      if (user?.email) email = user.email;
    }

    /* Orders: match by user_id OR by guest_email matching this customer's email */
    let orders = [];
    if (email && email !== '—') {
      /* Query orders linked by user_id */
      const { data: userOrders } = await supabaseAdmin
        .from('orders')
        .select('id, order_number, status, total, payment_status, payment_method, order_type, created_at')
        .eq('user_id', req.params.id)
        .order('created_at', { ascending: false });

      /* Query orders linked by guest_email */
      const { data: guestOrders } = await supabaseAdmin
        .from('orders')
        .select('id, order_number, status, total, payment_status, payment_method, order_type, created_at')
        .eq('guest_email', email)
        .is('user_id', null)
        .order('created_at', { ascending: false });

      /* Merge and deduplicate */
      const seen = new Set();
      orders = [...(userOrders || []), ...(guestOrders || [])].filter((o) => {
        if (seen.has(o.id)) return false;
        seen.add(o.id);
        return true;
      }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else {
      /* No email — can only match by user_id */
      const { data: userOrders } = await supabaseAdmin
        .from('orders')
        .select('id, order_number, status, total, payment_status, payment_method, order_type, created_at')
        .eq('user_id', req.params.id)
        .order('created_at', { ascending: false });
      orders = userOrders || [];
    }

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
        orders,
        addresses: addresses || [],
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
