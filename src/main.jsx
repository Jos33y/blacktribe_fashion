import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';

// CSS import order matters: reset → variables → base → animations
import './styles/reset.css';
import './styles/variables.css';
import './styles/base.css';
import './styles/animations.css';
import './styles/page-shared.css';
import './styles/a11y.css';

// Hide the inline loader once React has painted AND content is ready.
// The 800ms minimum ensures lazy routes have resolved via Suspense.
// Without this, the loader vanishes in ~32ms while the page is still blank.
function dismissLoader() {
  const loader = document.getElementById('bt-loader');
  if (!loader) return;

  function hide() {
    loader.classList.add('bt-loader--hidden');
    loader.addEventListener('transitionend', () => loader.remove(), { once: true });
  }

  // Wait for the actual page content to be in the DOM
  // Lazy routes + Suspense mean React mounts before content exists
  const minDelay = 2000;
  const start = performance.now();

  function check() {
    const elapsed = performance.now() - start;
    const hasContent = document.querySelector('.home-hero, .shop-hero, .page-hero, .pd, .checkout, .account, .lookbook, .brand-page, .oc')?.children.length > 0;

    if (hasContent && elapsed >= minDelay) {
      hide();
    } else if (elapsed > 6000) {
      // Safety: hide after 4s regardless
      hide();
    } else {
      requestAnimationFrame(check);
    }
  }

  requestAnimationFrame(check);
}

// Register service worker (production only)
function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  // Only register in production — Vite dev server handles its own caching
  if (import.meta.env.DEV) return;

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'activated' && navigator.serviceWorker.controller) {
            // New version available — the next navigation will use it.
            // No disruptive "refresh" prompts. Premium experience.
            console.log('[sw] New version available. Will activate on next visit.');
          }
        });
      });
    } catch (err) {
      console.warn('[sw] Registration failed:', err.message);
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Dismiss loader once content is ready
dismissLoader();

// Clear the safety timeout from index.html
if (window.__btLoaderTimeout) {
  clearTimeout(window.__btLoaderTimeout);
}

// Register SW
registerServiceWorker();