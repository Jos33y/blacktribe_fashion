import { Router } from 'express';
import { createOrder, retryOrder } from '../services/orderService.js';
import { createError } from '../middleware/errorHandler.js';

const router = Router();

/**
 * POST /api/cart/checkout
 *
 * Creates order in Supabase (pending), returns orderId + reference.
 * Paystack popup is opened client-side with the public key.
 * No server-side Paystack initialization needed for inline popup.
 *
 * Two modes:
 * 1. New order: no pendingOrderId
 * 2. Retry: pendingOrderId present → updates existing pending order
 */
router.post('/checkout', async (req, res, next) => {
  try {
    const {
      contact, address, items, discount, total, subtotal, shipping,
      pendingOrderId,
    } = req.body;

    // ─── Validate ───
    if (!contact?.email) throw createError(400, 'Email is required.');
    if (!items?.length) throw createError(400, 'Cart is empty.');
    if (!address?.fullName) throw createError(400, 'Full name is required.');
    if (!address?.street) throw createError(400, 'Street address is required.');
    if (!address?.city) throw createError(400, 'City is required.');
    if (!address?.state) throw createError(400, 'State is required.');
    if (!total || total <= 0) throw createError(400, 'Invalid order total.');

    // ─── Fresh payment reference every attempt ───
    const paymentRef = `bt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const shippingAddress = {
      name: address.fullName,
      street: address.street,
      city: address.city,
      state: address.state,
      lga: address.lga || null,
      phone: address.phone || contact.phone || null,
    };

    const orderData = {
      email: contact.email,
      phone: contact.phone || address.phone || null,
      items,
      shippingAddress,
      subtotal: subtotal || 0,
      shippingCost: shipping || 0,
      discountAmount: discount?.amount || 0,
      discountCode: discount?.code || null,
      total,
      paymentRef,
    };

    let order;

    if (pendingOrderId) {
      console.log(`[checkout] Retrying payment for order ${pendingOrderId}`);
      try {
        order = await retryOrder({ orderId: pendingOrderId, ...orderData });
      } catch (err) {
        console.warn(`[checkout] Retry failed: ${err.message}. Creating new order.`);
        order = await createOrder(orderData);
      }
    } else {
      order = await createOrder(orderData);
    }

    console.log(`[checkout] Order ${order.order_number || order.id} | ₦${total / 100} | ${contact.email}`);

    // Return order details + reference for client-side Paystack popup
    res.json({
      success: true,
      data: {
        orderId: order.id,
        orderNumber: order.order_number,
        reference: paymentRef,
        email: contact.email,
        amount: total,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
