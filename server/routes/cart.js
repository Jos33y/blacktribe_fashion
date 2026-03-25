import { Router } from 'express';
import { supabaseAdmin } from '../config/database.js';
import { createOrder, retryOrder, saveCheckoutProfile } from '../services/orderService.js';
import { sendEmail } from '../services/emailService.js';
import { paymentLinkEmail } from '../templates/paymentLink.js';
import { createError } from '../middleware/errorHandler.js';

const router = Router();


/**
 * POST /api/cart/validate-discount
 *
 * Public endpoint — no auth required.
 * Validates a discount code and returns the discount amount.
 */
router.post('/validate-discount', async (req, res, next) => {
  try {
    const { code, subtotal } = req.body;

    if (!code || typeof code !== 'string') {
      throw createError(400, 'This code is not valid.');
    }

    const trimmed = code.trim().toUpperCase();

    /* Fetch discount by code */
    const { data: discount, error } = await supabaseAdmin
      .from('discounts')
      .select('*')
      .eq('code', trimmed)
      .eq('is_active', true)
      .single();

    if (error || !discount) {
      throw createError(400, 'This code is not valid.');
    }

    /* Check expiry */
    if (discount.expires_at && new Date(discount.expires_at) < new Date()) {
      throw createError(400, 'This code has expired.');
    }

    /* Check start date */
    if (discount.starts_at && new Date(discount.starts_at) > new Date()) {
      throw createError(400, 'This code is not valid.');
    }

    /* Check usage limit */
    if (discount.usage_limit !== null && discount.times_used >= discount.usage_limit) {
      throw createError(400, 'This code has reached its usage limit.');
    }

    /* Check minimum order */
    if (discount.min_order && subtotal < discount.min_order) {
      const minFormatted = (discount.min_order / 100).toLocaleString('en-NG');
      throw createError(400, `Minimum order of ₦${minFormatted} required for this code.`);
    }

    /* Calculate discount amount */
    let discountAmount = 0;
    if (discount.type === 'percentage') {
      discountAmount = Math.round((subtotal || 0) * (discount.value / 100));
    } else {
      /* Fixed amount in kobo */
      discountAmount = discount.value;
    }

    /* Never discount more than the subtotal */
    discountAmount = Math.min(discountAmount, subtotal || 0);

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


/**
 * GET /api/cart/shipping-estimate?state=Lagos&subtotal=2550000
 *
 * Public endpoint — returns the shipping cost for a given state.
 * Used by checkout page to show accurate totals before payment.
 */
router.get('/shipping-estimate', async (req, res, next) => {
  try {
    const { state, subtotal } = req.query;
    const parsedSubtotal = parseInt(subtotal, 10) || 0;
    const cost = await calculateShipping(state || '', parsedSubtotal);
    res.json({ success: true, data: { shipping: cost, state: state || '' } });
  } catch (err) {
    next(err);
  }
});


/**
 * Calculate shipping cost from shipping_zones table.
 *
 * Schema: state_code (text), rate (kobo), free_shipping_min (kobo|null), name (text), zone_type (state|international)
 * free_shipping_min: NULL = no free shipping, 0 = always free, number = threshold in kobo
 *
 * Fallback: if state not found, uses sensible defaults.
 */
async function calculateShipping(state, subtotal) {
  const DEFAULT_SHIPPING = 350000; /* ₦3,500 fallback when zone not found */

  if (!state) {
    return DEFAULT_SHIPPING;
  }

  try {
    /* Query shipping_zones by state_code (Nigerian states) */
    const { data: zone, error } = await supabaseAdmin
      .from('shipping_zones')
      .select('*')
      .eq('is_active', true)
      .ilike('state_code', state.trim())
      .single();

    if (error || !zone) {
      /* State not found — try matching by name for international zones */
      const { data: namedZone } = await supabaseAdmin
        .from('shipping_zones')
        .select('*')
        .eq('is_active', true)
        .ilike('name', state.trim())
        .single();

      if (namedZone) {
        /* Check free shipping: free_shipping_min !== null means it's enabled */
        if (namedZone.free_shipping_min !== null && subtotal >= namedZone.free_shipping_min) {
          return 0;
        }
        return namedZone.rate || DEFAULT_SHIPPING;
      }

      /* No match at all — charge default, never assume free */
      console.warn(`[shipping] No zone found for state: ${state}. Charging default.`);
      return DEFAULT_SHIPPING;
    }

    /* Check free shipping eligibility */
    /* free_shipping_min: NULL = disabled, 0 = always free, number = threshold */
    if (zone.free_shipping_min !== null && subtotal >= zone.free_shipping_min) {
      return 0;
    }

    return zone.rate || DEFAULT_SHIPPING;
  } catch (err) {
    console.error('[shipping] Error calculating shipping:', err.message);
    /* Fallback on any error — charge default, never block checkout */
    return DEFAULT_SHIPPING;
  }
}


/**
 * Extract authenticated user from Authorization header (optional).
 * Returns userId or null. Never blocks checkout for guests.
 */
async function extractOptionalUser(req) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return null;

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) return null;

    return user.id;
  } catch {
    return null;
  }
}


