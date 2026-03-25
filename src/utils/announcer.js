/*
 * BLACKTRIBE FASHION — SCREEN READER ANNOUNCER
 *
 * Provides an invisible aria-live region for announcing
 * dynamic updates to screen readers.
 *
 * Usage:
 *   import { announce } from '../utils/announcer';
 *
 *   announce('Added to bag. 3 items total.');
 *   announce('Loading products...', 'assertive');
 *
 * The announcer element is created once and reused.
 * Messages are cleared after 5 seconds to prevent stale readings.
 */

let announcerEl = null;
let clearTimer = null;

function getAnnouncer() {
  if (announcerEl && document.body.contains(announcerEl)) {
    return announcerEl;
  }

  announcerEl = document.createElement('div');
  announcerEl.id = 'bt-announcer';
  announcerEl.setAttribute('role', 'status');
  announcerEl.setAttribute('aria-live', 'polite');
  announcerEl.setAttribute('aria-atomic', 'true');

  /* Visually hidden but accessible to screen readers */
  Object.assign(announcerEl.style, {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: '0',
  });

  document.body.appendChild(announcerEl);
  return announcerEl;
}

/**
 * Announce a message to screen readers.
 *
 * @param {string} message — The message to announce
 * @param {'polite'|'assertive'} [priority='polite'] — Urgency level
 *   'polite'    — waits for current speech to finish (default, for most updates)
 *   'assertive' — interrupts current speech (for errors, critical alerts)
 */
export function announce(message, priority = 'polite') {
  if (!message) return;

  const el = getAnnouncer();

  /* Update aria-live if priority changed */
  if (el.getAttribute('aria-live') !== priority) {
    el.setAttribute('aria-live', priority);
  }

  /*
   * Clear then re-set the text to ensure screen readers
   * detect the change, even if the same message is announced twice.
   */
  el.textContent = '';

  if (clearTimer) clearTimeout(clearTimer);

  requestAnimationFrame(() => {
    el.textContent = message;

    /* Clear after 5 seconds to prevent stale readings on re-focus */
    clearTimer = setTimeout(() => {
      el.textContent = '';
    }, 5000);
  });
}

/**
 * Announce route changes for screen readers.
 * Called from StoreLayout on navigation.
 *
 * @param {string} title — The page title (from document.title)
 */
export function announceRouteChange(title) {
  if (!title) return;
  /* Small delay to let the page render first */
  setTimeout(() => {
    announce(title);
  }, 100);
}
