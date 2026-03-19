/*
 * BLACKTRIBE FASHION — useWishlist Hook
 * Add, remove, toggle, and check wishlist items.
 * Requires authenticated user. Gracefully returns false when logged out.
 *
 * Usage:
 *   const { isWishlisted, toggle, loading } = useWishlist(productId);
 *   <button onClick={toggle}>{isWishlisted ? 'Saved' : 'Save'}</button>
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';
import useAuthStore from '../store/authStore';

/* ─── Shared cache so multiple components stay in sync ─── */
const wishlistCache = new Map();
const listeners = new Set();

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

export default function useWishlist(productId) {
  const session = useAuthStore((s) => s.session);
  const isAuthenticated = session !== null;

  const [loading, setLoading] = useState(false);
  const [, forceUpdate] = useState(0);

  /* ─── Subscribe to cache changes ─── */
  useEffect(() => {
    const listener = () => forceUpdate((n) => n + 1);
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);

  /* ─── Load wishlist on first authenticated mount ─── */
  useEffect(() => {
    if (!isAuthenticated) return;
    if (wishlistCache.size > 0) return; // Already loaded

    const load = async () => {
      try {
        const result = await api('/api/wishlist');
        if (result.success && result.data) {
          wishlistCache.clear();
          result.data.forEach((item) => {
            wishlistCache.set(item.product_id, true);
          });
          notifyListeners();
        }
      } catch (err) {
        // Silently fail — wishlist is non-critical
        console.error('[wishlist] Failed to load:', err);
      }
    };

    load();
  }, [isAuthenticated]);

  /* ─── Check if this product is wishlisted ─── */
  const isWishlisted = wishlistCache.has(productId);

  /* ─── Add to wishlist ─── */
  const add = useCallback(async () => {
    if (!isAuthenticated || !productId) return false;

    // Optimistic update
    wishlistCache.set(productId, true);
    notifyListeners();

    try {
      await api('/api/wishlist', {
        method: 'POST',
        body: { product_id: productId },
      });
      return true;
    } catch (err) {
      // Revert on failure
      wishlistCache.delete(productId);
      notifyListeners();
      console.error('[wishlist] Failed to add:', err);
      return false;
    }
  }, [productId, isAuthenticated]);

  /* ─── Remove from wishlist ─── */
  const remove = useCallback(async () => {
    if (!isAuthenticated || !productId) return false;

    // Optimistic update
    wishlistCache.delete(productId);
    notifyListeners();

    try {
      await api(`/api/wishlist/${productId}`, { method: 'DELETE' });
      return true;
    } catch (err) {
      // Revert on failure
      wishlistCache.set(productId, true);
      notifyListeners();
      console.error('[wishlist] Failed to remove:', err);
      return false;
    }
  }, [productId, isAuthenticated]);

  /* ─── Toggle (add or remove) ─── */
  const toggle = useCallback(async () => {
    if (!isAuthenticated) return false;
    setLoading(true);
    const result = isWishlisted ? await remove() : await add();
    setLoading(false);
    return result;
  }, [isAuthenticated, isWishlisted, add, remove]);

  return {
    isWishlisted,
    add,
    remove,
    toggle,
    loading,
    isAuthenticated,
  };
}

/**
 * Clear the wishlist cache. Called on sign out.
 */
export function clearWishlistCache() {
  wishlistCache.clear();
  notifyListeners();
}
