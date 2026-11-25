/*
 * BLACKTRIBE FASHION — RATE LIMITER
 *
 * Small in-memory limiter for public write endpoints (contact form,
 * newsletter, checkout, discount checks, payment pages). Stops bots from
 * flooding the inbox, the database or Paystack. One server process, so
 * memory is enough. Keyed by IP + limiter name.
 *
 *   router.post('/', rateLimit({ name: 'contact', max: 5, windowMs: 10 * 60_000 }), handler)
 */

/* The proxy in front of the app (Coolify / Traefik) appends the real client
   IP as the LAST x-forwarded-for entry. Earlier entries can be faked by the
   client, so they are ignored here. */
function clientIp(req) {
  const xff = String(req.headers['x-forwarded-for'] || '').split(',').map((x) => x.trim()).filter(Boolean);
  return xff[xff.length - 1] || req.socket?.remoteAddress || 'unknown';
}

const buckets = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [key, b] of buckets) if (b.reset <= now) buckets.delete(key);
}, 5 * 60 * 1000).unref?.();

export function rateLimit({ name, max, windowMs, message = 'Too many requests. Wait a few minutes and try again.' }) {
  return (req, res, next) => {
    const ip = clientIp(req);
    const key = `${name}:${ip}`;
    const now = Date.now();
    let b = buckets.get(key);
    if (!b || b.reset <= now) {
      b = { count: 0, reset: now + windowMs };
      buckets.set(key, b);
    }
    b.count += 1;
    if (b.count > max) {
      res.set('Retry-After', String(Math.ceil((b.reset - now) / 1000)));
      return res.status(429).json({ success: false, error: message });
    }
    next();
  };
}
