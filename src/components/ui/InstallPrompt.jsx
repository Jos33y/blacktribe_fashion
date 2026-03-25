/*
 * BLACKTRIBE FASHION — PWA INSTALL PROMPT
 *
 * Shows a subtle bottom banner prompting installation.
 * - Android/Chrome: captures beforeinstallprompt, triggers native flow
 * - iOS Safari: shows manual "Add to Home Screen" steps
 * - Dismissed: remembers for 30 days via localStorage
 * - Already installed (standalone mode): never shows
 *
 * Mount in StoreLayout.jsx:
 *   import InstallPrompt from '../components/ui/InstallPrompt';
 *   // In the JSX, after <Footer />:
 *   <InstallPrompt />
 */

import { useState, useEffect, useRef } from 'react';
import '../../styles/ui/InstallPrompt.css';

const DISMISS_KEY = 'bt-install-dismissed';
const DISMISS_DAYS = 30;

function isDismissed() {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const timestamp = parseInt(raw, 10);
    const daysSince = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
    return daysSince < DISMISS_DAYS;
  } catch {
    return false;
  }
}

function setDismissed() {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch { /* silent */ }
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;
}

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

export default function InstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [showIOSSteps, setShowIOSSteps] = useState(false);
  const deferredPrompt = useRef(null);

  useEffect(() => {
    /* Don't show if already installed or recently dismissed */
    if (isStandalone() || isDismissed()) return;

    /* Android/Chrome: capture the beforeinstallprompt event */
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      deferredPrompt.current = e;
      /* Delay showing to not interrupt initial browse */
      setTimeout(() => setVisible(true), 5000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    /* iOS: show after delay (no beforeinstallprompt on Safari) */
    if (isIOS()) {
      const timer = setTimeout(() => setVisible(true), 8000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (isIOS()) {
      setShowIOSSteps(true);
      return;
    }

    if (deferredPrompt.current) {
      deferredPrompt.current.prompt();
      const result = await deferredPrompt.current.userChoice;
      if (result.outcome === 'accepted') {
        setVisible(false);
      }
      deferredPrompt.current = null;
    }
  };

  const handleDismiss = () => {
    setDismissed();
    setVisible(false);
    setShowIOSSteps(false);
  };

  if (!visible) return null;

  return (
    <div className="install-prompt" role="complementary" aria-label="Install app">
      <div className="install-prompt__inner">

        {showIOSSteps ? (
          /* ─── iOS instructions ─── */
          <div className="install-prompt__ios">
            <div className="install-prompt__ios-header">
              <span className="install-prompt__brand">BLACKTRIBE</span>
              <button
                className="install-prompt__close"
                onClick={handleDismiss}
                aria-label="Close"
                type="button"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="install-prompt__ios-title">Add to Home Screen</p>
            <div className="install-prompt__ios-steps">
              <div className="install-prompt__ios-step">
                <span className="install-prompt__ios-num">1</span>
                <span>Tap the share button</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
                </svg>
              </div>
              <div className="install-prompt__ios-step">
                <span className="install-prompt__ios-num">2</span>
                <span>Scroll down and tap "Add to Home Screen"</span>
              </div>
              <div className="install-prompt__ios-step">
                <span className="install-prompt__ios-num">3</span>
                <span>Tap "Add" to confirm</span>
              </div>
            </div>
            <button className="install-prompt__dismiss-btn" onClick={handleDismiss} type="button">
              Maybe later
            </button>
          </div>
        ) : (
          /* ─── Standard prompt ─── */
          <div className="install-prompt__standard">
            <div className="install-prompt__icon">
              <img
                src="/logo_white.png"
                alt=""
                width="32"
                height="32"
                className="install-prompt__logo"
              />
            </div>
            <div className="install-prompt__text">
              <span className="install-prompt__title">Get the BlackTribe app</span>
              <span className="install-prompt__sub">Faster checkout. Offline browsing.</span>
            </div>
            <div className="install-prompt__actions">
              <button
                className="install-prompt__install-btn"
                onClick={handleInstall}
                type="button"
              >
                Install
              </button>
              <button
                className="install-prompt__close"
                onClick={handleDismiss}
                aria-label="Dismiss"
                type="button"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
