/*
 * BLACKTRIBE FASHION — EVENTS API
 *
 * Public endpoint for behavioral event tracking.
 * No auth required (anonymous tracking).
 * Rate limited: 60 requests/min per IP.
 * Accepts batched events for efficiency.
 */

import express from 'express';
import { supabaseAdmin } from '../config/database.js';

const router = express.Router();

/* ─── Simple in-memory rate limiter ─── */

const rateLimits = new Map();
const RATE_LIMIT = 60; // requests per minute
const RATE_WINDOW = 60000; // 1 minute

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimits.get(ip);

  if (!entry || now - entry.start > RATE_WINDOW) {
    rateLimits.set(ip, { start: now, count: 1 });
    return true;
  }

  if (entry.count >= RATE_LIMIT) return false;

  entry.count++;
  return true;
}

/* Cleanup rate limit entries every 5 minutes */
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimits) {
    if (now - entry.start > RATE_WINDOW * 2) rateLimits.delete(ip);
  }
}, 300000);

/* ─── Allowed event types ─── */

const ALLOWED_EVENTS = new Set([
  'page_view', 'product_view', 'add_to_cart', 'remove_from_cart',
  'checkout_start', 'checkout_complete', 'payment_success', 'payment_failed',
  'wishlist_add', 'search', 'newsletter_signup',
]);

/* ─── POST /api/events — receive tracking events ─── */

router.post('/', async (req, res) => {
  try {
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
      || req.socket?.remoteAddress
      || 'unknown';

    if (!checkRateLimit(ip)) {
      return res.status(429).json({ success: false, error: 'Rate limit exceeded.' });
    }

    const { events } = req.body;

    if (!events || !Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ success: false, error: 'Events array required.' });
    }

    /* Cap batch size */
    const batch = events.slice(0, 50);

    /* Validate and sanitize */
    const rows = [];
    for (const event of batch) {
      if (!event.event_type || !ALLOWED_EVENTS.has(event.event_type)) continue;
      if (!event.session_id) continue;

      rows.push({
        session_id: String(event.session_id).slice(0, 64),
        user_id: event.user_id || null,
        event_type: event.event_type,
        product_id: event.product_id || null,
        page_path: event.page_path ? String(event.page_path).slice(0, 500) : null,
        referrer: event.referrer ? String(event.referrer).slice(0, 500) : null,
        device_type: ['mobile', 'tablet', 'desktop'].includes(event.device_type) ? event.device_type : null,
        metadata: typeof event.metadata === 'object' ? event.metadata : {},
      });
    }

    if (rows.length === 0) {
      return res.json({ success: true, inserted: 0 });
    }

    /* Bulk insert — fire and forget pattern, but we wait here since it's the endpoint */
    const { error } = await supabaseAdmin
      .from('product_events')
      .insert(rows);

    if (error) {
      console.error('[events] Insert error:', error.message);
      return res.status(500).json({ success: false, error: 'Failed to store events.' });
    }

    res.json({ success: true, inserted: rows.length });
  } catch (err) {
    console.error('[events] Error:', err.message);
    res.status(500).json({ success: false, error: 'Internal error.' });
  }
});

export default router;
