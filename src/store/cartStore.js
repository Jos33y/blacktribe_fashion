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

const STORAGE_KEY = 'bt-cart';

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

  clearCart: () => {
    set({ items: [] });
    saveCart([]);
    announce('Bag cleared.');
  },

  getSubtotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
  getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
}));

export default useCartStore;
