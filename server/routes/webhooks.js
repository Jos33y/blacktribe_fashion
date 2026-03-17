import { Router } from 'express';
import crypto from 'crypto';
import { env } from '../config/env.js';
import { confirmOrderPayment, getOrderById } from '../services/orderService.js';
import { sendEmail } from '../services/emailService.js';
import { orderConfirmationEmail } from '../templates/orderConfirmation.js';

const router = Router();

/**
 * POST /api/webhooks/paystack
 * Verifies signature, confirms order, sends confirmation email.
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

        // ─── Send confirmation email ───
        const fullOrder = await getOrderById(order.id);
        if (fullOrder && customer?.email) {
          const { subject, html } = orderConfirmationEmail({
            order: fullOrder,
            items: fullOrder.items || [],
          });
          await sendEmail({ to: customer.email, subject, html });
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
