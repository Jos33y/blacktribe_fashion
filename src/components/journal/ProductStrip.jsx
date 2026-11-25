/*
 * BLACKTRIBE JOURNAL — SHOPPABLE PIECES
 *
 * Pulls live pieces from the shop so names, prices and photos are always
 * current. Give it product slugs, a collection slug, or both.
 * A slug that no longer exists is skipped. If nothing loads, nothing shows.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router';

function naira(kobo) {
  return `₦${Math.round((kobo || 0) / 100).toLocaleString('en-NG')}`;
}

export default function ProductStrip({ slugs = [], collection, limit = 4, title, link, compact = false }) {
  const [items, setItems] = useState([]);
  const key = `${slugs.join(',')}|${collection || ''}`;

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        let list = [];
        if (slugs.length) {
          const results = await Promise.all(slugs.map(async (slug) => {
            try {
              const res = await fetch(`/api/products/${encodeURIComponent(slug)}`);
              const json = await res.json();
              if (json.success && json.data) return json.data;
              /* A merged piece answers with its new slug */
              if (json.redirect?.slug) {
                const again = await fetch(`/api/products/${encodeURIComponent(json.redirect.slug)}`);
                const j2 = await again.json();
                return j2.success ? j2.data : null;
              }
            } catch { /* skip */ }
            return null;
          }));
          list = results.filter(Boolean);
        }
        if (collection && list.length < limit) {
          const res = await fetch(`/api/products?collection=${encodeURIComponent(collection)}&limit=${limit}`);
          const json = await res.json();
          if (json.success) {
            const seen = new Set(list.map((p) => p.slug));
            list = list.concat((json.data || []).filter((p) => !seen.has(p.slug)));
          }
        }
        if (alive) setItems(list.slice(0, limit));
      } catch {
        if (alive) setItems([]);
      }
    }
    load();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, limit]);

  if (!items.length) return null;

  return (
    <section className={`jr-shop${compact ? ' jr-shop--compact' : ''}`} aria-label={title || 'Shop the look'}>
      {title && <h3 className="jr-shop__title">{title}</h3>}
      <ul className="jr-shop__list">
        {items.map((p) => (
          <li key={p.slug}>
            <Link to={`/product/${p.slug}`} className="jr-shop__card">
              <span className="jr-shop__img">
                {p.images?.[0] && <img src={p.images[0]} alt={p.name} loading="lazy" decoding="async" />}
              </span>
              <span className="jr-shop__name">{p.name}</span>
              <span className="jr-shop__price">{naira(p.price)}</span>
            </Link>
          </li>
        ))}
      </ul>
      {link && <Link to={link.href} className="jr-shop__more">{link.label}</Link>}
    </section>
  );
}
