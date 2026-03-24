/*
 * BLACKTRIBE FASHION — FEATURED GRID (HOMEPAGE)
 *
 * Fetches featured products from /api/products.
 * Tries featured first (is_featured=true), falls back to newest.
 * Shows skeleton while loading. Max 6 products.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import ProductCard from '../product/ProductCard';
import Skeleton from '../ui/Skeleton';

export default function FeaturedGrid() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeatured();
  }, []);

  async function fetchFeatured() {
    try {
      const res = await fetch('/api/products?sort=newest&limit=6');
      const json = await res.json();
      if (json.success && json.data?.length > 0) {
        /* Prioritize featured products, fill with newest */
        const featured = json.data.filter((p) => p.is_featured);
        const nonFeatured = json.data.filter((p) => !p.is_featured);
        const combined = [...featured, ...nonFeatured].slice(0, 6);
        setProducts(combined);
      }
    } catch (err) {
      console.error('[FeaturedGrid] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

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

  if (products.length === 0) return null;

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
