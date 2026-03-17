import { Router } from 'express';
import { createOrder, retryOrder } from '../services/orderService.js';
import { initializeTransaction } from '../services/paymentService.js';
import { createError } from '../middleware/errorHandler.js';

const router = Router();

/**
 * POST /api/cart/checkout
 *
 * Two modes:
 * 1. New order: no pendingOrderId → creates fresh order in Supabase
 * 2. Retry: pendingOrderId present → updates existing pending order
 *
 * Both initialize a new Paystack transaction and return accessCode.
 */
router.post('/checkout', async (req, res, next) => {
  try {
    const {
      contact, address, items, discount, total, subtotal, shipping,
      pendingOrderId,  // If retrying a previous failed/cancelled payment
    } = req.body;

    // ─── Validate ───
    if (!contact?.email) throw createError(400, 'Email is required.');
    if (!items?.length) throw createError(400, 'Cart is empty.');
    if (!address?.fullName) throw createError(400, 'Full name is required.');
    if (!address?.street) throw createError(400, 'Street address is required.');
    if (!address?.city) throw createError(400, 'City is required.');
    if (!address?.state) throw createError(400, 'State is required.');
    if (!total || total <= 0) throw createError(400, 'Invalid order total.');

    // ─── New payment reference (always fresh, even on retry) ───
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
      // ─── RETRY: Update existing pending order ───
      console.log(`[checkout] Retrying payment for order ${pendingOrderId}`);
      try {
        order = await retryOrder({ orderId: pendingOrderId, ...orderData });
      } catch (err) {
        // If retry fails (order paid, not found, etc.), create fresh
        console.warn(`[checkout] Retry failed: ${err.message}. Creating new order.`);
        order = await createOrder(orderData);
      }
    } else {
      // ─── NEW ORDER ───
      order = await createOrder(orderData);
    }

    console.log(`[checkout] Order ${order.order_number || order.id} | ₦${total / 100} | ${contact.email}`);

    // ─── Initialize Paystack ───
    const paystackData = await initializeTransaction({
      email: contact.email,
      amount: total,
      reference: paymentRef,
      metadata: {
        order_id: order.id,
        order_number: order.order_number,
        custom_fields: [
          { display_name: 'Order Number', variable_name: 'order_number', value: order.order_number || '' },
          { display_name: 'Customer Name', variable_name: 'customer_name', value: address.fullName },
        ],
      },
    });

    res.json({
      success: true,
      data: {
        orderId: order.id,
        orderNumber: order.order_number,
        accessCode: paystackData.access_code,
        reference: paymentRef,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
