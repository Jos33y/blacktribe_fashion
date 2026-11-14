/*
 * BLACKTRIBE FASHION — COLOUR VARIANTS (server)
 *
 * products.colors = [{ name, hex, images: [...], sizes: [{ size, stock }] }]
 * A colour with its own `sizes` array is a full variant: its own photos and
 * stock. products.images / products.sizes are kept as the first colour's
 * photos and the per-size total across colours, so listings, filters,
 * cards and the homepage keep working unchanged.
 *
 * Legacy colours ({ name, hex } only) are a label: stock stays on
 * products.sizes.
 */

export const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'One Size'];

export function isVariantColor(c) {
  return !!c && typeof c === 'object' && Array.isArray(c.sizes);
}

export function hasVariants(product) {
  return Array.isArray(product?.colors) && product.colors.some(isVariantColor);
}

export function findColor(product, name) {
  if (!name || !Array.isArray(product?.colors)) return null;
  const n = String(name).trim().toLowerCase();
  return product.colors.find((c) => String(c?.name || c).trim().toLowerCase() === n) || null;
}

function sizeRank(size) {
  const i = SIZE_ORDER.indexOf(size);
  return i === -1 ? 99 : i;
}

/* Per-size total across colours, sorted XS → 3XL → One Size */
export function aggregateSizes(colors) {
  const totals = new Map();
  for (const c of colors || []) {
    if (!isVariantColor(c)) continue;
    for (const s of c.sizes) {
      if (!s?.size) continue;
      totals.set(s.size, (totals.get(s.size) || 0) + (parseInt(s.stock, 10) || 0));
    }
  }
  return [...totals.entries()]
    .sort((a, b) => sizeRank(a[0]) - sizeRank(b[0]))
    .map(([size, stock]) => ({ size, stock }));
}

/*
 * Normalise an admin product save. When colours carry their own stock:
 *   - each colour's sizes are cleaned (whole numbers, no negatives)
 *   - sizes = per-size total across colours
 *   - images = first colour's photos (if it has any)
 */
export function normalizeVariantFields({ images, sizes, colors }) {
  if (!Array.isArray(colors) || !colors.some(isVariantColor)) {
    return { images, sizes, colors: Array.isArray(colors) && colors.length ? colors : null };
  }

  const cleaned = colors
    .filter((c) => c && String(c.name || '').trim())
    .map((c) => ({
      name: String(c.name).trim(),
      hex: c.hex || '#0C0C0C',
      images: Array.isArray(c.images) ? c.images.filter((u) => typeof u === 'string' && u) : [],
      sizes: (Array.isArray(c.sizes) ? c.sizes : [])
        .filter((s) => s?.size)
        .map((s) => ({ size: s.size, stock: Math.max(0, parseInt(s.stock, 10) || 0) })),
    }));

  return {
    colors: cleaned,
    sizes: aggregateSizes(cleaned),
    images: cleaned[0]?.images?.length ? cleaned[0].images : images,
  };
}

/*
 * Resolve what a bag line can actually be bought as.
 * Returns { ok, color, image, stock, sizes } or { ok: false, error }.
 */
export function resolveLine(product, { color, size }) {
  const variant = hasVariants(product);
  let colorName = '';
  let images = product.images || [];
  let sizes = Array.isArray(product.sizes) ? product.sizes : [];

  if (variant) {
    const c = findColor(product, color);
    if (!c || !isVariantColor(c)) {
      return { ok: false, error: `Choose a colour for ${product.name}.` };
    }
    colorName = c.name;
    if (c.images?.length) images = c.images;
    sizes = c.sizes;
  } else if (color) {
    /* Legacy label colour: keep it only if the product actually lists it */
    const c = findColor(product, color);
    colorName = c ? (c.name || String(c)) : '';
  }

  let stock = null;
  if (sizes.length > 0) {
    const s = sizes.find((x) => (x.size || x.name) === size);
    if (!s) return { ok: false, error: `${product.name} is not available in size ${size || '(none)'}.` };
    stock = parseInt(s.stock, 10) || 0;
  }

  return { ok: true, color: colorName, image: images[0] || '', stock };
}
