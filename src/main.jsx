import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';

// CSS import order matters: reset → variables → base → animations
import './styles/reset.css';
import './styles/variables.css';
import './styles/base.css';
import './styles/animations.css';
import './styles/page-shared.css';

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

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Dismiss after first paint
requestAnimationFrame(() => {
  requestAnimationFrame(dismissLoader);
});
