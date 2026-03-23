/*
 * BLACKTRIBE FASHION — ADMIN: Orders + Walk-in + Discount Validation
 */

import express from 'express';
import { requirePermission } from '../../middleware/auth.js';
import { supabaseAdmin } from '../../config/database.js';
import { createError } from '../../middleware/errorHandler.js';
import { logActivity, getRequestIp } from '../../utils/activityLog.js';

const router = express.Router();


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
    if (status) logActivity(supabaseAdmin, { userId: req.user.id, action: 'order.status_changed', resourceType: 'order', resourceId: req.params.id, details: { order_number: data.order_number, status, tracking_number: tracking_number || null }, ip: getRequestIp(req) });
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

    if (discount.usage_limit && (discount.times_used || 0) >= discount.usage_limit) {
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
      await supabaseAdmin.rpc('increment_discount_usage', { discount_code_param: discount_code }).catch(() => {
        /* Fallback: manual increment if RPC not available */
        supabaseAdmin
          .from('discounts')
          .select('times_used')
          .eq('code', discount_code)
          .single()
          .then(({ data: disc }) => {
            if (disc) {
              supabaseAdmin
                .from('discounts')
                .update({ times_used: (disc.times_used || 0) + 1 })
                .eq('code', discount_code)
                .then(() => {});
            }
          });
      });
    }

    res.status(201).json({
      success: true,
      data: { ...order, items: orderItems },
    });
    logActivity(supabaseAdmin, { userId: req.user.id, action: 'order.walkin_created', resourceType: 'order', resourceId: order.id, details: { order_number: order.order_number, total: order.total, payment_method, items: items.length }, ip: getRequestIp(req) });
  } catch (err) {
    next(err);
  }
});

export default router;
