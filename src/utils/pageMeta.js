/*
 * BLACKTRIBE FASHION — PAGE META UTILITY
 *
 * Sets <title>, <meta description>, Open Graph, Twitter Card,
 * and <link rel="canonical"> for every page.
 *
 * Usage:
 *   import { setPageMeta, clearPageMeta } from '../utils/pageMeta';
 *
 *   useEffect(() => {
 *     setPageMeta({
 *       title: 'Shop. BlackTribe Fashion.',
 *       description: 'Browse the full BlackTribe collection.',
 *       path: '/shop',
 *     });
 *     return () => clearPageMeta();
 *   }, []);
 *
 * Product pages:
 *   setPageMeta({
 *     title: `${product.name}. BlackTribe Fashion.`,
 *     description: product.short_description,
 *     path: `/product/${product.slug}`,
 *     image: product.images?.[0],
 *     type: 'product',
 *   });
 */

const SITE_NAME = 'BlackTribe Fashion';
const BASE_URL = 'https://blacktribefashion.com';
const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`;

const DEFAULTS = {
  title: 'BlackTribe Fashion. Redefining Luxury.',
  description: 'Premium streetwear and luxury fashion. Shop limited collections, pre-order new drops, worldwide shipping. Born from culture, refined by craft.',
  image: DEFAULT_IMAGE,
  type: 'website',
};

/* ─── Helpers ─── */

function setMeta(name, content) {
  if (!content) return;

  // Handle both name="" and property="" attributes
  const isOg = name.startsWith('og:') || name.startsWith('twitter:');
  const attr = isOg ? 'property' : 'name';
  let el = document.querySelector(`meta[${attr}="${name}"]`);

  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(url) {
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', url);
}


/* ─── Public API ─── */

/**
 * Set all page-level meta tags.
 *
 * @param {Object} options
 * @param {string} options.title      — Page title (full, including brand)
 * @param {string} options.description — Meta description (max ~155 chars)
 * @param {string} options.path       — URL path, e.g. '/shop' or '/product/crystal-trucker-jacket'
 * @param {string} [options.image]    — OG image URL (absolute)
 * @param {string} [options.type]     — OG type: 'website' | 'product' (default: 'website')
 */
export function setPageMeta({ title, description, path, image, type } = {}) {
  const pageTitle = title || DEFAULTS.title;
  const pageDesc = description || DEFAULTS.description;
  const pageUrl = path ? `${BASE_URL}${path}` : BASE_URL;
  const pageImage = image || DEFAULTS.image;
  const pageType = type || DEFAULTS.type;

  /* Title */
  document.title = pageTitle;

  /* Standard meta */
  setMeta('description', pageDesc);

  /* Open Graph */
  setMeta('og:title', pageTitle);
  setMeta('og:description', pageDesc);
  setMeta('og:url', pageUrl);
  setMeta('og:image', pageImage);
  setMeta('og:type', pageType);
  setMeta('og:site_name', SITE_NAME);

  /* Twitter Card */
  setMeta('twitter:card', 'summary_large_image');
  setMeta('twitter:title', pageTitle);
  setMeta('twitter:description', pageDesc);
  setMeta('twitter:image', pageImage);

  /* Canonical */
  setCanonical(pageUrl);
}


/**
 * Restore defaults on page unmount.
 * Call this in the useEffect cleanup.
 */
export function clearPageMeta() {
  document.title = DEFAULTS.title;
  setMeta('description', DEFAULTS.description);
  setMeta('og:title', DEFAULTS.title);
  setMeta('og:description', DEFAULTS.description);
  setMeta('og:url', BASE_URL);
  setMeta('og:image', DEFAULTS.image);
  setMeta('og:type', 'website');
  setMeta('twitter:title', DEFAULTS.title);
  setMeta('twitter:description', DEFAULTS.description);
  setMeta('twitter:image', DEFAULTS.image);
  setCanonical(BASE_URL);
}
