/*
 * BLACKTRIBE FASHION — ADMIN: Orders + Walk-in + Discount Validation
 */

import express from 'express';
import { requirePermission } from '../../middleware/auth.js';
import { supabaseAdmin } from '../../config/database.js';
import { createError } from '../../middleware/errorHandler.js';
import { logActivity, getRequestIp } from '../../utils/activityLog.js';
import { sendEmail } from '../../services/emailService.js';
import { shippingNotificationEmail } from '../../templates/shippingNotification.js';
import { deliveryConfirmationEmail } from '../../templates/deliveryConfirmation.js';
import { orderStatusUpdateEmail } from '../../templates/orderStatusUpdate.js';
import { walkInReceiptEmail } from '../../templates/walkInReceipt.js';
import { env } from '../../config/env.js';

const router = express.Router();


/**
 * Resolve customer email for an order.
 * Checks guest_email first, then looks up auth user email.
 * Returns email string or null.
 */
async function resolveCustomerEmail(order) {
  // Guest orders have guest_email
  if (order.guest_email) return order.guest_email;

  // Authenticated orders: look up email from auth
  if (order.user_id) {
    try {
      const { data: { user }, error } = await supabaseAdmin.auth.admin.getUserById(order.user_id);
      if (!error && user?.email) return user.email;
    } catch (err) {
      console.error('[orders] Failed to resolve user email:', err.message);
    }
  }

  return null;
}


/* ─── List orders ─── */

