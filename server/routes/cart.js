import { Router } from 'express';
import { supabaseAdmin } from '../config/database.js';
import { createOrder, retryOrder, saveCheckoutProfile } from '../services/orderService.js';
import { sendEmail } from '../services/emailService.js';
import { paymentLinkEmail } from '../templates/paymentLink.js';
import { createError } from '../middleware/errorHandler.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { cleanText } from '../utils/escape.js';
import { resolveLine } from '../utils/variants.js';

const router = Router();

const MAX_QTY_PER_LINE = 20;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;


/**
 * Resolve a discount code against a server-calculated subtotal.
 * Shared by /validate-discount (preview) and /checkout (the real charge).
 * Throws a 400 with a customer-facing message when the code can't be used.
 */
async function resolveDiscount(code, subtotal) {
  if (!code || typeof code !== 'string') {
    throw createError(400, 'This code is not valid.');
  }

  const trimmed = code.trim().toUpperCase();

  const { data: discount, error } = await supabaseAdmin
    .from('discounts')
    .select('*')
    .eq('code', trimmed)
    .eq('is_active', true)
    .single();

  if (error || !discount) throw createError(400, 'This code is not valid.');

  if (discount.expires_at && new Date(discount.expires_at) < new Date()) {
    throw createError(400, 'This code has expired.');
  }
  if (discount.starts_at && new Date(discount.starts_at) > new Date()) {
    throw createError(400, 'This code is not valid.');
  }
  if (discount.usage_limit !== null && discount.times_used >= discount.usage_limit) {
    throw createError(400, 'This code has reached its usage limit.');
  }
  if (discount.min_order && subtotal < discount.min_order) {
    const minFormatted = (discount.min_order / 100).toLocaleString('en-NG');
    throw createError(400, `Minimum order of ₦${minFormatted} required for this code.`);
  }

  let amount = discount.type === 'percentage'
    ? Math.round((subtotal || 0) * (discount.value / 100))
    : discount.value; /* fixed amount in kobo */

  /* Never discount more than the subtotal */
  amount = Math.max(0, Math.min(amount, subtotal || 0));

  return { code: discount.code, type: discount.type, value: discount.value, amount };
}


/**
 * Rebuild the bag from the database. The browser only says WHAT it wants
 * (product, colour, size, quantity); name, price, image and availability
 * always come from the products table. Throws a 400 naming the piece if
 * anything can't be bought as asked.
 */
async function priceBag(rawItems) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw createError(400, 'Your bag is empty.');
  }

  const ids = [...new Set(rawItems.map((i) => i?.productId).filter((id) => UUID_RE.test(String(id || ''))))];
  if (ids.length === 0) throw createError(400, 'Your bag is empty.');

  const { data: products, error } = await supabaseAdmin
    .from('products')
    .select('id, name, slug, price, images, sizes, colors, is_active')
    .in('id', ids);

  if (error) throw error;
  const byId = new Map((products || []).map((p) => [p.id, p]));

  /* Combine duplicate lines (same piece, colour, size) before stock checks */
  const merged = new Map();
  for (const raw of rawItems) {
    const product = byId.get(raw?.productId);
    if (!product || !product.is_active) {
      throw createError(400, `${raw?.name || 'A piece in your bag'} is no longer available. Remove it from your bag to continue.`);
    }
    const qty = parseInt(raw.quantity, 10);
    if (!Number.isFinite(qty) || qty < 1) throw createError(400, `Check the quantity for ${product.name}.`);

    const line = resolveLine(product, { color: raw.color, size: raw.size || '' });
    if (!line.ok) throw createError(400, line.error);

    const key = `${product.id}::${line.color}::${raw.size || ''}`;
    const prev = merged.get(key);
    merged.set(key, {
      product,
      line,
      size: raw.size || '',
      quantity: (prev?.quantity || 0) + qty,
    });
  }

  const lines = [];
  for (const { product, line, size, quantity } of merged.values()) {
    if (quantity > MAX_QTY_PER_LINE) {
      throw createError(400, `You can order up to ${MAX_QTY_PER_LINE} of ${product.name} at a time.`);
    }
    if (line.stock !== null && line.stock < quantity) {
      const label = [line.color, size].filter(Boolean).join(', ');
      throw createError(400, line.stock === 0
        ? `${product.name}${label ? ` (${label})` : ''} is sold out.`
        : `Only ${line.stock} of ${product.name}${label ? ` (${label})` : ''} left.`);
    }

    lines.push({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      quantity,
      size,
      color: line.color || '',
      image: line.image || '',
    });
  }

  const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
  return { lines, subtotal };
}


