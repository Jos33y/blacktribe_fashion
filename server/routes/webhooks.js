import { Router } from 'express';
import crypto from 'crypto';
import { env } from '../config/env.js';
import { confirmOrderPayment, getOrderById } from '../services/orderService.js';
import { sendEmail } from '../services/emailService.js';
import { orderConfirmationEmail } from '../templates/orderConfirmation.js';
import { adminOrderNotificationEmail } from '../templates/adminOrderNotification.js';
import { supabaseAdmin } from '../config/database.js';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'support@blacktribefashion.com';

const router = Router();


/**
 * Increment discount usage count after successful payment.
 */
async function incrementDiscountUsage(discountCode) {
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
      console.log(`[webhook] Discount usage incremented: ${discountCode} → ${(disc.times_used || 0) + 1}`);
    }
  } catch (err) {
    console.error('[webhook] Failed to increment discount usage:', err.message);
  }
}


/**
 * Reduce stock for every line of a paid order (colour-aware, row-locked in
 * the database). Runs once per order: confirmOrderPayment only succeeds while
 * the order is still pending, so a repeated webhook never gets here twice.
 */
async function deductStock(items) {
  for (const item of items || []) {
    if (!item.product_id) continue;
    const { error } = await supabaseAdmin.rpc('decrement_product_stock', {
      p_product_id: item.product_id,
      p_size: item.size || '',
      p_color: item.color || null,
      p_qty: item.quantity || 0,
    });
    if (error) {
      console.error(`[webhook] Stock deduction failed for ${item.name} (${item.size}/${item.color || '-'}):`, error.message);
    }
  }
}


/**
 * Paystack must have charged at least the order total, in Naira.
 * Returns null when fine, or a reason string when it isn't.
 */
async function checkAmount(reference, paid, currency) {
  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('id, order_number, total, payment_status')
    .eq('payment_reference', reference)
    .single();

  if (!order) return { reason: 'No order found for this payment reference.' };
  if (order.payment_status !== 'pending') return { order, skip: true };
  if (currency && currency !== 'NGN') return { order, reason: `Paid in ${currency}, expected NGN.` };
  if (typeof paid !== 'number' || paid < order.total) {
    return { order, reason: `Paid ₦${(paid || 0) / 100}, order total is ₦${order.total / 100}.` };
  }
  return { order };
}


/**
 * Resolve customer email — checks guest_email, then auth user.
 */
async function resolveCustomerEmail(order) {
  if (order.guest_email) return order.guest_email;
  if (order.user_id) {
    try {
      const { data: { user }, error } = await supabaseAdmin.auth.admin.getUserById(order.user_id);
      if (!error && user?.email) return user.email;
    } catch { /* silent */ }
  }
  return null;
}


/**
 * POST /api/webhooks/paystack
 * Verifies signature, checks the amount paid covers the order total,
 * confirms the order, reduces stock, sends confirmation email + admin
 * notification, increments discount usage.
 */
router.post('/paystack', async (req, res) => {
  try {
    // ─── Verify Paystack signature ───
    const hash = crypto
      .createHmac('sha512', env.paystackSecretKey)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (hash !== req.headers['x-paystack-signature']) {
      console.warn('[webhook] Invalid Paystack signature');
      return res.sendStatus(400);
    }

    const event = req.body;

    // ─── Handle charge.success ───
    if (event.event === 'charge.success') {
      const { reference, amount, currency, customer } = event.data;

      console.log(`[webhook] Payment success: ${reference} | ₦${amount / 100} | ${customer?.email}`);

      // ─── Amount check: never confirm an order that was underpaid ───
      const check = await checkAmount(reference, amount, currency);
      if (check.skip) {
        console.log(`[webhook] ${reference} already processed. Ignoring repeat.`);
        return res.sendStatus(200);
      }
      if (check.reason) {
        console.error(`[webhook] NOT confirming ${reference}: ${check.reason}`);
        if (check.order) {
          await supabaseAdmin
            .from('orders')
            .update({ notes: `Payment held for review: ${check.reason} (ref ${reference})`, updated_at: new Date().toISOString() })
            .eq('id', check.order.id);
        }
        try {
          await sendEmail({
            to: ADMIN_EMAIL,
            subject: `Payment held for review: ${check.order?.order_number || reference}`,
            html: `<p>A Paystack payment was received but the order was <strong>not</strong> confirmed.</p><p>${check.reason}</p><p>Reference: ${reference}<br>Customer: ${customer?.email || 'unknown'}</p><p>Check the transaction in Paystack before shipping anything.</p>`,
          });
        } catch (mailErr) {
          console.error('[webhook] Review email failed:', mailErr.message);
        }
        return res.sendStatus(200);
      }

      try {
        const order = await confirmOrderPayment(reference);
        console.log(`[webhook] Order confirmed: ${order.order_number}`);

        // ─── Fetch full order with items ───
        const fullOrder = await getOrderById(order.id);

        if (fullOrder) {
          const orderItems = fullOrder.items || [];

          // ─── Reduce stock (colour + size) ───
          await deductStock(orderItems);
          const customerEmail = await resolveCustomerEmail(fullOrder) || customer?.email;

          // ─── Send customer confirmation email ───
          if (customerEmail) {
            try {
              const { subject, html } = orderConfirmationEmail({
                order: fullOrder,
                items: orderItems,
              });
              await sendEmail({ to: customerEmail, subject, html });
              console.log(`[webhook] Confirmation email sent to ${customerEmail}`);
            } catch (emailErr) {
              console.error('[webhook] Customer email failed:', emailErr.message);
            }
          }

          // ─── Send admin notification email ───
          try {
            const adminOrder = {
              ...fullOrder,
              user_email: customerEmail,
            };
            const { subject: adminSubject, html: adminHtml } = adminOrderNotificationEmail({
              order: adminOrder,
              items: orderItems,
            });
            await sendEmail({ to: ADMIN_EMAIL, subject: adminSubject, html: adminHtml });
            console.log(`[webhook] Admin notification sent to ${ADMIN_EMAIL}`);
          } catch (adminErr) {
            console.error('[webhook] Admin notification failed:', adminErr.message);
          }

          // ─── Increment discount usage ───
          if (fullOrder.discount_code) {
            await incrementDiscountUsage(fullOrder.discount_code);
          }
        }
      } catch (err) {
        console.warn(`[webhook] Could not confirm order for ref ${reference}:`, err.message);
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('[webhook] Error processing webhook:', err);
    res.sendStatus(500);
  }
});

export default router;
