/*
 * BLACKTRIBE FASHION — EVENT TRACKER
 *
 * Lightweight behavioral tracking. Fire-and-forget.
 * Never blocks the user experience. Failures are silent.
 *
 * Usage:
 *   import { trackEvent, trackProductView, trackAddToCart } from '../utils/tracker';
 *
 *   trackEvent('page_view', { page_path: '/shop' });
 *   trackProductView(productId);
 *   trackAddToCart(productId, size);
 *   trackCheckoutStart();
 *   trackPaymentSuccess(orderId, total);
 */

const SESSION_KEY = 'bt-session-id';
const QUEUE_KEY = 'bt-event-queue';
const FLUSH_INTERVAL = 5000; // 5 seconds
const MAX_QUEUE = 20;

/* ─── Session ID ─── */

function getSessionId() {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID ? crypto.randomUUID() : generateId();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return generateId();
  }
}

function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}


/* ─── Device Detection ─── */

function getDeviceType() {
  const w = window.innerWidth;
  if (w < 768) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
}


/* ─── Event Queue (batches events for efficiency) ─── */

let queue = [];
let flushTimer = null;

function enqueue(event) {
  queue.push(event);

  if (queue.length >= MAX_QUEUE) {
    flush();
  } else if (!flushTimer) {
    flushTimer = setTimeout(flush, FLUSH_INTERVAL);
  }
}

async function flush() {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  if (queue.length === 0) return;

  const events = [...queue];
  queue = [];

  try {
    await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events }),
      keepalive: true, // Survives page unload
    });
  } catch {
    /* Silent. Never block the user. */
  }
}

/* Flush on page unload */
if (typeof window !== 'undefined') {
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });
  window.addEventListener('pagehide', flush);
}


/* ─── Core Track Function ─── */

export function trackEvent(eventType, data = {}) {
  try {
    const event = {
      session_id: getSessionId(),
      event_type: eventType,
      product_id: data.product_id || null,
      page_path: data.page_path || window.location.pathname,
      referrer: data.referrer || document.referrer || null,
      device_type: getDeviceType(),
      metadata: data.metadata || {},
      created_at: new Date().toISOString(),
    };

    enqueue(event);
  } catch {
    /* Silent. Tracking must never crash the app. */
  }
}


/* ─── Convenience Functions ─── */

export function trackPageView(path) {
  trackEvent('page_view', { page_path: path || window.location.pathname });
}

export function trackProductView(productId, productName) {
  trackEvent('product_view', {
    product_id: productId,
    metadata: productName ? { name: productName } : {},
  });
}

export function trackAddToCart(productId, size, productName) {
  trackEvent('add_to_cart', {
    product_id: productId,
    metadata: { size, name: productName || null },
  });
}

export function trackRemoveFromCart(productId, size) {
  trackEvent('remove_from_cart', {
    product_id: productId,
    metadata: { size },
  });
}

export function trackCheckoutStart() {
  trackEvent('checkout_start');
}

export function trackCheckoutComplete(orderId) {
  trackEvent('checkout_complete', {
    metadata: { order_id: orderId },
  });
}

export function trackPaymentSuccess(orderId, total) {
  trackEvent('payment_success', {
    metadata: { order_id: orderId, total },
  });
}

export function trackPaymentFailed(orderId, reason) {
  trackEvent('payment_failed', {
    metadata: { order_id: orderId, reason },
  });
}

export function trackWishlistAdd(productId) {
  trackEvent('wishlist_add', { product_id: productId });
}

export function trackSearch(query, resultCount) {
  trackEvent('search', {
    metadata: { query, result_count: resultCount },
  });
}

export function trackNewsletterSignup() {
  trackEvent('newsletter_signup');
}
