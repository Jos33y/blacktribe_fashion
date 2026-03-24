/*
 * BLACKTRIBE FASHION — COLLECTIONS PAGE (Phase 5)
 *
 * Wired to real API:
 *   GET /api/collections — all active collections with cover images + product counts
 *   GET /api/products?collection={slug} — products per collection for previews
 *
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import Skeleton from '../../components/ui/Skeleton';
import { formatPrice } from '../../utils/formatPrice';
import '../../styles/pages/Collections.css';

export default function Collections() {
  const [collections, setCollections] = useState([]);
  const [collectionProducts, setCollectionProducts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Collections. BlackTribe Fashion.';
    fetchCollections();
  }, []);

  async function fetchCollections() {
    try {
      const res = await fetch('/api/collections');
      const json = await res.json();
      if (json.success && json.data) {
        setCollections(json.data);
        /* Fetch products for each collection (for preview images + price range) */
        const productMap = {};
        await Promise.all(
          json.data.map(async (col) => {
            try {
              const prodRes = await fetch(`/api/products?collection=${col.slug}&limit=5`);
              const prodJson = await prodRes.json();
              if (prodJson.success) {
                productMap[col.slug] = prodJson.data || [];
              }
            } catch { /* silent */ }
          })
        );
        setCollectionProducts(productMap);
      }
    } catch (err) {
      console.error('[Collections] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  /* Scroll reveals */
  useEffect(() => {
    if (loading) return;
    const elements = document.querySelectorAll('.col-reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('col-reveal--visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -60px 0px' }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [loading, collections]);

  if (loading) {
    return (
      <article className="collections">
        <section className="page-hero col-hero">
          <div className="page-hero__inner">
            <span className="page-eyebrow">Curated</span>
            <h1 className="page-headline col-headline">Collections</h1>
          </div>
        </section>
        <div style={{ padding: '40px 20px', maxWidth: 1200, margin: '0 auto' }}>
          {Array.from({ length: 2 }, (_, i) => (
            <div key={i} style={{ marginBottom: 60 }}>
              <Skeleton type="image" style={{ width: '100%', aspectRatio: '16/9', marginBottom: 20 }} />
              <Skeleton type="text" style={{ width: '40%', height: 28, marginBottom: 10 }} />
              <Skeleton type="text" style={{ width: '60%', height: 14 }} />
            </div>
          ))}
        </div>
      </article>
    );
  }

  return (
    <article className="collections">

      {/* ═══ HERO ═══ */}
      <section className="page-hero col-hero">
        <div className="page-hero__inner">
          <span className="page-eyebrow">Curated</span>
          <h1 className="page-headline col-headline">Collections</h1>
          <p className="page-intro page-intro--serif">
            Each collection is a story. Limited pieces. Intentional design.
          </p>
        </div>
      </section>

      {/* ═══ COLLECTION SECTIONS ═══ */}
      {collections.map((collection, index) => {
        const products = collectionProducts[collection.slug] || [];
        const hero = collection.cover_image || products[0]?.images?.[0] || null;
        const previews = products.slice(1, 5).map((p) => p.images?.[0]).filter(Boolean);
        const priceRange = products.length > 0
          ? `${formatPrice(Math.min(...products.map(p => p.price)))} — ${formatPrice(Math.max(...products.map(p => p.price)))}`
          : '';

        return (
          <section
            key={collection.slug}
            className={`col-section col-reveal ${index % 2 === 1 ? 'col-section--reversed' : ''}`}
          >
            <div className="col-section-inner">
              {/* Image side */}
              <Link to={`/collections/${collection.slug}`} className="col-section-media">
                <div className="col-section-hero-image">
                  {hero && <img src={hero} alt={collection.name} loading="lazy" />}
                </div>
                <div className="col-section-previews">
                  {previews.map((img, i) => (
                    <div key={i} className="col-section-preview">
                      <img src={img} alt="" loading="lazy" />
                    </div>
                  ))}
                </div>
              </Link>

              {/* Content side */}
              <div className="col-section-content">
                <span className="col-section-number">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h2 className="col-section-name">{collection.name}</h2>
                {collection.description && (
                  <p className="col-section-description">{collection.description}</p>
                )}

                <div className="col-section-meta">
                  <div className="col-section-meta-item">
                    <span className="col-meta-label">Pieces</span>
                    <span className="col-meta-value">{collection.product_count || products.length}</span>
                  </div>
                  {collection.season && (
                    <div className="col-section-meta-item">
                      <span className="col-meta-label">Season</span>
                      <span className="col-meta-value">{collection.season}</span>
                    </div>
                  )}
                  {priceRange && (
                    <div className="col-section-meta-item">
                      <span className="col-meta-label">Range</span>
                      <span className="col-meta-value">{priceRange}</span>
                    </div>
                  )}
                </div>

                <Link to={`/collections/${collection.slug}`} className="col-section-cta">
                  View Collection
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </section>
        );
      })}

    </article>
  );
}
