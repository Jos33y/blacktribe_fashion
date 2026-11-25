import { Router } from 'express';
import { getOrderById } from '../services/orderService.js';
import { sendEmail } from '../services/emailService.js';
import { paymentReminderEmail } from '../templates/paymentReminder.js';
import { createError } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { supabaseAdmin } from '../config/database.js';
import { env } from '../config/env.js';
import { rateLimit } from '../middleware/rateLimit.js';

const router = Router();


/**
 * GET /api/orders/track
 * Guest order tracking. No login required.
 * URL: /api/orders/track?order=BT-XXXXXXXX&token=abc123
 * Must be defined ABOVE /:id to avoid Express matching "track" as an ID.
 */
router.get('/track', async (req, res, next) => {
  try {
    const { order, token } = req.query;

    if (!order || !token) {
      return next(createError(400, 'Order number and token are required.'));
    }

    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('order_number', order)
      .eq('tracking_token', token)
      .single();

    if (error || !data) {
      return next(createError(404, 'Order not found.'));
    }

    // Fetch order items
    const { data: items } = await supabaseAdmin
      .from('order_items')
      .select('*')
      .eq('order_id', data.id);

    res.json({ success: true, data: { ...data, items: items || [] } });
  } catch (err) {
    next(err);
  }
});


/**
 * GET /api/orders/pay/:orderNumber
 * Returns order data for the standalone payment page.
 * Requires tracking token for security.
 */
router.get('/pay/:orderNumber', async (req, res, next) => {
  try {
    const { orderNumber } = req.params;
    const { token } = req.query;

    if (!token) throw createError(400, 'Token is required.');

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('order_number', orderNumber)
      .eq('tracking_token', token)
      .single();

    if (error || !order) throw createError(404, 'Order not found.');

    // Check if order is already paid
    if (order.payment_status === 'paid') {
      return res.json({ success: true, data: { ...order, items: [], alreadyPaid: true } });
    }

    // Check if order is expired (older than 48 hours)
    const created = new Date(order.created_at);
    const hoursSinceCreation = (Date.now() - created.getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreation > 48) {
      return res.json({ success: true, data: { ...order, items: [], expired: true } });
    }

    // Get items
    const { data: items } = await supabaseAdmin
      .from('order_items')
      .select('*')
      .eq('order_id', order.id);

    // Resolve email: guest_email or look up from auth user
    let email = order.guest_email || '';
    if (!email && order.user_id) {
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(order.user_id);
      if (userData?.user?.email) email = userData.user.email;
    }

    res.json({ success: true, data: { ...order, email, items: items || [] } });
  } catch (err) {
    next(err);
  }
});


/**
 * GET /api/orders
 * Returns the authenticated user's orders.
 * Supports ?status= filter (comma-separated).
 */
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;
    const { status } = req.query;

    /* Guest orders are matched by email only for a confirmed email, and the
       email is escaped so characters like % or _ cannot match other people */
    const canMatchEmail = req.user.emailConfirmed && /^[^\s@]+@[^\s@]+$/.test(userEmail || '');
    const emailPattern = canMatchEmail ? userEmail.replace(/[\\%_]/g, (c) => `\\${c}`) : null;

    const statuses = String(status || '').split(',').map((x) => x.trim()).filter(Boolean);
    const build = () => {
      let q = supabaseAdmin.from('orders').select('*, order_items(*)');
      if (statuses.length) q = q.in('status', statuses);
      return q;
    };

    /* Two plain queries (own orders, then guest orders by email) merged.
       Avoids building a filter string out of the user's email. */
    const [own, guest] = await Promise.all([
      build().eq('user_id', userId),
      emailPattern ? build().is('user_id', null).ilike('guest_email', emailPattern) : Promise.resolve({ data: [] }),
    ]);
    const error = own.error || guest.error;
    if (error) {
      console.error('[orders] List error:', error);
      throw createError(500, 'Could not fetch orders.');
    }
    const seen = new Set();
    const data = [...(own.data || []), ...(guest.data || [])]
      .filter((o) => (seen.has(o.id) ? false : seen.add(o.id)))
      .sort((x, y) => String(y.created_at).localeCompare(String(x.created_at)));

    /* Auto-link: claim guest orders with this (confirmed) email, fire-and-forget */
    if (emailPattern) supabaseAdmin
      .from('orders')
      .update({ user_id: userId, guest_email: null, updated_at: new Date().toISOString() })
      .is('user_id', null)
      .ilike('guest_email', emailPattern)
      .then(({ error: linkErr }) => {
        if (linkErr) console.warn('[orders] Auto-link failed:', linkErr.message);
        else console.log(`[orders] Auto-linked guest orders for ${userEmail}`);
      })
      .catch(() => { });

    /* Format: flatten order_items into items */
    const orders = (data || []).map((order) => ({
      ...order,
      items: order.order_items || [],
      order_items: undefined,
    }));

    res.json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
});