/**
 * POST /api/cart/validate-discount
 *
 * Public endpoint — no auth required.
 * Validates a discount code and returns the discount amount.
 */
router.post('/validate-discount', rateLimit({ name: 'discount', max: 20, windowMs: 10 * 60 * 1000 }), async (req, res, next) => {
  try {
    const { code, subtotal, items } = req.body;

    /* Price from the bag when it's sent; the client subtotal is only a fallback for the preview */
    let base = parseInt(subtotal, 10) || 0;
    if (Array.isArray(items) && items.length > 0) {
      try { base = (await priceBag(items)).subtotal; } catch { /* preview only */ }
    }

    const d = await resolveDiscount(code, base);

    res.json({
      success: true,
      data: {
        code: d.code,
        type: d.type,
        value: d.value,
        discount_amount: d.amount,
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
 * Server is the source of truth for every amount:
 *   - items are re-priced from the products table (priceBag)
 *   - colour, size and stock are checked per line
 *   - the discount is re-validated against the server subtotal
 *   - shipping is calculated from shipping_zones
 * Client-sent prices, subtotal, discount amount and shipping are ignored.
 *
 * If user is authenticated, saves profile and address for faster checkout next time.
 */
router.post('/checkout', rateLimit({ name: 'checkout', max: 20, windowMs: 10 * 60 * 1000 }), async (req, res, next) => {
  try {
    const {
      contact, address, items: rawItems, discount,
      pendingOrderId,
    } = req.body;

    // ─── Validate ───
    if (!contact?.email) throw createError(400, 'Email is required.');
    if (!rawItems?.length) throw createError(400, 'Cart is empty.');
    if (!address?.fullName) throw createError(400, 'Full name is required.');
    if (!address?.street) throw createError(400, 'Street address is required.');
    if (!address?.city) throw createError(400, 'City is required.');
    if (!address?.state) throw createError(400, 'State is required.');

    // ─── Optional auth extraction (never blocks guest checkout) ───
    const userId = await extractOptionalUser(req);

    // ─── Re-price the bag from the database ───
    const { lines: items, subtotal } = await priceBag(rawItems);

    // ─── Server-side shipping calculation ───
    const calculatedShipping = await calculateShipping(address.state, subtotal);

    // ─── Discount: re-validated against the server subtotal ───
    let discountAmount = 0;
    let discountCode = null;
    if (discount?.code) {
      const d = await resolveDiscount(discount.code, subtotal);
      discountAmount = d.amount;
      discountCode = d.code;
    }

    // ─── Calculate total server-side ───
    const calculatedTotal = subtotal + calculatedShipping - discountAmount;

    if (calculatedTotal <= 0) throw createError(400, 'Invalid order total.');

    // ─── Fresh payment reference every attempt ───
    const paymentRef = `bt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    /* Customer text goes into emails and the admin: no tags, sane lengths */
    if (String(contact.email).length > 200 || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(String(contact.email).trim())) {
      throw createError(400, 'Enter a valid email address.');
    }
    contact.email = String(contact.email).trim();
    const shippingAddress = {
      name: cleanText(address.fullName, 120),
      street: cleanText(address.street, 250),
      city: cleanText(address.city, 80),
      state: cleanText(address.state, 60),
      lga: cleanText(address.lga, 80) || null,
      phone: cleanText(address.phone || contact.phone, 30) || null,
    };

    const orderData = {
      email: contact.email,
      phone: cleanText(contact.phone || address.phone, 30) || null,
      items,
      shippingAddress,
      subtotal,
      shippingCost: calculatedShipping,
      discountAmount,
      discountCode,
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
        subtotal,
        shipping_cost: calculatedShipping,
        discount_amount: discountAmount,
        discount_code: discountCode,
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
        fullName: shippingAddress.name,
        phone: shippingAddress.phone,
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
        subtotal,
        discount: discountAmount,
        /* Server prices per line, so the bag can correct stale prices */
        items: items.map((l) => ({ productId: l.productId, color: l.color, size: l.size, price: l.price })),
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
