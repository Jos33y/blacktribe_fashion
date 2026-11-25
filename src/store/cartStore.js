/*
 * BLACKTRIBE FASHION — CART STORE
 * Zustand + localStorage persistence (survives browser close).
 *
 * Cart item shape:
 *   { productId, name, slug, price, size, color, image, badge, quantity, maxStock }
 *
 * Unique key: productId + colour + size (same piece in two colours = two lines)
 * All prices in kobo. maxStock enforced on add + update.
 *
 * Event tracking: fires add_to_cart / remove_from_cart events.
 * Screen reader: announces cart changes via aria-live region.
 */

import { create } from 'zustand';
import { trackAddToCart, trackRemoveFromCart } from '../utils/tracker';
import { announce } from '../utils/announcer';
import { getVariant } from '../utils/variants';

const STORAGE_KEY = 'bt-cart';
const REFRESH_EVERY = 60 * 1000;
let lastRefresh = 0;

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function saveCart(items) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch {}
}

function itemKey(productId, size, color) {
  return `${productId}::${(color || '').toLowerCase()}::${size || 'one-size'}`;
}

export function cartItemKey(item) {
  return itemKey(item.productId, item.size, item.color);
}

const useCartStore = create((set, get) => ({
  items: loadCart(),

  addItem: ({ productId, name, slug, price, size, color, image, badge, quantity = 1, maxStock = null }) => {
    if (!productId || !name || !price) return false;

    const key = itemKey(productId, size, color);
    const current = get().items;
    const existing = current.find((i) => cartItemKey(i) === key);

    let next;
    if (existing) {
      const newQty = existing.quantity + quantity;
      const capped = maxStock != null ? Math.min(newQty, maxStock) : newQty;
      if (capped === existing.quantity) return false;
      next = current.map((i) =>
        cartItemKey(i) === key
          ? { ...i, quantity: capped, maxStock: maxStock ?? i.maxStock }
          : i
      );
    } else {
      const capped = maxStock != null ? Math.min(quantity, maxStock) : quantity;
      next = [...current, {
        productId, name, slug, price,
        size: size || '', color: color || '',
        image: image || '', badge: badge || null,
        quantity: capped, maxStock: maxStock ?? null,
      }];
    }

    set({ items: next });
    saveCart(next);

    /* Track event */
    trackAddToCart(productId, size, name);

    /* Announce to screen readers */
    announce(`${name} added to bag.`);

    return true;
  },

  removeItem: (productId, size, color = '') => {
    const key = itemKey(productId, size, color);
    const removed = get().items.find((i) => cartItemKey(i) === key);
    const next = get().items.filter((i) => cartItemKey(i) !== key);
    set({ items: next });
    saveCart(next);

    /* Track event */
    trackRemoveFromCart(productId, size);

    /* Announce to screen readers */
    announce(removed ? `${removed.name} removed from bag.` : 'Item removed from bag.');
  },

  updateQuantity: (productId, size, quantity, color = '') => {
    if (quantity <= 0) { get().removeItem(productId, size, color); return; }
    const key = itemKey(productId, size, color);
    const next = get().items.map((i) => {
      if (cartItemKey(i) !== key) return i;
      const capped = i.maxStock != null ? Math.min(quantity, i.maxStock) : quantity;
      return { ...i, quantity: capped };
    });
    set({ items: next });
    saveCart(next);
  },

  /* Replace stored prices with the server's (prices can change after adding) */
  syncPrices: (lines = []) => {
    const priceOf = new Map(lines.map((l) => [itemKey(l.productId, l.size, l.color), l.price]));
    let changed = false;
    const next = get().items.map((i) => {
      const p = priceOf.get(cartItemKey(i));
      if (p != null && p !== i.price) { changed = true; return { ...i, price: p }; }
      return i;
    });
    if (changed) { set({ items: next }); saveCart(next); }
    return changed;
  },

  /* Pull current prices and stock from the shop, so the bag never shows an
     old price. Runs when the bag opens (at most once a minute). Checkout
     still confirms the final total with the server. */
  refreshFromShop: async ({ force = false } = {}) => {
    const items = get().items;
    if (!items.length || (!force && Date.now() - lastRefresh < REFRESH_EVERY)) return false;
    lastRefresh = Date.now();

    const slugs = [...new Set(items.map((i) => i.slug).filter(Boolean))];
    const products = new Map();
    await Promise.all(slugs.map(async (slug) => {
      try {
        const res = await fetch(`/api/products/${encodeURIComponent(slug)}`);
        const json = await res.json();
        if (json.success && json.data) products.set(slug, json.data);
      } catch { /* offline or gone: keep what we have */ }
    }));
    if (!products.size) return false;

    let changed = false;
    const next = get().items.map((i) => {
      const p = products.get(i.slug);
      if (!p) return i;
      let line = i;
      if (Number.isFinite(p.price) && p.price !== i.price) {
        line = { ...line, price: p.price };
      }
      const sizes = getVariant(p, i.color).sizes || [];
      const s = sizes.find((x) => (x.size || x.name) === i.size);
      if (s && Number.isFinite(s.stock) && s.stock > 0 && s.stock !== i.maxStock) {
        line = { ...line, maxStock: s.stock, quantity: Math.min(line.quantity, s.stock) };
      }
      if (line !== i) changed = true;
      return line;
    });
    if (changed) {
      set({ items: next });
      saveCart(next);
      announce('Bag updated with current prices.');
    }
    return changed;
  },

  clearCart: () => {
    set({ items: [] });
    saveCart([]);
    announce('Bag cleared.');
  },

  getSubtotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
  getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
}));

export default useCartStore;
