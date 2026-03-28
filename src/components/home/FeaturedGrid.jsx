/*
 * BLACKTRIBE FASHION — FEATURED GRID (HOMEPAGE)
 *
 * Accepts products + loading from parent (batch fetch).
 * Falls back to own fetch if no props provided (standalone usage).
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import ProductCard from '../product/ProductCard';
import Skeleton from '../ui/Skeleton';

export default function FeaturedGrid({ products: propProducts, loading: propLoading }) {
  const [ownProducts, setOwnProducts] = useState([]);
  const [ownLoading, setOwnLoading] = useState(!propProducts);

  /* Only fetch if no products passed from parent */
  useEffect(() => {
    if (propProducts !== undefined) return;

    async function fetchFeatured() {
      try {
        const res = await fetch('/api/products?sort=newest&limit=6');
        const json = await res.json();
        if (json.success && json.data?.length > 0) {
          const featured = json.data.filter((p) => p.is_featured);
          const nonFeatured = json.data.filter((p) => !p.is_featured);
          setOwnProducts([...featured, ...nonFeatured].slice(0, 6));
        }
      } catch (err) {
        console.error('[FeaturedGrid] fetch error:', err);
      } finally {
        setOwnLoading(false);
      }
    }

    fetchFeatured();
  }, [propProducts]);

  const products = propProducts || ownProducts;
  const loading = propProducts !== undefined ? propLoading : ownLoading;

  if (loading) {
    return (
      <section className="home-featured">
        <div className="home-featured__inner container">
          <div className="home-featured__header">
            <div>
              <span className="home-featured__eyebrow">Featured</span>
              <h2 className="home-featured__title">New Arrivals</h2>
            </div>
          </div>
          <div className="home-featured__grid">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="home-featured__card">
                <Skeleton type="image" style={{ width: '100%', aspectRatio: '3/4', marginBottom: 12 }} />
                <Skeleton type="text" style={{ width: '70%', height: 14, marginBottom: 6 }} />
                <Skeleton type="text" style={{ width: '40%', height: 12 }} />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!products || products.length === 0) return null;

  return (
    <section className="home-featured">
      <div className="home-featured__inner container">
        <div className="home-featured__header">
          <div>
            <span className="home-featured__eyebrow">Featured</span>
            <h2 className="home-featured__title">New Arrivals</h2>
          </div>
          <Link to="/shop" className="home-featured__link">
            View all
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="home-featured__grid">
          {products.map((product) => (
            <div key={product.id} className="home-featured__card">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
