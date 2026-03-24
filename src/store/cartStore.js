/*
 * BLACKTRIBE FASHION — CART STORE
 * Zustand + localStorage persistence (survives browser close).
 *
 * Cart item shape:
 *   { productId, name, slug, price, size, color, image, badge, quantity, maxStock }
 *
 * Unique key: productId + size
 * All prices in kobo. maxStock enforced on add + update.
 *
 * Event tracking: fires add_to_cart / remove_from_cart events.
 */

import { create } from 'zustand';
import { trackAddToCart, trackRemoveFromCart } from '../utils/tracker';

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

function itemKey(productId, size) {
  return `${productId}::${size || 'one-size'}`;
}

const useCartStore = create((set, get) => ({
  items: loadCart(),

  addItem: ({ productId, name, slug, price, size, color, image, badge, quantity = 1, maxStock = null }) => {
    if (!productId || !name || !price) return false;

    const key = itemKey(productId, size);
    const current = get().items;
    const existing = current.find((i) => itemKey(i.productId, i.size) === key);

    let next;
    if (existing) {
      const newQty = existing.quantity + quantity;
      const capped = maxStock != null ? Math.min(newQty, maxStock) : newQty;
      if (capped === existing.quantity) return false;
      next = current.map((i) =>
        itemKey(i.productId, i.size) === key
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

    return true;
  },

  removeItem: (productId, size) => {
    const key = itemKey(productId, size);
    const next = get().items.filter((i) => itemKey(i.productId, i.size) !== key);
    set({ items: next });
    saveCart(next);

    /* Track event */
    trackRemoveFromCart(productId, size);
  },

  updateQuantity: (productId, size, quantity) => {
    if (quantity <= 0) { get().removeItem(productId, size); return; }
    const key = itemKey(productId, size);
    const next = get().items.map((i) => {
      if (itemKey(i.productId, i.size) !== key) return i;
      const capped = i.maxStock != null ? Math.min(quantity, i.maxStock) : quantity;
      return { ...i, quantity: capped };
    });
    set({ items: next });
    saveCart(next);
  },

  clearCart: () => { set({ items: [] }); saveCart([]); },
  getSubtotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
  getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
}));

export default useCartStore;
