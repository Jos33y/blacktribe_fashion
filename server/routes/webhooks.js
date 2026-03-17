import { Router } from 'express';
import crypto from 'crypto';
import { env } from '../config/env.js';
import { confirmOrderPayment } from '../services/orderService.js';

const router = Router();

/**
 * POST /api/webhooks/paystack
 * Paystack sends events here when transactions complete.
 * Verify signature using HMAC SHA512 with secret key.
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
      const { reference, status, amount, customer } = event.data;

      console.log(`[webhook] Payment success: ${reference} | ₦${amount / 100} | ${customer?.email}`);

      try {
        const order = await confirmOrderPayment(reference);
        console.log(`[webhook] Order confirmed: ${order.order_number}`);

        // TODO Phase 5: Send confirmation email via Resend
        // await sendOrderConfirmationEmail(order, customer.email);
      } catch (err) {
        // Order may have already been confirmed (duplicate webhook)
        console.warn(`[webhook] Could not confirm order for ref ${reference}:`, err.message);
      }
    }

    // Always return 200 to acknowledge receipt
    res.sendStatus(200);
  } catch (err) {
    console.error('[webhook] Error processing Paystack webhook:', err);
    res.sendStatus(500);
  }
});

export default router;