/**
 * GET /api/orders/:id
 * Returns order with items for the confirmation page.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const order = await getOrderById(req.params.id);
    if (!order) throw createError(404, 'Order not found.');
    /* Public by order id (the confirmation page). Leave out internals and
       the phone number; everything the page shows stays. */
    const { notes, payment_reference, user_id, ...publicOrder } = order;
    if (publicOrder.shipping_address) {
      const { phone, ...addr } = publicOrder.shipping_address;
      publicOrder.shipping_address = addr;
    }
    res.json({ success: true, data: publicOrder });
  } catch (err) {
    next(err);
  }
});


/**
 * POST /api/orders/:id/remind
 * Sends the abandoned payment reminder email with payment page link.
 * Only sends once per order (tracked via notes field).
 */
router.post('/:id/remind', rateLimit({ name: 'remind', max: 5, windowMs: 10 * 60 * 1000 }), async (req, res, next) => {
  try {
    const order = await getOrderById(req.params.id);
    if (!order) throw createError(404, 'Order not found.');

    if (order.payment_status === 'paid') {
      return res.json({ success: true, message: 'Order already paid.' });
    }

    if (order.notes?.includes('reminder_sent')) {
      return res.json({ success: true, message: 'Reminder already sent.' });
    }

    let email = order.guest_email || '';
    if (!email && order.user_id) {
      try {
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(order.user_id);
        if (userData?.user?.email) email = userData.user.email;
      } catch { /* silent */ }
    }
    /* Never send to an address taken from the request: only the order's own */
    if (!email) throw createError(400, 'No email address available.');

    const paymentUrl = `${env.siteUrl}/pay/${order.order_number}?token=${order.tracking_token}`;

    const { subject, html } = paymentReminderEmail({
      order,
      items: order.items || [],
      paymentUrl,
    });

    await sendEmail({ to: email, subject, html });

    await supabaseAdmin
      .from('orders')
      .update({ notes: (order.notes ? order.notes + ' | ' : '') + 'reminder_sent' })
      .eq('id', order.id);

    res.json({ success: true, message: 'Reminder sent.' });
  } catch (err) {
    next(err);
  }
});


/**
 * POST /api/orders/:id/update-ref
 * Updates the payment reference on an order.
 * Called by the payment page before opening Paystack popup
 * so the webhook can match the new reference.
 */
router.post('/:id/update-ref', rateLimit({ name: 'update-ref', max: 20, windowMs: 10 * 60 * 1000 }), async (req, res, next) => {
  try {
    const { reference, token } = req.body;
    if (!reference || !/^bt_[A-Za-z0-9_]{6,60}$/.test(String(reference))) throw createError(400, 'Reference is required.');
    if (!token) throw createError(400, 'Token is required.');

    const { data: updated, error } = await supabaseAdmin
      .from('orders')
      .update({
        payment_reference: reference,
        payment_status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .eq('tracking_token', String(token))
      .eq('payment_status', 'pending')
      .select('id');

    if (!error && !updated?.length) throw createError(404, 'Order not found.');
    if (error) {
      console.warn('[orders] Failed to update reference:', error.message);
      throw createError(500, 'Failed to update payment reference.');
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
