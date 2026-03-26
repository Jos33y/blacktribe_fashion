import { useEffect } from 'react';

/**
 * useScrollReveal — Shared IntersectionObserver for reveal animations.
 *
 * Fixes the mobile SPA issue where:
 * 1. Page loads with all content at opacity: 0 (reveal class)
 * 2. IntersectionObserver hasn't fired yet
 * 3. User sees blank page, can't scroll
 *
 * Solution: On mount, immediately check which elements are already
 * in the viewport and mark them visible. Then observe the rest normally.
 *
 * @param {string} selector - CSS selector for reveal elements (e.g. '.home-reveal')
 * @param {string} visibleClass - Class to add when visible (e.g. 'home-reveal--visible')
 * @param {Array} deps - Additional dependencies to re-run (e.g. [loading, data])
 * @param {object} options - IntersectionObserver options override
 */
export default function useScrollReveal(
  selector,
  visibleClass,
  deps = [],
  options = {}
) {
  useEffect(() => {
    const elements = document.querySelectorAll(selector);
    if (!elements.length) return;

    const {
      threshold = 0.08,
      rootMargin = '0px 0px -40px 0px',
    } = options;

    // ─── Immediately reveal elements already in viewport ───
    // This prevents the "blank page" problem on mobile where
    // above-fold content starts at opacity: 0 and waits for IO.
    const viewportHeight = window.innerHeight;
    elements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      // Element is at least partially in viewport
      if (rect.top < viewportHeight && rect.bottom > 0) {
        el.classList.add(visibleClass);
      }
    });

    // ─── Observe remaining elements for scroll reveals ───
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(visibleClass);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold, rootMargin }
    );

    elements.forEach((el) => {
      // Only observe elements not already revealed
      if (!el.classList.contains(visibleClass)) {
        observer.observe(el);
      }
    });

    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selector, visibleClass, ...deps]);
}
