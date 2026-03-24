/*
 * BLACKTRIBE FASHION — OFFLINE POS QUEUE
 *
 * Lightweight offline support for the walk-in POS:
 *   1. Caches product catalog in localStorage on every successful fetch
 *   2. When offline, serves cached catalog for browsing
 *   3. Queues completed orders in localStorage when offline
 *   4. When connection returns, syncs queued orders to the server
 *   5. Provides online/offline state for UI indicators
 *
 * No service worker needed. No IndexedDB. localStorage only.
 * Covers 90% of the offline use case for a store counter.
 *
 * Usage:
 *   import { offlineQueue } from '../utils/offlineQueue';
 *
 *   offlineQueue.isOnline()
 *   offlineQueue.cacheProducts(products)
 *   offlineQueue.getCachedProducts()
 *   offlineQueue.queueOrder(orderPayload)
 *   offlineQueue.getPendingOrders()
 *   offlineQueue.syncPendingOrders(getToken)
 *   offlineQueue.onStatusChange(callback)
 */

const CACHE_KEY = 'bt-pos-product-cache';
const QUEUE_KEY = 'bt-pos-order-queue';
const CACHE_TIME_KEY = 'bt-pos-cache-time';

/* ═══ ONLINE STATUS ═══ */

let listeners = [];
let online = navigator.onLine;

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    online = true;
    listeners.forEach((fn) => fn(true));
  });
  window.addEventListener('offline', () => {
    online = false;
    listeners.forEach((fn) => fn(false));
  });
}


/* ═══ PRODUCT CACHE ═══ */

function cacheProducts(products) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(products));
    localStorage.setItem(CACHE_TIME_KEY, new Date().toISOString());
  } catch (err) {
    console.warn('[offline] Failed to cache products:', err.message);
  }
}

function getCachedProducts() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : [];
  } catch {
    return [];
  }
}

function getCacheAge() {
  try {
    const time = localStorage.getItem(CACHE_TIME_KEY);
    if (!time) return null;
    return Math.floor((Date.now() - new Date(time).getTime()) / 60000); /* minutes */
  } catch {
    return null;
  }
}


/* ═══ ORDER QUEUE ═══ */

function queueOrder(orderPayload) {
  try {
    const queue = getPendingOrders();
    const queuedOrder = {
      ...orderPayload,
      _queued_at: new Date().toISOString(),
      _queue_id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    };
    queue.push(queuedOrder);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    return queuedOrder;
  } catch (err) {
    console.error('[offline] Failed to queue order:', err.message);
    return null;
  }
}

function getPendingOrders() {
  try {
    const queue = localStorage.getItem(QUEUE_KEY);
    return queue ? JSON.parse(queue) : [];
  } catch {
    return [];
  }
}

function removePendingOrder(queueId) {
  try {
    const queue = getPendingOrders().filter((o) => o._queue_id !== queueId);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch { /* silent */ }
}

function clearPendingOrders() {
  try {
    localStorage.removeItem(QUEUE_KEY);
  } catch { /* silent */ }
}


/* ═══ SYNC ═══ */

let syncing = false;

async function syncPendingOrders(getToken) {
  if (syncing) return { synced: 0, failed: 0 };
  if (!navigator.onLine) return { synced: 0, failed: 0 };

  const queue = getPendingOrders();
  if (queue.length === 0) return { synced: 0, failed: 0 };

  syncing = true;
  let synced = 0;
  let failed = 0;

  try {
    const token = await getToken();

    for (const order of queue) {
      try {
        /* Strip queue metadata before sending */
        const { _queued_at, _queue_id, ...payload } = order;

        const res = await fetch('/api/admin/orders/walk-in', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const json = await res.json();
        if (json.success) {
          removePendingOrder(_queue_id);
          synced++;
        } else {
          console.error('[offline] Sync failed for order:', _queue_id, json.error);
          failed++;
        }
      } catch (err) {
        console.error('[offline] Sync error:', err.message);
        failed++;
        /* Stop syncing if we lost connection mid-sync */
        if (!navigator.onLine) break;
      }
    }
  } catch (err) {
    console.error('[offline] Sync token error:', err.message);
  } finally {
    syncing = false;
  }

  return { synced, failed };
}


/* ═══ LISTENERS ═══ */

function onStatusChange(callback) {
  listeners.push(callback);
  return () => {
    listeners = listeners.filter((fn) => fn !== callback);
  };
}


/* ═══ PUBLIC API ═══ */

export const offlineQueue = {
  isOnline: () => online,
  cacheProducts,
  getCachedProducts,
  getCacheAge,
  queueOrder,
  getPendingOrders,
  removePendingOrder,
  clearPendingOrders,
  syncPendingOrders,
  onStatusChange,
};
