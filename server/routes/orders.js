import { Router } from 'express';
import { getOrderById } from '../services/orderService.js';
import { sendEmail } from '../services/emailService.js';
import { paymentReminderEmail } from '../templates/paymentReminder.js';
import { createError } from '../middleware/errorHandler.js';
import { supabaseAdmin } from '../config/database.js';
import { env } from '../config/env.js';

const router = Router();

/**
 * GET /api/orders/:id
 * Returns order with items for the confirmation page.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const order = await getOrderById(req.params.id);
    if (!order) throw createError(404, 'Order not found.');
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
});


/**
 * POST /api/orders/:id/remind
 * Sends the abandoned payment reminder email with payment page link.
 * Called by the client when Paystack popup is cancelled.
 * Only sends once per order (tracked via notes field).
 */
router.post('/:id/remind', async (req, res, next) => {
  try {
    const order = await getOrderById(req.params.id);
    if (!order) throw createError(404, 'Order not found.');

    // Don't send if already paid
    if (order.payment_status === 'paid') {
      return res.json({ success: true, message: 'Order already paid.' });
    }

    // Don't send reminder twice
    if (order.notes?.includes('reminder_sent')) {
      return res.json({ success: true, message: 'Reminder already sent.' });
    }

    const email = order.guest_email || req.body.email;
    if (!email) throw createError(400, 'No email address available.');

    // Build payment page URL
    const paymentUrl = `${env.siteUrl}/pay/${order.order_number}?token=${order.tracking_token}`;

    const { subject, html } = paymentReminderEmail({
      order,
      items: order.items || [],
      paymentUrl,
    });

    await sendEmail({ to: email, subject, html });

    // Mark reminder as sent
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

    res.json({ success: true, data: { ...order, items: items || [] } });
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
router.post('/:id/update-ref', async (req, res, next) => {
  try {
    const { reference } = req.body;
    if (!reference) throw createError(400, 'Reference is required.');

    const { error } = await supabaseAdmin
      .from('orders')
      .update({
        payment_reference: reference,
        payment_status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .eq('payment_status', 'pending');

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
