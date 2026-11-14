/*
 * BLACKTRIBE FASHION — SERVER-SIDE SEO PAGES
 *
 * The storefront is a React app: the server sends one almost-empty
 * index.html and the browser builds the page with JavaScript. Google runs
 * that JavaScript, but AI assistants (ChatGPT, Claude, Perplexity) and link
 * previews (WhatsApp, Instagram, X, iMessage) do not. They saw an empty page.
 *
 * This fills index.html before it is sent, for every storefront URL:
 *   <head>  the right title, description, canonical, Open Graph and Twitter
 *           tags, plus JSON-LD (Product, Article, Organization, breadcrumbs)
 *   #root   the page's real content as plain HTML: names, prices, story text
 *
 * People see exactly the same site: React replaces the #root content as
 * soon as it mounts (behind the loader). Bots finally read the real thing.
 *
 * Status codes are honest: unknown URLs and missing products return 404
 * (not a 200 empty shell, which Google flags as a "soft 404"), and old
 * product links that were merged answer with a 301 to the merged piece.
 *
 * index.html carries two markers this file fills:
 *   <!--seo-head-->…<!--/seo-head-->   replaced with the page's head tags
 *   <div id="root"><!--seo-body--></div>
 */

import fs from 'fs';
import { supabaseAdmin } from '../config/database.js';

const SITE = (process.env.SITE_URL || 'https://blacktribefashion.com').replace(/\/$/, '');
const BRAND = 'BlackTribe Fashion';
const DEFAULT_TITLE = 'BlackTribe Fashion. Redefining Luxury.';
const DEFAULT_DESC = 'Premium streetwear and luxury fashion from Lagos. Limited collections, pre-order drops, worldwide shipping. Born from culture, refined by craft.';
const DEFAULT_IMAGE = `${SITE}/og-image.png`;
const INSTAGRAM = 'https://www.instagram.com/blacktribe_fashion/';

const CACHE_MS = 5 * 60 * 1000;
const CACHE_MAX = 500;
const cache = new Map();


/* ─── Small helpers ─── */

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* Editorial text marks accent words with *asterisks*; strip them for plain text */
function plain(value) {
  return String(value ?? '').replace(/\*/g, '').replace(/\s+/g, ' ').trim();
}

