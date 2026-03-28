/*
 * BLACKTRIBE FASHION — useWishlist Hook v2
 *
 * v2: Works for EVERYONE.
 *   - Authenticated: API-backed (Supabase wishlist table)
 *   - Guest: localStorage-backed (bt-wishlist key)
 *   - On sign in: localStorage wishlist merges to server, then clears
 *
 * No login redirect. No friction. Heart works instantly.
 *
 * Usage:
 *   const { isWishlisted, toggle, loading } = useWishlist(productId);
 *   <button onClick={toggle}>{isWishlisted ? 'Saved' : 'Save'}</button>
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../utils/api';
import useAuthStore from '../store/authStore';

/* ═══ SHARED CACHE (in-memory, synced with localStorage or API) ═══ */

const wishlistCache = new Map();
const listeners = new Set();
let cacheLoaded = false;

function notifyListeners() {
  listeners.forEach((fn) => fn());
}


/* ═══ LOCALSTORAGE HELPERS ═══ */

const STORAGE_KEY = 'bt-wishlist';

function getLocalWishlist() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalWishlist(ids) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch { /* storage full or unavailable */ }
}

function addToLocal(productId) {
  const ids = getLocalWishlist();
  if (!ids.includes(productId)) {
    ids.push(productId);
    saveLocalWishlist(ids);
  }
}

function removeFromLocal(productId) {
  const ids = getLocalWishlist().filter((id) => id !== productId);
  saveLocalWishlist(ids);
}

function clearLocalWishlist() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch { /* silent */ }
}


/* ═══ MERGE: localStorage → server on sign in ═══ */

let mergeInProgress = false;

async function mergeLocalToServer() {
  if (mergeInProgress) return;

  const localIds = getLocalWishlist();
  if (localIds.length === 0) return;

  mergeInProgress = true;

  try {
    /* Add each local item to server (API deduplicates) */
    const promises = localIds.map((productId) =>
      api('/api/wishlist', {
        method: 'POST',
        body: { product_id: productId },
      }).catch(() => { /* silent — individual failures are fine */ })
    );

    await Promise.allSettled(promises);

    /* Clear localStorage after successful merge */
    clearLocalWishlist();
  } catch {
    /* If merge fails entirely, local items are preserved for next attempt */
  } finally {
    mergeInProgress = false;
  }
}


/* ═══ HOOK ═══ */

export default function useWishlist(productId) {
  const session = useAuthStore((s) => s.session);
  const isAuthenticated = session !== null;

  const [loading, setLoading] = useState(false);
  const [, forceUpdate] = useState(0);
  const prevAuth = useRef(isAuthenticated);

  /* ─── Subscribe to cache changes ─── */
  useEffect(() => {
    const listener = () => forceUpdate((n) => n + 1);
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);

  /* ─── Load wishlist: API for auth, localStorage for guest ─── */
  useEffect(() => {
    if (isAuthenticated) {
      /* Load from API */
      const load = async () => {
        try {
          const result = await api('/api/wishlist');
          if (result.success && result.data) {
            wishlistCache.clear();
            result.data.forEach((item) => {
              wishlistCache.set(item.product_id, true);
            });
            cacheLoaded = true;
            notifyListeners();
          }
        } catch {
          /* Silently fail — wishlist is non-critical */
        }
      };

      /* On sign in transition: merge local → server first, then reload */
      if (prevAuth.current === false) {
        mergeLocalToServer().then(load);
      } else if (!cacheLoaded) {
        load();
      }
    } else {
      /* Guest: load from localStorage */
      wishlistCache.clear();
      const localIds = getLocalWishlist();
      localIds.forEach((id) => wishlistCache.set(id, true));
      cacheLoaded = true;
      notifyListeners();
    }

    prevAuth.current = isAuthenticated;
  }, [isAuthenticated]);

  /* ─── Check if this product is wishlisted ─── */
  const isWishlisted = wishlistCache.has(productId);

  /* ─── Add ─── */
  const add = useCallback(async () => {
    if (!productId) return false;

    /* Optimistic update */
    wishlistCache.set(productId, true);
    notifyListeners();

    if (isAuthenticated) {
      try {
        await api('/api/wishlist', {
          method: 'POST',
          body: { product_id: productId },
        });
        return true;
      } catch {
        wishlistCache.delete(productId);
        notifyListeners();
        return false;
      }
    } else {
      addToLocal(productId);
      return true;
    }
  }, [productId, isAuthenticated]);

  /* ─── Remove ─── */
  const remove = useCallback(async () => {
    if (!productId) return false;

    /* Optimistic update */
    wishlistCache.delete(productId);
    notifyListeners();

    if (isAuthenticated) {
      try {
        await api(`/api/wishlist/${productId}`, { method: 'DELETE' });
        return true;
      } catch {
        wishlistCache.set(productId, true);
        notifyListeners();
        return false;
      }
    } else {
      removeFromLocal(productId);
      return true;
    }
  }, [productId, isAuthenticated]);

  /* ─── Toggle ─── */
  const toggle = useCallback(async () => {
    setLoading(true);
    const result = isWishlisted ? await remove() : await add();
    setLoading(false);
    return result;
  }, [isWishlisted, add, remove]);

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
  cacheLoaded = false;
  notifyListeners();
}
