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
 * Verifies signature, confirms order, sends confirmation email + admin notification,
 * increments discount usage.
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
      const { reference, amount, customer } = event.data;

      console.log(`[webhook] Payment success: ${reference} | ₦${amount / 100} | ${customer?.email}`);

      try {
        const order = await confirmOrderPayment(reference);
        console.log(`[webhook] Order confirmed: ${order.order_number}`);

        // ─── Fetch full order with items ───
        const fullOrder = await getOrderById(order.id);

        if (fullOrder) {
          const orderItems = fullOrder.items || [];
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