function clip(value, max = 160) {
  const s = plain(value);
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1).replace(/\s+\S*$/, '')}…`;
}

function naira(kobo) {
  return `₦${Math.round((kobo || 0) / 100).toLocaleString('en-NG')}`;
}

function paragraphs(text) {
  return String(text ?? '').split(/\n\s*\n/).map((p) => plain(p)).filter(Boolean);
}

function jsonLd(data) {
  /* "</" inside JSON could close the script tag early */
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
}

function firstImage(images) {
  return Array.isArray(images) && images.length ? images[0] : null;
}


/* ─── Head tags ─── */

function headTags({ title, description, path, image, type = 'website', noindex = false, ld = [] }) {
  const url = `${SITE}${path}`;
  const img = image || DEFAULT_IMAGE;
  const t = esc(title);
  const d = esc(description);
  return [
    `<title>${t}</title>`,
    `<meta name="description" content="${d}" />`,
    `<meta name="robots" content="${noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large'}" />`,
    `<link rel="canonical" href="${esc(url)}" />`,
    `<meta property="og:type" content="${type}" />`,
    `<meta property="og:locale" content="en_NG" />`,
    `<meta property="og:site_name" content="${BRAND}" />`,
    `<meta property="og:title" content="${t}" />`,
    `<meta property="og:description" content="${d}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:image" content="${esc(img)}" />`,
    `<meta property="og:image:alt" content="${t}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${t}" />`,
    `<meta name="twitter:description" content="${d}" />`,
    `<meta name="twitter:image" content="${esc(img)}" />`,
    ...ld.map(jsonLd),
  ].join('\n  ');
}

const ORGANIZATION = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: BRAND,
  alternateName: ['BlackTribe', 'Black Tribe'],
  url: SITE,
  logo: `${SITE}/logo512.png`,
  foundingDate: '2017',
  foundingLocation: { '@type': 'Place', name: 'Lagos, Nigeria' },
  slogan: 'Redefining Luxury',
  email: 'support@blacktribefashion.com',
  sameAs: [INSTAGRAM, 'https://www.instagram.com/blacktribe_lifestyle/'],
};

function breadcrumbs(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, path], i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name,
      item: `${SITE}${path}`,
    })),
  };
}


/* ─── Body HTML (plain, semantic; React replaces it on mount) ─── */

function nav() {
  return `<nav><a href="/">${BRAND}</a> · <a href="/shop">Shop</a> · <a href="/collections">Collections</a> · <a href="/lookbook">Lookbook</a> · <a href="/editorial">Editorial</a> · <a href="/about">About</a></nav>`;
}

function productList(products) {
  if (!products?.length) return '';
  return `<ul>${products.map((p) => {
    const img = firstImage(p.images);
    return `<li><a href="/product/${esc(p.slug)}">${img ? `<img src="${esc(img)}" alt="${esc(p.name)}" width="300" height="400" loading="lazy" />` : ''}<span>${esc(p.name)}</span></a> <span>${naira(p.price)}</span>${p.badge ? ` <span>${esc(p.badge)}</span>` : ''}</li>`;
  }).join('')}</ul>`;
}

function shell(inner) {
  return `<div class="seo-content">${nav()}<main>${inner}</main><footer><p>${BRAND}. Redefining Luxury. Founded in Lagos, 2017. <a href="mailto:support@blacktribefashion.com">support@blacktribefashion.com</a> · <a href="${INSTAGRAM}">Instagram</a></p></footer></div>`;
}


/* ─── Data ─── */

const PRODUCT_FIELDS = 'id, name, slug, price, images, badge, short_description, description, sizes, colors, updated_at, categories(name, slug), collections(name, slug)';
const LIST_FIELDS = 'name, slug, price, images, badge';

async function activeProducts(limit = 60, filter) {
  let q = supabaseAdmin.from('products').select(LIST_FIELDS).eq('is_active', true);
  if (filter) q = filter(q);
  const { data } = await q.order('created_at', { ascending: false }).limit(limit);
  return data || [];
}


/* ─── Static pages ─── */

const STATIC = {
  '/about': ['About', 'BlackTribe started in Lagos in 2017 as a gathering: art shows, warehouse parties, a community of creatives. The clothes came later. The identity was always there.'],
  '/lookbook': ['Lookbook', 'BlackTribe Fashion collections, styled and photographed.'],
  '/contact': ['Contact', 'Get in touch with BlackTribe Fashion. Email support@blacktribefashion.com or message us on Instagram.'],
  '/faq': ['FAQ', 'Answers about BlackTribe orders, pre-orders, sizing, shipping and payment.'],
  '/shipping-returns': ['Shipping and Returns', 'How BlackTribe Fashion ships worldwide and handles returns.'],
  '/refund-policy': ['Refund Policy', 'BlackTribe Fashion refund policy.'],
  '/terms': ['Terms', 'Terms of use for blacktribefashion.com.'],
  '/privacy': ['Privacy', 'How BlackTribe Fashion handles your data.'],
  '/track': ['Track Your Order', 'Track a BlackTribe Fashion order.'],
};

/* Private or transactional: served normally, never indexed */
const NOINDEX = [/^\/admin/, /^\/account/, /^\/auth/, /^\/checkout/, /^\/pay\//, /^\/order-confirmation\//, /\/print$/];


/* ─── Route resolvers: return { status, head, body } or { redirect } ─── */

async function resolve(path) {
  /* Home */
  if (path === '/') {
    const { data: collection } = await supabaseAdmin
      .from('collections').select('id, name, slug, description')
      .eq('is_active', true).order('created_at', { ascending: false }).limit(1).maybeSingle();
    const newest = await activeProducts(12);
    return {
      head: headTags({
        title: DEFAULT_TITLE,
        description: DEFAULT_DESC,
        path: '/',
        ld: [ORGANIZATION, { '@context': 'https://schema.org', '@type': 'WebSite', name: BRAND, url: SITE }],
      }),
      body: shell(`<h1>${BRAND}. Redefining Luxury.</h1><p>${esc(DEFAULT_DESC)}</p>${collection ? `<h2><a href="/collections/${esc(collection.slug)}">${esc(collection.name)}</a>: the new collection</h2>${collection.description ? `<p>${esc(collection.description)}</p>` : ''}` : ''}<h2>New pieces</h2>${productList(newest)}`),
    };
  }

  /* Shop, optionally by category */
  const shop = path.match(/^\/shop(?:\/([^/]+))?$/);
  if (shop) {
    let category = null;
    if (shop[1]) {
      const { data } = await supabaseAdmin.from('categories').select('id, name, slug').eq('slug', shop[1]).maybeSingle();
      if (!data) return null;
      category = data;
    }
    const products = await activeProducts(80, category ? (q) => q.eq('category_id', category.id) : null);
    const name = category ? category.name : 'Shop';
    const crumbs = [['Home', '/'], ['Shop', '/shop']];
    if (category) crumbs.push([category.name, path]);
    return {
      head: headTags({
        title: `${name}. ${BRAND}`,
        description: category
          ? `Shop ${category.name} from BlackTribe Fashion. Limited runs, pre-order, worldwide shipping.`
          : 'Shop every BlackTribe Fashion piece: jackets, denim, knitwear, tees and caps. Limited runs, pre-order, worldwide shipping.',
        path,
        image: firstImage(products[0]?.images),
        ld: [breadcrumbs(crumbs), {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          itemListElement: products.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE}/product/${p.slug}`, name: p.name })),
        }],
      }),
      body: shell(`<h1>${esc(name)}</h1><p>${products.length} pieces</p>${productList(products)}`),
    };
  }

  /* Product */
  const product = path.match(/^\/product\/([^/]+)$/);
  if (product) {
    const slug = decodeURIComponent(product[1]);
    const { data: p } = await supabaseAdmin.from('products').select(PRODUCT_FIELDS).eq('slug', slug).eq('is_active', true).maybeSingle();

    if (!p) {
      /* A merged colourway: send the old link to the merged piece */
      const { data: r } = await supabaseAdmin
        .from('product_redirects').select('color, products(slug, is_active)').eq('old_slug', slug).maybeSingle();
      if (r?.products?.is_active) {
        const qs = r.color ? `?color=${encodeURIComponent(r.color)}` : '';
        return { redirect: `/product/${r.products.slug}${qs}` };
      }
      return null;
    }

    const images = Array.isArray(p.images) ? p.images : [];
    const colours = (Array.isArray(p.colors) ? p.colors : []).map((c) => c?.name).filter(Boolean);
    const sizes = (Array.isArray(p.sizes) ? p.sizes : []).map((s) => s?.size).filter(Boolean);
    const desc = p.short_description || p.description || `${p.name} by BlackTribe Fashion.`;
    const price = Math.round((p.price || 0) / 100);
    const preorder = /pre-?order/i.test(p.badge || '');

    const crumbs = [['Home', '/'], ['Shop', '/shop']];
    if (p.categories) crumbs.push([p.categories.name, `/shop/${p.categories.slug}`]);
    crumbs.push([p.name, path]);

    return {
      head: headTags({
        title: `${p.name}. ${naira(p.price)}. ${BRAND}`,
        description: clip(`${desc} ${preorder ? 'Available to pre-order.' : ''} Ships worldwide.`),
        path,
        image: images[0],
        type: 'product',
        ld: [breadcrumbs(crumbs), {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: p.name,
          description: plain(p.description || desc),
          image: images,
          sku: p.id,
          brand: { '@type': 'Brand', name: BRAND },
          ...(p.categories ? { category: p.categories.name } : {}),
          ...(colours.length ? { color: colours.join(', ') } : {}),
          ...(sizes.length ? { size: sizes.join(', ') } : {}),
          offers: {
            '@type': 'Offer',
            url: `${SITE}${path}`,
            priceCurrency: 'NGN',
            price,
            availability: preorder ? 'https://schema.org/PreOrder' : 'https://schema.org/InStock',
            itemCondition: 'https://schema.org/NewCondition',
            seller: { '@type': 'Organization', name: BRAND },
          },
        }],
      }),
      body: shell(`<article><h1>${esc(p.name)}</h1><p>${naira(p.price)}${p.badge ? ` · ${esc(p.badge)}` : ''}</p>${images.map((src, i) => `<img src="${esc(src)}" alt="${esc(`${p.name}${i ? `, view ${i + 1}` : ''}`)}" width="600" height="800" />`).join('')}${paragraphs(p.description || desc).map((x) => `<p>${esc(x)}</p>`).join('')}${colours.length ? `<p>Colours: ${esc(colours.join(', '))}</p>` : ''}${sizes.length ? `<p>Sizes: ${esc(sizes.join(', '))}</p>` : ''}${p.collections ? `<p>Collection: <a href="/collections/${esc(p.collections.slug)}">${esc(p.collections.name)}</a></p>` : ''}</article>`),
    };
  }

  /* Collections list */
  if (path === '/collections') {
    const { data } = await supabaseAdmin.from('collections').select('name, slug, description, image_url').eq('is_active', true).order('created_at', { ascending: false });
    const list = data || [];
    return {
      head: headTags({
        title: `Collections. ${BRAND}`,
        description: 'Every BlackTribe Fashion collection, newest first. Limited runs made in Lagos.',
        path,
        image: list[0]?.image_url,
        ld: [breadcrumbs([['Home', '/'], ['Collections', path]])],
      }),
      body: shell(`<h1>Collections</h1><ul>${list.map((c) => `<li><h2><a href="/collections/${esc(c.slug)}">${esc(c.name)}</a></h2>${c.description ? `<p>${esc(c.description)}</p>` : ''}</li>`).join('')}</ul>`),
    };
  }

  /* One collection */
  const coll = path.match(/^\/collections\/([^/]+)$/);
  if (coll) {
    const { data: c } = await supabaseAdmin.from('collections').select('id, name, slug, description, image_url').eq('slug', decodeURIComponent(coll[1])).eq('is_active', true).maybeSingle();
    if (!c) return null;
    const products = await activeProducts(80, (q) => q.eq('collection_id', c.id));
    return {
      head: headTags({
        title: `${c.name}. ${BRAND}`,
        description: clip(c.description || `The ${c.name} collection by BlackTribe Fashion. Limited runs, pre-order, worldwide shipping.`),
        path,
        image: c.image_url || firstImage(products[0]?.images),
        ld: [breadcrumbs([['Home', '/'], ['Collections', '/collections'], [c.name, path]]), {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: c.name,
          description: plain(c.description),
          url: `${SITE}${path}`,
        }],
      }),
      body: shell(`<h1>${esc(c.name)}</h1>${c.description ? `<p>${esc(c.description)}</p>` : ''}${productList(products)}`),
    };
  }

  /* Editorial list */
  if (path === '/editorial') {
    const { data } = await supabaseAdmin.from('editorial_features').select('title, slug, issue_label, dek, cover_image').eq('status', 'published').order('published_at', { ascending: false });
    const list = data || [];
    return {
      head: headTags({
        title: `Editorial. ${BRAND}`,
        description: 'The BlackTribe magazine: stories from Lagos and the tribe worldwide, on the web and in print.',
        path,
        image: list[0]?.cover_image,
        ld: [breadcrumbs([['Home', '/'], ['Editorial', path]])],
      }),
      body: shell(`<h1>Editorial</h1><ul>${list.map((f) => `<li><h2><a href="/editorial/${esc(f.slug)}">${esc(plain(f.issue_label))}: ${esc(plain(f.title))}</a></h2>${f.dek ? `<p>${esc(f.dek)}</p>` : ''}</li>`).join('')}</ul>`),
    };
  }

  /* One editorial issue (the /print version is noindex, handled below) */
  const ed = path.match(/^\/editorial\/([^/]+)(\/print)?$/);
  if (ed) {
    const { data: f } = await supabaseAdmin.from('editorial_features').select('title, slug, issue_label, dek, cover_image, pages, published_at, updated_at').eq('slug', decodeURIComponent(ed[1])).eq('status', 'published').maybeSingle();
    if (!f) {
      /* Drafts are visible to signed-in admins in the app; to everyone else, not found */
      return ed[2] ? { head: headTags({ title: `Editorial. ${BRAND}`, description: DEFAULT_DESC, path, noindex: true }), body: '' } : null;
    }
    const title = `${plain(f.issue_label)}: ${plain(f.title)}`;
    const pages = Array.isArray(f.pages) ? f.pages : [];

    /* Every page's words, in reading order */
    const text = pages.map((pg) => {
      const x = pg.fields || {};
      const parts = [];
      const heading = x.title || x.heading || x.headline;
      if (heading) parts.push(`<h2>${esc(plain(heading))}</h2>`);
      if (x.kicker) parts.push(`<p><strong>${esc(plain(x.kicker))}</strong></p>`);
      for (const key of ['dek', 'intro', 'quote', 'body', 'caption', 'mantra', 'pull']) {
        if (x[key]) parts.push(...paragraphs(x[key]).map((p) => (key === 'quote' || key === 'pull' ? `<blockquote>${esc(p.replace(/^Q:\s*/, ''))}</blockquote>` : `<p>${esc(p.replace(/^Q:\s*/, 'Q: '))}</p>`)));
      }
      if (x.attribution) parts.push(`<p>${esc(plain(x.attribution))}</p>`);
      /* "A | B" lists: contents, profile facts, quickfire, the world board */
      for (const key of ['items', 'facts', 'quick', 'places', 'points']) {
        const rows = String(x[key] || '').split('\n').map((l) => l.split('|').map((v) => plain(v)).filter(Boolean)).filter((r) => r.length);
        if (rows.length) parts.push(`<ul>${rows.map((r) => `<li>${esc(r.join(': '))}</li>`).join('')}</ul>`);
      }
      const img = x.image || (Array.isArray(x.images) ? x.images[0] : null);
      if (img && pg.template !== 'products') parts.push(`<img src="${esc(img)}" alt="${esc(plain(heading || title))}" loading="lazy" />`);
      return parts.length ? `<section>${parts.join('')}</section>` : '';
    }).join('');

    return {
      head: headTags({
        title: `${title}. ${BRAND}`,
        description: clip(f.dek || `${title}, from the BlackTribe magazine.`),
        path,
        image: f.cover_image,
        type: 'article',
        noindex: !!ed[2],
        ld: [breadcrumbs([['Home', '/'], ['Editorial', '/editorial'], [title, `/editorial/${f.slug}`]]), {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: title,
          description: plain(f.dek),
          image: f.cover_image ? [f.cover_image] : undefined,
          datePublished: f.published_at,
          dateModified: f.updated_at,
          author: { '@type': 'Organization', name: BRAND, url: SITE },
          publisher: { '@type': 'Organization', name: BRAND, logo: { '@type': 'ImageObject', url: `${SITE}/logo512.png` } },
          mainEntityOfPage: `${SITE}/editorial/${f.slug}`,
        }],
      }),
      body: ed[2] ? '' : shell(`<article><h1>${esc(title)}</h1>${f.dek ? `<p>${esc(f.dek)}</p>` : ''}${text}</article>`),
    };
  }

  /* Static pages */
  if (STATIC[path]) {
    const [name, description] = STATIC[path];
    return {
      head: headTags({ title: `${name}. ${BRAND}`, description, path, ld: path === '/about' ? [ORGANIZATION] : [] }),
      body: shell(`<h1>${esc(name)}</h1><p>${esc(description)}</p>`),
    };
  }

  /* Private app pages: serve the app, keep them out of search */
  if (NOINDEX.some((re) => re.test(path))) {
    return { head: headTags({ title: DEFAULT_TITLE, description: DEFAULT_DESC, path, noindex: true }), body: '' };
  }

  return null;
}


