/*
 * BLACKTRIBE JOURNAL — SERVER HTML
 *
 * Turns a Journal article into plain, semantic HTML and JSON-LD so Google,
 * AI assistants and link previews read the whole piece without running
 * any JavaScript. Same words as the React page, from the same file.
 */

import { allArticles, getArticle, plainText } from '../content/journal/index.js';

function inline(text, esc) {
  /* Escape first, then turn the three marks into tags */
  return esc(text)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

function blockHtml(b, esc) {
  const t = (s) => inline(s, esc);
  switch (b.type) {
    case 'lede':
    case 'p': return `<p>${t(b.text)}</p>`;
    case 'h2': return `<h2 id="${esc(b.id)}">${t(b.text)}</h2>`;
    case 'list': return `<ul>${b.items.map((i) => `<li>${t(i)}</li>`).join('')}</ul>`;
    case 'rules': return `<ol>${b.items.map(([h, body]) => `<li><strong>${t(h)}</strong> ${t(body)}</li>`).join('')}</ol>`;
    case 'look': return `<section><h3>${esc(b.n)}. ${t(b.name)}</h3>${b.for ? `<p>For: ${t(b.for)}</p>` : ''}${b.image ? `<img src="${esc(b.image.src)}" alt="${esc(b.image.alt)}" loading="lazy" />` : ''}${b.wear?.length ? `<p>Wear:</p><ul>${b.wear.map((w) => `<li>${t(w)}</li>`).join('')}</ul>` : ''}${b.avoid?.length ? `<p>Skip:</p><ul>${b.avoid.map((w) => `<li>${t(w)}</li>`).join('')}</ul>` : ''}${b.tip ? `<p>Tip: ${t(b.tip)}</p>` : ''}${(b.products || []).map((s) => `<a href="/product/${esc(s)}">Shop this piece</a> `).join('')}${b.collection ? `<a href="/collections/${esc(b.collection)}">Shop the collection</a>` : ''}</section>`;
    case 'brand': return `<section><h3>${esc(b.n)}. ${esc(b.name)}</h3><ul>${b.founded ? `<li>Founded: ${esc(b.founded)}</li>` : ''}${b.founders ? `<li>${esc(b.peopleLabel || 'Founded by')}: ${esc(b.founders)}</li>` : ''}${b.known ? `<li>Known for: ${esc(b.known)}</li>` : ''}</ul><p>${t(b.text)}</p></section>`;
    case 'quote': return `<blockquote>${t(b.text)}</blockquote>`;
    case 'image': return `<figure><img src="${esc(b.src)}" alt="${esc(b.alt)}" loading="lazy" />${b.caption ? `<figcaption>${t(b.caption)}</figcaption>` : ''}</figure>`;
    case 'facts': return `<dl>${b.items.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${t(v)}</dd>`).join('')}</dl>`;
    case 'table': return `<table><thead><tr>${b.head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${b.rows.map((r) => `<tr>${r.map((c) => `<td>${t(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    case 'timeline': return `<ol>${b.items.map(([w, x]) => `<li><strong>${esc(w)}</strong>: ${t(x)}</li>`).join('')}</ol>`;
    case 'products': return `<p><a href="${esc(b.link?.href || (b.collection ? `/collections/${b.collection}` : '/shop'))}">${esc(b.link?.label || b.title || 'Shop the pieces')}</a></p>`;
    case 'callout': return `<aside><h2>${t(b.title)}</h2><p>${t(b.text)}</p>${b.cta ? `<a href="${esc(b.cta.href)}">${esc(b.cta.label)}</a> ` : ''}${b.secondary ? `<a href="${esc(b.secondary.href)}">${esc(b.secondary.label)}</a>` : ''}</aside>`;
    default: return '';
  }
}

/*
 * deps: { SITE, BRAND, esc, headTags, breadcrumbs, shell }
 * Returns { head, body } or null (unknown or unpublished without preview).
 */
export function journalPage(path, { preview = false, deps }) {
  const { SITE, BRAND, esc, headTags, breadcrumbs, shell } = deps;
  const abs = (src) => (src && src.startsWith('/') ? `${SITE}${src}` : src);

  if (path === '/journal') {
    const list = allArticles({ includeDrafts: preview });
    return {
      head: headTags({
        title: `Journal. ${BRAND}`,
        description: 'Style guides, culture and the Lagos scene. The BlackTribe Journal, written in Lagos.',
        path,
        image: abs(list[0]?.hero?.src),
        noindex: preview,
        ld: [breadcrumbs([['Home', '/'], ['Journal', path]]), {
          '@context': 'https://schema.org',
          '@type': 'Blog',
          name: 'BlackTribe Journal',
          url: `${SITE}/journal`,
          publisher: { '@type': 'Organization', name: BRAND, url: SITE },
          blogPost: list.map((a) => ({ '@type': 'BlogPosting', headline: a.title, url: `${SITE}/journal/${a.slug}`, datePublished: a.published })),
        }],
      }),
      body: shell(`<h1>The Journal</h1><p>Style, culture and the city. From Lagos.</p><ul>${list.map((a) => `<li><h2><a href="/journal/${esc(a.slug)}">${esc(a.title)}</a></h2><p>${esc(a.dek || a.description)}</p></li>`).join('')}</ul>`),
    };
  }

  const m = path.match(/^\/journal\/([^/]+)$/);
  if (!m) return null;
  const a = getArticle(decodeURIComponent(m[1]), { includeDrafts: preview });
  if (!a) return null;

  const url = `${SITE}/journal/${a.slug}`;
  const image = abs(a.hero?.src);
  const words = [a.dek, ...(a.blocks || []).map((b) => [b.text, b.name, ...(b.wear || []), ...(b.items || []).flat()].join(' '))].map(plainText).join(' ');

  const ld = [
    breadcrumbs([['Home', '/'], ['Journal', '/journal'], [a.title, `/journal/${a.slug}`]]),
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: a.seoTitle || a.title,
      description: a.description,
      abstract: (a.summary || []).map(plainText).join(' '),
      image: image ? [image] : undefined,
      datePublished: a.published,
      dateModified: a.updated || a.published,
      wordCount: words.split(/\s+/).filter(Boolean).length,
      articleSection: a.kicker,
      inLanguage: 'en-NG',
      author: { '@type': 'Organization', name: BRAND, url: SITE },
      publisher: { '@type': 'Organization', name: BRAND, logo: { '@type': 'ImageObject', url: `${SITE}/logo512.png` } },
      mainEntityOfPage: url,
      citation: (a.sources || []).map((s) => s.url),
    },
  ];
  if (a.faq?.length) {
    ld.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: a.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: plainText(f.a) } })),
    });
  }

  const html = [
    `<article>`,
    `<p>${esc(a.kicker)}</p>`,
    `<h1>${esc(a.title)}</h1>`,
    a.dek ? `<p>${esc(a.dek)}</p>` : '',
    `<p>By ${esc(a.author)}. Updated <time datetime="${esc(a.updated || a.published)}">${esc(a.updated || a.published)}</time>.</p>`,
    a.hero ? `<img src="${esc(image)}" alt="${esc(a.hero.alt)}" />` : '',
    a.summary?.length ? `<section><h2>The short version</h2><ul>${a.summary.map((s) => `<li>${inline(s, esc)}</li>`).join('')}</ul></section>` : '',
    ...(a.blocks || []).map((b) => blockHtml(b, esc)),
    a.faq?.length ? `<section><h2>Questions people ask</h2>${a.faq.map((f) => `<h3>${esc(f.q)}</h3><p>${inline(f.a, esc)}</p>`).join('')}</section>` : '',
    a.sources?.length ? `<section><h2>Sources</h2><ol>${a.sources.map((s) => `<li><a href="${esc(s.url)}">${esc(s.title)}</a></li>`).join('')}</ol></section>` : '',
    `</article>`,
  ].join('');

  return {
    head: headTags({
      title: a.seoTitle || `${a.title}. ${BRAND}`,
      description: a.description,
      path,
      image,
      type: 'article',
      noindex: preview || a.status !== 'published',
      ld,
    }),
    body: shell(html),
  };
}

/* Published articles for the sitemap */
export function journalSitemapEntries() {
  return allArticles().map((a) => ({ path: `/journal/${a.slug}`, lastmod: a.updated || a.published }));
}
