/*
 * BLACKTRIBE FASHION — ADMIN: Global Search
 *
 * Searches products, orders, and customers simultaneously.
 * Returns grouped results for the command palette UI.
 */

import express from 'express';
import { supabaseAdmin } from '../../config/database.js';

const router = express.Router();

router.get('/search', async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.json({ success: true, data: { products: [], orders: [], customers: [] } });
    }

    const query = q.trim();
    const results = { products: [], orders: [], customers: [] };

    /* Search products by name */
    const { data: products } = await supabaseAdmin
      .from('products')
      .select('id, name, slug, price, images, badge, is_active')
      .ilike('name', `%${query}%`)
      .order('created_at', { ascending: false })
      .limit(6);

    results.products = (products || []).map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      image: p.images?.[0] || null,
      badge: p.badge,
      is_active: p.is_active,
    }));

    /* Search orders by order_number or guest_email */
    const { data: orders } = await supabaseAdmin
      .from('orders')
      .select('id, order_number, status, total, payment_status, order_type, guest_email, user_id, created_at')
      .or(`order_number.ilike.%${query}%,guest_email.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(6);

    /* Resolve emails for registered-user orders */
    const orderNeedsEmail = (orders || []).filter((o) => !o.guest_email && o.user_id);
    const orderUserIds = [...new Set(orderNeedsEmail.map((o) => o.user_id))];
    const orderEmailMap = {};
    if (orderUserIds.length > 0) {
      const emailResults = await Promise.all(
        orderUserIds.map(async (uid) => {
          try {
            const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(uid);
            return { uid, email: user?.email || null };
          } catch { return { uid, email: null }; }
        })
      );
      emailResults.forEach(({ uid, email }) => { if (email) orderEmailMap[uid] = email; });
    }

    results.orders = (orders || []).map((o) => ({
      id: o.id,
      order_number: o.order_number,
      status: o.status,
      total: o.total,
      payment_status: o.payment_status,
      order_type: o.order_type,
      email: o.guest_email || orderEmailMap[o.user_id] || null,
      created_at: o.created_at,
    }));

    /* Search customers by name or email */
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, phone, created_at')
      .eq('role', 'customer')
      .ilike('full_name', `%${query}%`)
      .order('created_at', { ascending: false })
      .limit(6);

    /* Also search by email via auth.admin */
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const emailMap = {};
    const emailMatches = [];
    (users || []).forEach((u) => {
      emailMap[u.id] = u.email;
      if (u.email?.toLowerCase().includes(query.toLowerCase())) {
        emailMatches.push(u.id);
      }
    });

    /* Merge name matches + email matches, deduplicate */
    const customerIds = new Set((profiles || []).map((p) => p.id));
    emailMatches.forEach((id) => customerIds.add(id));

    /* If we have email-only matches, fetch their profiles */
    const emailOnlyIds = emailMatches.filter((id) => !(profiles || []).find((p) => p.id === id));
    let emailOnlyProfiles = [];
    if (emailOnlyIds.length > 0) {
      const { data: extra } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, phone, created_at')
        .eq('role', 'customer')
        .in('id', emailOnlyIds);
      emailOnlyProfiles = extra || [];
    }

    const allCustomerProfiles = [...(profiles || []), ...emailOnlyProfiles];
    results.customers = allCustomerProfiles.slice(0, 6).map((p) => ({
      id: p.id,
      full_name: p.full_name,
      email: emailMap[p.id] || '—',
      phone: p.phone,
      created_at: p.created_at,
    }));

    res.json({ success: true, data: results });
  } catch (err) {
    next(err);
  }
});

export default router;