/* ─── Middleware ─── */

export function seoPages(indexPath) {
  let template = null;

  return async function seoPagesHandler(req, res, next) {
    try {
      if (!template) template = fs.readFileSync(indexPath, 'utf8');

      const path = req.path.length > 1 ? req.path.replace(/\/+$/, '') : '/';
      const key = path;
      const hit = cache.get(key);
      let page = hit && Date.now() - hit.at < CACHE_MS ? hit.page : null;

      if (!page) {
        const resolved = await resolve(path).catch((err) => {
          console.error('[seo] resolve failed:', path, err?.message);
          return { fallback: true };
        });

        if (resolved?.redirect) {
          page = { redirect: resolved.redirect };
        } else if (!resolved) {
          page = {
            status: 404,
            html: fill(template, headTags({ title: `Not found. ${BRAND}`, description: DEFAULT_DESC, path, noindex: true }), shell('<h1>This page does not exist.</h1><p><a href="/shop">Back to the shop</a></p>')),
          };
        } else if (resolved.fallback) {
          /* Database hiccup: serve the plain app, never an error page */
          return res.sendFile(indexPath);
        } else {
          page = { status: 200, html: fill(template, resolved.head, resolved.body) };
        }

        if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value);
        cache.set(key, { at: Date.now(), page });
      }

      if (page.redirect) {
        const qs = req.url.includes('?') && !page.redirect.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
        return res.redirect(301, page.redirect + qs);
      }

      res.status(page.status).set('Content-Type', 'text/html; charset=utf-8').set('Cache-Control', 'no-cache').send(page.html);
    } catch (err) {
      console.error('[seo] failed, serving plain app:', err?.message);
      if (!res.headersSent) res.sendFile(indexPath);
      else next(err);
    }
  };
}

function fill(template, head, body) {
  let html = template;

  /* Head: between the markers; if a build step ever strips the comments,
     drop the default title/description/share tags and add ours before </head> */
  if (/<!--seo-head-->[\s\S]*?<!--\/seo-head-->/.test(html)) {
    html = html.replace(/<!--seo-head-->[\s\S]*?<!--\/seo-head-->/, () => `<!--seo-head-->\n  ${head}\n  <!--/seo-head-->`);
  } else {
    html = html
      .replace(/<title>[\s\S]*?<\/title>/, '')
      .replace(/<meta\s+(?:name="(?:description|robots|twitter:[^"]+)"|property="og:[^"]+")[^>]*>/g, '')
      .replace(/<link\s+rel="canonical"[^>]*>/, '')
      .replace('</head>', () => `  ${head}\n</head>`);
  }

  /* Body: inside #root */
  if (html.includes('<!--seo-body-->')) return html.replace('<!--seo-body-->', () => body || '');
  return html.replace(/<div id="root"><\/div>/, () => `<div id="root">${body || ''}</div>`);
}
