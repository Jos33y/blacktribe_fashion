/*
 * BLACKTRIBE FASHION — COLLECTION PREVIEW (HOMEPAGE)
 *
 * Fetches the first active collection from /api/collections,
 * then fetches its products (excluding any already shown in FeaturedGrid).
 * Shows up to 3 collection products.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { formatPrice } from '../../utils/formatPrice';
import Skeleton from '../ui/Skeleton';

export default function CollectionPreview() {
  const [collection, setCollection] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCollection();
  }, []);

  async function fetchCollection() {
    try {
      /* Get all collections, pick the first one */
      const colRes = await fetch('/api/collections');
      const colJson = await colRes.json();

      if (!colJson.success || !colJson.data?.length) {
        setLoading(false);
        return;
      }

      const col = colJson.data[0];
      setCollection(col);

      /* Fetch products for this collection */
      const prodRes = await fetch(`/api/products?collection=${col.slug}&limit=6`);
      const prodJson = await prodRes.json();

      if (prodJson.success && prodJson.data?.length > 0) {
        /* Take up to 3 products for the preview */
        setProducts(prodJson.data.slice(0, 3));
      }
    } catch (err) {
      console.error('[CollectionPreview] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <section className="home-collection">
        <div className="home-collection__inner container">
          <div className="home-collection__header">
            <Skeleton type="text" style={{ width: 120, height: 12, marginBottom: 10 }} />
            <Skeleton type="text" style={{ width: 240, height: 28, marginBottom: 10 }} />
            <Skeleton type="text" style={{ width: 300, height: 14 }} />
          </div>
          <div className="home-collection__grid">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="home-collection__item">
                <Skeleton type="image" style={{ width: '100%', aspectRatio: '3/4' }} />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!collection || products.length === 0) return null;

  return (
    <section className="home-collection">
      <div className="home-collection__inner container">
        <div className="home-collection__header">
          <span className="home-collection__eyebrow">{collection.season} Collection</span>
          <h2 className="home-collection__title">{collection.name}</h2>
          <p className="home-collection__description">{collection.description}</p>
        </div>

        <div className="home-collection__grid">
          {products.map((product, i) => (
            <Link
              key={product.id}
              to={`/product/${product.slug}`}
              className={`home-collection__item home-collection__item--${i + 1}`}
            >
              <div className="home-collection__image-wrap">
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="home-collection__image"
                  loading="lazy"
                />
              </div>
              <div className="home-collection__meta">
                <span className="home-collection__product-name">{product.name}</span>
                <span className="home-collection__product-price">{formatPrice(product.price)}</span>
              </div>
            </Link>
          ))}
        </div>

        <div className="home-collection__cta-wrap">
          <Link to={`/collections/${collection.slug}`} className="home-collection__cta">
            View full collection
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
