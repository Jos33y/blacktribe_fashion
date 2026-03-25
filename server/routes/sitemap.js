/*
 * BLACKTRIBE FASHION — DYNAMIC SITEMAP
 *
 * GET /sitemap.xml
 *
 * Generates XML sitemap from:
 *   - Static pages (homepage, shop, about, etc.)
 *   - Product pages (from Supabase)
 *   - Collection pages (from Supabase)
 *
 * Cached for 1 hour. Regenerated on next request after expiry.
 */

import { Router } from 'express';
import { supabaseAdmin } from '../config/database.js';

const router = Router();

const BASE_URL = 'https://blacktribefashion.com';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

let cachedSitemap = null;
let cacheTimestamp = 0;

/* ─── Static pages ─── */
const STATIC_PAGES = [
  { path: '/',                  changefreq: 'daily',   priority: '1.0' },
  { path: '/shop',              changefreq: 'daily',   priority: '0.9' },
  { path: '/collections',       changefreq: 'weekly',  priority: '0.8' },
  { path: '/lookbook',          changefreq: 'weekly',  priority: '0.6' },
  { path: '/about',             changefreq: 'monthly', priority: '0.5' },
  { path: '/contact',           changefreq: 'monthly', priority: '0.4' },
  { path: '/faq',               changefreq: 'monthly', priority: '0.4' },
  { path: '/terms',             changefreq: 'yearly',  priority: '0.2' },
  { path: '/privacy',           changefreq: 'yearly',  priority: '0.2' },
  { path: '/shipping-returns',  changefreq: 'yearly',  priority: '0.2' },
  { path: '/refund-policy',     changefreq: 'yearly',  priority: '0.2' },
];

/* ─── XML helpers ─── */

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatDate(dateStr) {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  return new Date(dateStr).toISOString().split('T')[0];
}

function urlEntry({ path, lastmod, changefreq, priority }) {
  let xml = `  <url>\n    <loc>${escapeXml(BASE_URL + path)}</loc>\n`;
  if (lastmod) xml += `    <lastmod>${lastmod}</lastmod>\n`;
  if (changefreq) xml += `    <changefreq>${changefreq}</changefreq>\n`;
  if (priority) xml += `    <priority>${priority}</priority>\n`;
  xml += '  </url>';
  return xml;
}


/* ─── Generate sitemap ─── */

async function generateSitemap() {
  const urls = [];
  const today = new Date().toISOString().split('T')[0];

  /* Static pages */
  for (const page of STATIC_PAGES) {
    urls.push(urlEntry({
      path: page.path,
      lastmod: today,
      changefreq: page.changefreq,
      priority: page.priority,
    }));
  }

  /* Products */
  try {
    const { data: products } = await supabaseAdmin
      .from('products')
      .select('slug, updated_at')
      .eq('is_active', true)
      .order('updated_at', { ascending: false });

    if (products) {
      for (const p of products) {
        urls.push(urlEntry({
          path: `/product/${p.slug}`,
          lastmod: formatDate(p.updated_at),
          changefreq: 'weekly',
          priority: '0.8',
        }));
      }
    }
  } catch (err) {
    console.error('[sitemap] Error fetching products:', err.message);
  }

  /* Collections */
  try {
    const { data: collections } = await supabaseAdmin
      .from('collections')
      .select('slug, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (collections) {
      for (const c of collections) {
        urls.push(urlEntry({
          path: `/collections/${c.slug}`,
          lastmod: formatDate(c.created_at),
          changefreq: 'weekly',
          priority: '0.7',
        }));
      }
    }
  } catch (err) {
    console.error('[sitemap] Error fetching collections:', err.message);
  }

  /* Categories as shop filter URLs */
  try {
    const { data: categories } = await supabaseAdmin
      .from('categories')
      .select('slug')
      .eq('is_active', true);

    if (categories) {
      for (const cat of categories) {
        urls.push(urlEntry({
          path: `/shop/${cat.slug}`,
          lastmod: today,
          changefreq: 'weekly',
          priority: '0.7',
        }));
      }
    }
  } catch (err) {
    console.error('[sitemap] Error fetching categories:', err.message);
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
  ].join('\n');

  return xml;
}


/* ─── Route ─── */

router.get('/', async (req, res) => {
  try {
    const now = Date.now();

    if (cachedSitemap && (now - cacheTimestamp) < CACHE_TTL) {
      res.set('Content-Type', 'application/xml');
      res.set('Cache-Control', 'public, max-age=3600');
      return res.send(cachedSitemap);
    }

    const xml = await generateSitemap();
    cachedSitemap = xml;
    cacheTimestamp = now;

    res.set('Content-Type', 'application/xml');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(xml);
  } catch (err) {
    console.error('[sitemap] Generation error:', err.message);
    res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
  }
});

export default router;