router.get('/orders', requirePermission('orders'), async (req, res, next) => {
  try {
    const { status, order_type, search, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabaseAdmin
      .from('orders')
      .select('*', { count: 'exact' });

    if (status && status !== 'all') query = query.eq('status', status);
    if (order_type && order_type !== 'all') query = query.eq('order_type', order_type);
    if (search) {
      query = query.or(`order_number.ilike.%${search}%,guest_email.ilike.%${search}%`);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    const { data, count, error } = await query;
    if (error) throw error;

    res.json({ success: true, data, total: count, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    next(err);
  }
});


/* ─── CSV Export (must be before :id route) ─── */

router.get('/orders/export/csv', requirePermission('orders'), async (req, res, next) => {
  try {
    const { status, order_type, from, to } = req.query;

    let query = supabaseAdmin
      .from('orders')
      .select('order_number, guest_email, status, order_type, payment_method, payment_status, subtotal, shipping_cost, discount_amount, total, created_at')
      .order('created_at', { ascending: false });

    if (status && status !== 'all') query = query.eq('status', status);
    if (order_type && order_type !== 'all') query = query.eq('order_type', order_type);
    if (from) query = query.gte('created_at', from);
    if (to) query = query.lte('created_at', to);

    const { data: orders, error } = await query.limit(5000);
    if (error) throw error;

    /* Guard: no orders to export */
    if (!orders || orders.length === 0) {
      return res.status(404).json({ success: false, error: 'No orders to export.' });
    }

    /* Use ASCII-safe headers — avoids encoding issues in Excel */
    const headers = ['Order Number', 'Email', 'Status', 'Type', 'Payment Method', 'Payment Status', 'Subtotal (NGN)', 'Shipping (NGN)', 'Discount (NGN)', 'Total (NGN)', 'Date'];

    const rows = orders.map((o) => [
      o.order_number,
      o.guest_email || '',
      o.status,
      o.order_type || 'online',
      o.payment_method || 'paystack',
      o.payment_status,
      Math.floor((o.subtotal || 0) / 100),
      Math.floor((o.shipping_cost || 0) / 100),
      Math.floor((o.discount_amount || 0) / 100),
      Math.floor((o.total || 0) / 100),
      new Date(o.created_at).toISOString().split('T')[0],
    ]);

    /* UTF-8 BOM + CSV content — BOM tells Excel to read as UTF-8 */
    const BOM = '\uFEFF';
    const csv = BOM + [
      headers.join(','),
      ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const filename = `blacktribe-orders-${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
});


/* ─── Single order detail ─── */

router.get('/orders/:id', requirePermission('orders'), async (req, res, next) => {
  try {
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (orderError) throw orderError;
    if (!order) return next(createError(404, 'Order not found.'));

    const { data: items, error: itemsError } = await supabaseAdmin
      .from('order_items')
      .select('*')
      .eq('order_id', order.id);

    if (itemsError) throw itemsError;

    let customer = null;
    if (order.user_id) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('full_name, phone, role')
        .eq('id', order.user_id)
        .single();
      customer = profile;
    }

    res.json({ success: true, data: { ...order, items: items || [], customer } });
  } catch (err) {
    next(err);
  }
});


/* ─── Update order status ─── */

router.patch('/orders/:id', requirePermission('orders'), async (req, res, next) => {
  try {
    const { status, tracking_number, notes } = req.body;
    const updates = { updated_at: new Date().toISOString() };

    if (status) updates.status = status;
    if (tracking_number !== undefined) updates.tracking_number = tracking_number;
    if (notes !== undefined) updates.notes = notes;

    if (status === 'shipped') updates.shipped_at = new Date().toISOString();
    if (status === 'delivered') updates.delivered_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('orders')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });

    /* ─── Fire-and-forget: activity log + status emails ─── */
    if (status) {
      logActivity(supabaseAdmin, { userId: req.user.id, action: 'order.status_changed', resourceType: 'order', resourceId: req.params.id, details: { order_number: data.order_number, status, tracking_number: tracking_number || null }, ip: getRequestIp(req) });

      /* Resolve customer email (works for BOTH guest and authenticated users) */
      const customerEmail = await resolveCustomerEmail(data);

      if (customerEmail) {
        try {
          const siteUrl = env.siteUrl || 'https://blacktribefashion.com';
          const trackingUrl = `${siteUrl}/track?order=${data.order_number}&token=${data.tracking_token}`;

          if (status === 'shipped') {
            /* Fetch order items for shipping email */
            const { data: items } = await supabaseAdmin
              .from('order_items')
              .select('*')
              .eq('order_id', data.id);

            const email = shippingNotificationEmail({ order: data, items: items || [], trackingUrl });
            await sendEmail({ to: customerEmail, subject: email.subject, html: email.html });
            console.log(`[orders] Shipping email sent to ${customerEmail}`);

          } else if (status === 'delivered') {
            const email = deliveryConfirmationEmail({ order: data });
            await sendEmail({ to: customerEmail, subject: email.subject, html: email.html });
            console.log(`[orders] Delivery email sent to ${customerEmail}`);

          } else if (status === 'confirmed' || status === 'processing') {
            const email = orderStatusUpdateEmail({ order: data, statusKey: status });
            if (email) {
              await sendEmail({ to: customerEmail, subject: email.subject, html: email.html });
              console.log(`[orders] Status update email (${status}) sent to ${customerEmail}`);
            }
          }
        } catch (emailErr) {
          console.error(`[orders] Status email failed (${status}):`, emailErr.message);
        }
      } else {
        console.warn(`[orders] No email found for order ${data.order_number} — status email skipped`);
      }
    }
  } catch (err) {
    next(err);
  }
});


/* ─── Discount validation (shared by walk-in + checkout) ─── */

router.post('/validate-discount', async (req, res, next) => {
  try {
    const { code, subtotal } = req.body;
    if (!code?.trim()) return next(createError(400, 'Discount code is required.'));

    const { data: discount, error } = await supabaseAdmin
      .from('discounts')
      .select('*')
      .eq('code', code.trim().toUpperCase())
      .single();

    if (error || !discount) {
      return res.json({ success: false, error: 'This code is not valid.' });
    }

    if (!discount.is_active) {
      return res.json({ success: false, error: 'This code is not valid.' });
    }

    if (discount.expires_at && new Date(discount.expires_at) < new Date()) {
      return res.json({ success: false, error: 'This code has expired.' });
    }

    if (discount.starts_at && new Date(discount.starts_at) > new Date()) {
      return res.json({ success: false, error: 'This code is not yet active.' });
    }

    if (discount.usage_limit && discount.times_used >= discount.usage_limit) {
      return res.json({ success: false, error: 'This code has reached its usage limit.' });
    }

    if (discount.min_order && subtotal && subtotal < discount.min_order) {
      const minNaira = Math.floor(discount.min_order / 100).toLocaleString('en-NG');
      return res.json({ success: false, error: `Minimum order of ₦${minNaira} required.` });
    }

    let discountAmount = 0;
    if (discount.type === 'percentage') {
      discountAmount = Math.round((subtotal || 0) * (discount.value / 100));
    } else {
      discountAmount = discount.value;
    }

    res.json({
      success: true,
      data: {
        code: discount.code,
        type: discount.type,
        value: discount.value,
        discount_amount: discountAmount,
      },
    });
  } catch (err) {
    next(err);
  }
});


/* ─── Walk-in order (POS) ─── */

router.post('/orders/walk-in', requirePermission('orders'), async (req, res, next) => {
  try {
    const {
      items, payment_method, subtotal, total,
      discount_amount, discount_code, guest_email,
    } = req.body;

    if (!items || items.length === 0) return next(createError(400, 'Order must have at least one item.'));
    if (!payment_method) return next(createError(400, 'Payment method is required.'));

    /* Link to existing customer if email matches */
    let linkedUserId = null;
    if (guest_email) {
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      const match = (users || []).find((u) => u.email?.toLowerCase() === guest_email.trim().toLowerCase());
      if (match) linkedUserId = match.id;
    }

    /* Generate order number */
    const year = new Date().getFullYear();
    const rand = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `BT-${year}${rand}`;

    /* Generate tracking token */
    const trackingToken = Array.from({ length: 32 }, () =>
      Math.random().toString(36).charAt(2)
    ).join('');

    /* Create order */
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .insert({
        order_number: orderNumber,
        user_id: linkedUserId,
        guest_email: guest_email || null,
        status: 'confirmed',
        order_type: 'walk_in',
        payment_method,
        payment_status: 'paid',
        payment_reference: `WALKIN-${Date.now()}`,
        subtotal: subtotal || 0,
        shipping_cost: 0,
        discount_amount: discount_amount || 0,
        discount_code: discount_code || null,
        total: total || 0,
        shipping_address: null,
        tracking_token: trackingToken,
        created_by: req.user.id,
        notes: `Walk-in order created by ${req.user.full_name || req.user.email}`,
      })
      .select()
      .single();

    if (orderErr) throw orderErr;

    /* Create order items */
    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id || null,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      size: item.size,
      color: item.color || null,
      image_url: item.image_url || null,
    }));

    const { error: itemsErr } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems);

    if (itemsErr) throw itemsErr;

    /* Deduct stock */
    for (const item of items) {
      if (!item.product_id) continue;

      const { data: product } = await supabaseAdmin
        .from('products')
        .select('sizes')
        .eq('id', item.product_id)
        .single();

      if (product?.sizes) {
        const updatedSizes = product.sizes.map((s) => {
          if (s.size === item.size) {
            return { ...s, stock: Math.max(0, (s.stock || 0) - item.quantity) };
          }
          return s;
        });

        await supabaseAdmin
          .from('products')
          .update({ sizes: updatedSizes, updated_at: new Date().toISOString() })
          .eq('id', item.product_id);
      }
    }

    /* Increment discount times_used if discount was applied */
    if (discount_code) {
      incrementDiscountUsage(discount_code);
    }

    res.status(201).json({
      success: true,
      data: { ...order, items: orderItems },
    });
    logActivity(supabaseAdmin, { userId: req.user.id, action: 'order.walkin_created', resourceType: 'order', resourceId: order.id, details: { order_number: order.order_number, total: order.total, payment_method, items: items.length }, ip: getRequestIp(req) });

    /* Send receipt email if customer email was provided */
    if (guest_email) {
      try {
        const email = walkInReceiptEmail({ order, items: orderItems });
        sendEmail({ to: guest_email, subject: email.subject, html: email.html });
      } catch (emailErr) {
        console.error('[walk-in] Receipt email failed:', emailErr.message);
      }
    }
  } catch (err) {
    next(err);
  }
});


/**
 * Increment discount usage count.
 * Shared by walk-in orders and webhook confirmation.
 * Fire-and-forget — never blocks the caller.
 */
export async function incrementDiscountUsage(discountCode) {
  if (!discountCode) return;
  try {
    const { data: disc } = await supabaseAdmin
      .from('discounts')
      .select('id, times_used')
      .eq('code', discountCode.toUpperCase())
      .single();

    if (disc) {
      await supabaseAdmin
        .from('discounts')
        .update({ times_used: (disc.times_used || 0) + 1 })
        .eq('id', disc.id);
      console.log(`[discount] Incremented usage for ${discountCode}: ${(disc.times_used || 0) + 1}`);
    }
  } catch (err) {
    console.error('[discount] Failed to increment usage:', err.message);
  }
}


/* ─── Refund order (Paystack API) ─── */

router.post('/orders/:id/refund', requirePermission('orders'), async (req, res, next) => {
  try {
    const { reason } = req.body;

    /* Fetch order */
    const { data: order, error: fetchErr } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchErr || !order) return next(createError(404, 'Order not found.'));
    if (order.payment_status !== 'paid') return next(createError(400, 'Only paid orders can be refunded.'));
    if (order.payment_status === 'refunded') return next(createError(400, 'This order has already been refunded.'));

    /* If Paystack payment, call Paystack Refund API */
    if (order.payment_method === 'paystack' && order.payment_reference) {
      try {
        const paystackRes = await fetch('https://api.paystack.co/refund', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.paystackSecretKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            transaction: order.payment_reference,
          }),
        });
        const paystackData = await paystackRes.json();

        if (!paystackData.status) {
          return next(createError(400, paystackData.message || 'Paystack refund failed.'));
        }
      } catch (paystackErr) {
        console.error('[refund] Paystack API error:', paystackErr.message);
        return next(createError(500, 'Failed to process Paystack refund. Try again or refund manually from the Paystack dashboard.'));
      }
    }

    /* Update order status */
    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('orders')
      .update({
        payment_status: 'refunded',
        status: 'cancelled',
        notes: [order.notes, `Refund processed${reason ? ': ' + reason : ''}`].filter(Boolean).join('\n'),
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    res.json({ success: true, data: updated });
    logActivity(supabaseAdmin, { userId: req.user.id, action: 'order.refunded', resourceType: 'order', resourceId: req.params.id, details: { order_number: order.order_number, total: order.total, reason: reason || null, method: order.payment_method }, ip: getRequestIp(req) });
  } catch (err) {
    next(err);
  }
});

export default router;
