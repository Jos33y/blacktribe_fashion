/**
 * loadPaystack — Dynamically loads the Paystack inline.js script.
 *
 * Instead of loading 834KB on every page via index.html,
 * this loads it on-demand only on Checkout and PaymentPage.
 *
 * Returns a promise that resolves when PaystackPop is available.
 * Caches the promise so subsequent calls return immediately.
 */

const PAYSTACK_SCRIPT_URL = 'https://js.paystack.co/v2/inline.js';

let loadPromise = null;

export function loadPaystack() {
  // Already loaded
  if (window.PaystackPop) {
    return Promise.resolve(window.PaystackPop);
  }

  // Already loading
  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise((resolve, reject) => {
    // Check if script tag already exists (edge case)
    const existing = document.querySelector(`script[src="${PAYSTACK_SCRIPT_URL}"]`);
    if (existing) {
      // Script tag exists but hasn't loaded yet — wait for it
      if (window.PaystackPop) {
        return resolve(window.PaystackPop);
      }
      existing.addEventListener('load', () => resolve(window.PaystackPop));
      existing.addEventListener('error', () => reject(new Error('Failed to load payment system.')));
      return;
    }

    const script = document.createElement('script');
    script.src = PAYSTACK_SCRIPT_URL;
    script.async = true;

    script.onload = () => {
      if (window.PaystackPop) {
        resolve(window.PaystackPop);
      } else {
        reject(new Error('Payment system loaded but not available.'));
      }
    };

    script.onerror = () => {
      loadPromise = null; // Allow retry
      reject(new Error('Failed to load payment system. Check your internet connection.'));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
}