/**
 * POST /api/cart/checkout
 *
 * Creates order in Supabase (pending), sends payment link email,
 * returns orderId + reference for Paystack popup.
 *
 * Shipping is calculated server-side from shipping_zones.
 * Client-sent shipping value is ignored — server is the source of truth.
 *
 * If user is authenticated, saves profile and address for faster checkout next time.
 */
router.post('/checkout', async (req, res, next) => {
  try {
    const {
      contact, address, items, discount, subtotal,
      pendingOrderId,
    } = req.body;

    // ─── Validate ───
    if (!contact?.email) throw createError(400, 'Email is required.');
    if (!items?.length) throw createError(400, 'Cart is empty.');
    if (!address?.fullName) throw createError(400, 'Full name is required.');
    if (!address?.street) throw createError(400, 'Street address is required.');
    if (!address?.city) throw createError(400, 'City is required.');
    if (!address?.state) throw createError(400, 'State is required.');

    // ─── Optional auth extraction (never blocks guest checkout) ───
    const userId = await extractOptionalUser(req);

    // ─── Server-side shipping calculation ───
    const calculatedShipping = await calculateShipping(address.state, subtotal || 0);

    // ─── Discount amount (trust the validated amount from /validate-discount) ───
    const discountAmount = discount?.amount || 0;

    // ─── Calculate total server-side ───
    const calculatedTotal = (subtotal || 0) + calculatedShipping - discountAmount;

    if (calculatedTotal <= 0) throw createError(400, 'Invalid order total.');

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
      shippingCost: calculatedShipping,
      discountAmount,
      discountCode: discount?.code || null,
      total: calculatedTotal,
      paymentRef,
      userId,
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

    console.log(`[checkout] Order ${order.order_number || order.id} | ₦${calculatedTotal / 100} | Shipping: ₦${calculatedShipping / 100} | ${contact.email}`);

    // ─── Send payment link email (non-blocking) ───
    // Insurance: if browser crashes, user can complete payment from email
    try {
      const orderForEmail = {
        ...order,
        subtotal: subtotal || 0,
        shipping_cost: calculatedShipping,
        discount_amount: discountAmount,
        discount_code: discount?.code || null,
        total: calculatedTotal,
        shipping_address: shippingAddress,
      };
      const emailItems = items.map((item) => ({
        name: item.name,
        size: item.size || '',
        color: item.color || null,
        quantity: item.quantity || 1,
        price: item.price,
        image_url: item.image || '',
      }));
      const { subject, html } = paymentLinkEmail({ order: orderForEmail, items: emailItems });
      // Fire and forget — don't block checkout response
      sendEmail({ to: contact.email, subject, html });
    } catch (emailErr) {
      console.error('[checkout] Payment link email error:', emailErr.message);
    }

    // ─── Save profile/address for authenticated users (non-blocking) ───
    if (userId) {
      saveCheckoutProfile({
        userId,
        fullName: address.fullName,
        phone: contact.phone || address.phone || null,
        address: shippingAddress,
      }).catch((err) => {
        console.error('[checkout] Profile save error:', err.message);
      });
    }

    res.json({
      success: true,
      data: {
        orderId: order.id,
        orderNumber: order.order_number,
        reference: paymentRef,
        email: contact.email,
        amount: calculatedTotal,
        shipping: calculatedShipping,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
