/**
 * Format kobo amount to Naira display string.
 * 18500000 → "₦185,000"
 * No decimals. Comma separator.
 */
export function formatPrice(kobo) {
  if (typeof kobo !== 'number' || isNaN(kobo)) return '₦0';
  const naira = Math.round(kobo / 100);
  return '₦' + naira.toLocaleString('en-NG');
}

/**
 * Parse Naira input string to kobo.
 * "185,000" → 18500000
 * "185000" → 18500000
 */
export function parsePrice(input) {
  const cleaned = String(input).replace(/[₦,\s]/g, '');
  const naira = parseInt(cleaned, 10);
  if (isNaN(naira)) return 0;
  return naira * 100;
}
