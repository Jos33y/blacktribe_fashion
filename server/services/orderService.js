import { supabaseAdmin } from '../config/database.js';
import { generateOrderNumber, generateTrackingToken } from '../utils/orderNumber.js';

/**
 * Create a new order in Supabase.
 */
export async function createOrder({
  email,
  phone,
  items,
  shippingAddress,
  subtotal,
  shippingCost,
  discountAmount,
  discountCode,
  total,
  paymentRef,
  userId = null,
}) {
  const orderNumber = generateOrderNumber();
  const trackingToken = generateTrackingToken();

  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .insert({
      order_number: orderNumber,
      user_id: userId,
      guest_email: userId ? null : email,
      status: 'pending',
      subtotal,
      shipping_cost: shippingCost,
      discount_amount: discountAmount,
      total,
      shipping_address: shippingAddress,
      payment_reference: paymentRef,
      payment_status: 'pending',
      tracking_token: trackingToken,
      discount_code: discountCode || null,
      notes: null,
    })
    .select()
    .single();

  if (orderError) {
    console.error('[order] Failed to create order:', orderError);
    throw new Error('Failed to create order');
  }

  // Insert order items (snapshots)
  const orderItems = items.map((item) => ({
    order_id: order.id,
    product_id: item.productId,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    size: item.size || '',
    color: item.color || null,
    image_url: item.image || '',
  }));

  const { error: itemsError } = await supabaseAdmin
    .from('order_items')
    .insert(orderItems);

  if (itemsError) {
    console.error('[order] Failed to create order items:', itemsError);
  }

  return { ...order, order_number: orderNumber, tracking_token: trackingToken };
}


/**
 * Retry payment for an existing pending order.
 * Updates the order with a new payment reference and refreshed totals.
 * Returns the updated order.
 */
export async function retryOrder({
  orderId,
  email,
  phone,
  items,
  shippingAddress,
  subtotal,
  shippingCost,
  discountAmount,
  discountCode,
  total,
  paymentRef,
}) {
  // Verify order exists and is still pending
  const { data: existing, error: fetchError } = await supabaseAdmin
    .from('orders')
    .select('id, status, payment_status')
    .eq('id', orderId)
    .single();

  if (fetchError || !existing) {
    throw new Error('Order not found.');
  }

  if (existing.payment_status === 'paid') {
    throw new Error('This order has already been paid.');
  }

  // Update the order with fresh data + new payment reference
  const { data: order, error: updateError } = await supabaseAdmin
    .from('orders')
    .update({
      guest_email: email,
      status: 'pending',
      subtotal,
      shipping_cost: shippingCost,
      discount_amount: discountAmount,
      total,
      shipping_address: shippingAddress,
      payment_reference: paymentRef,
      payment_status: 'pending',
      discount_code: discountCode || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .select()
    .single();

  if (updateError) {
    console.error('[order] Failed to update order:', updateError);
    throw new Error('Failed to update order');
  }

  // Replace order items (delete old, insert new)
  await supabaseAdmin
    .from('order_items')
    .delete()
    .eq('order_id', orderId);

  const orderItems = items.map((item) => ({
    order_id: orderId,
    product_id: item.productId,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    size: item.size || '',
    color: item.color || null,
    image_url: item.image || '',
  }));

  const { error: itemsError } = await supabaseAdmin
    .from('order_items')
    .insert(orderItems);

  if (itemsError) {
    console.error('[order] Failed to update order items:', itemsError);
  }

  return order;
}


/**
 * Cancel a pending order (for cleanup or when cart changes significantly).
 */
export async function cancelOrder(orderId) {
  const { error } = await supabaseAdmin
    .from('orders')
    .update({
      status: 'cancelled',
      payment_status: 'failed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .eq('payment_status', 'pending');

  if (error) {
    console.warn('[order] Could not cancel order:', orderId, error.message);
  }
}


/**
 * Update order payment status after Paystack confirmation.
 */
export async function confirmOrderPayment(paymentRef) {
  const { data, error } = await supabaseAdmin
    .from('orders')
    .update({
      status: 'confirmed',
      payment_status: 'paid',
      updated_at: new Date().toISOString(),
    })
    .eq('payment_reference', paymentRef)
    .eq('payment_status', 'pending')
    .select()
    .single();

  if (error) {
    console.error('[order] Failed to confirm order:', error);
    throw new Error('Failed to confirm order');
  }

  return data;
}


/**
 * Get order by ID (for confirmation page).
 */
export async function getOrderById(orderId) {
  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (orderError) return null;

  const { data: items } = await supabaseAdmin
    .from('order_items')
    .select('*')
    .eq('order_id', orderId);

  return { ...order, items: items || [] };
}
