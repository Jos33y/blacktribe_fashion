/*
 * BLACKTRIBE JOURNAL — ARTICLE REGISTRY
 *
 * Every article is one file in this folder. To publish:
 *   1. Add the file and import it below.
 *   2. Set status: 'published' once approved.
 * Drafts never appear in the index, sitemap or search. They open only
 * with ?preview=1 so you can review them on the live site.
 *
 * Shared by the server (SEO pages, sitemap) and the browser (React pages).
 */

import detty from './detty-december-outfits.js';
import alkebulan from './alkebulan-meaning.js';
import streetwear from './lagos-streetwear-brands.js';

const ALL = [detty, alkebulan, streetwear];

const byDate = (a, b) => String(b.published).localeCompare(String(a.published));

export function allArticles({ includeDrafts = false } = {}) {
  return ALL.filter((a) => includeDrafts || a.status === 'published').sort(byDate);
}

export function getArticle(slug, { includeDrafts = false } = {}) {
  const a = ALL.find((x) => x.slug === slug);
  if (!a) return null;
  if (a.status !== 'published' && !includeDrafts) return null;
  return a;
}

/* Section headings, in order, for the "In this piece" list */
export function sectionsOf(article) {
  return (article.blocks || []).filter((b) => b.type === 'h2').map((b) => ({ id: b.id, text: b.text }));
}

/* Plain words for read time and for the server's text version */
export function plainText(text) {
  return String(text ?? '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}
