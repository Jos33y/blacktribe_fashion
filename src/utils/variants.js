/*
 * BLACKTRIBE FASHION — COLOUR VARIANTS (client)
 *
 * products.colors = [{ name, hex, images: [...], sizes: [{ size, stock }] }]
 * A colour with its own `sizes` is a full variant (own photos + stock).
 * Legacy colours ({ name, hex }) are a label only; stock stays on products.sizes.
 * Mirrors server/utils/variants.js.
 */

export function isVariantColor(c) {
  return !!c && typeof c === 'object' && Array.isArray(c.sizes);
}

export function hasVariants(product) {
  return Array.isArray(product?.colors) && product.colors.some(isVariantColor);
}

export function colorName(c) {
  return typeof c === 'string' ? c : c?.name || '';
}

/* Case-insensitive colour lookup, e.g. from ?color=white */
export function findColor(product, name) {
  if (!name || !Array.isArray(product?.colors)) return null;
  const n = String(name).trim().toLowerCase();
  return product.colors.find((c) => colorName(c).trim().toLowerCase() === n) || null;
}

/*
 * What the shopper sees for the chosen colour.
 * Returns { images, sizes } falling back to the product's own when the
 * colour has none of its own.
 */
export function getVariant(product, selectedColor) {
  const fallback = {
    images: product?.images || [],
    sizes: Array.isArray(product?.sizes) ? product.sizes : [],
  };
  const c = findColor(product, selectedColor);
  if (!c || !isVariantColor(c)) return fallback;
  return {
    images: c.images?.length ? c.images : fallback.images,
    sizes: c.sizes,
  };
}
