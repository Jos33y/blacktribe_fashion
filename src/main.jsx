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

// Hide the inline loader once React has painted
function dismissLoader() {
  const loader = document.getElementById('bt-loader');
  if (loader) {
    loader.classList.add('bt-loader--hidden');
    // Remove from DOM after fade-out completes
    loader.addEventListener('transitionend', () => loader.remove(), { once: true });
  }
  // Clear the safety timeout since we loaded successfully
  if (window.__btLoaderTimeout) {
    clearTimeout(window.__btLoaderTimeout);
  }
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

// Dismiss after first paint
requestAnimationFrame(() => {
  requestAnimationFrame(dismissLoader);
});

// Register SW
registerServiceWorker();
