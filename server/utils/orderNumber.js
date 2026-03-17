/**
 * Generate order number in format BT-YYYYNNNN
 * e.g. BT-20260001, BT-20260002
 * Uses timestamp + random to avoid collisions before DB sequence is set up.
 */
export function generateOrderNumber() {
  const year = new Date().getFullYear();
  const seq = Math.floor(Math.random() * 9000) + 1000; // 4-digit random
  return `BT-${year}${seq}`;
}

/**
 * Generate a tracking token for guest order access.
 * 32-char hex string.
 */
export function generateTrackingToken() {
  const chars = 'abcdef0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}
