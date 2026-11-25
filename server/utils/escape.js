/* Escape text before it goes into an HTML email */
export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* Plain-text field from a customer: trimmed, no tags, capped length */
export function cleanText(value, max = 200) {
  if (value == null) return value;
  return String(value).replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);
}
