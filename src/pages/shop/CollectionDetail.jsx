import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router';
import ProductGrid from '../../components/product/ProductGrid';
import Button from '../../components/ui/Button';
import { collections, getProductsByCollection } from '../../utils/mockData';
import { formatPrice } from '../../utils/formatPrice';
import '../../styles/pages/CollectionDetail.css';

export default function CollectionDetail() {
  const { slug } = useParams();
  const [loading, setLoading] = useState(true);

  const collection = useMemo(
    () => collections.find((c) => c.slug === slug),
    [slug]
  );

  const products = useMemo(
    () => (collection ? getProductsByCollection(collection.slug) : []),
    [collection]
  );

  const heroImage = products[0]?.images?.[0] || null;

  const priceRange = useMemo(() => {
    if (products.length === 0) return '';
    const min = Math.min(...products.map((p) => p.price));
    const max = Math.max(...products.map((p) => p.price));
    return min === max ? formatPrice(min) : `${formatPrice(min)} — ${formatPrice(max)}`;
  }, [products]);

  const categories = useMemo(() => {
    const cats = [...new Set(products.map((p) => p.category).filter(Boolean))];
    return cats;
  }, [products]);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, [slug]);

  useEffect(() => {
    if (collection) {
      document.title = `${collection.name}. BlackTribe Fashion.`;
    }
  }, [collection]);

  useEffect(() => {
    const elements = document.querySelectorAll('.cd-reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('cd-reveal--visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [loading]);

  if (!loading && !collection) {
    return (
      <div className="cd-empty">
        <h1 className="cd-empty-title">Collection not found</h1>
        <Button variant="secondary" to="/collections">View All Collections</Button>
      </div>
    );
  }

  return (
    <article className="collection-detail">

      {/* ═══ HERO ═══ */}
      <section className="cd-hero">
        <div className="cd-hero-inner">
          <div className="cd-hero-content">
            <Link to="/collections" className="cd-hero-back">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Collections
            </Link>
            <h1 className="cd-hero-name">{collection?.name || ''}</h1>
            {collection?.description && (
              <p className="cd-hero-description">{collection.description}</p>
            )}
          </div>

          {/* Hero Image */}
          {heroImage && (
            <div className="cd-hero-image">
              <img src={heroImage} alt={collection?.name} />
            </div>
          )}
        </div>
      </section>

      {/* ═══ META BAR ═══ */}
      <section className="cd-meta cd-reveal">
        <div className="cd-meta-inner">
          <div className="cd-meta-item">
            <span className="cd-meta-label">Pieces</span>
            <span className="cd-meta-value">{products.length}</span>
          </div>
          {collection?.season && (
            <div className="cd-meta-item">
              <span className="cd-meta-label">Season</span>
              <span className="cd-meta-value">{collection.season}</span>
            </div>
          )}
          {priceRange && (
            <div className="cd-meta-item">
              <span className="cd-meta-label">Price Range</span>
              <span className="cd-meta-value">{priceRange}</span>
            </div>
          )}
          {categories.length > 0 && (
            <div className="cd-meta-item">
              <span className="cd-meta-label">Categories</span>
              <span className="cd-meta-value">
                {categories.map((c) => c.charAt(0).toUpperCase() + c.slice(1)).join(', ')}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* ═══ PRODUCT GRID ═══ */}
      <section className="cd-products cd-reveal">
        <div className="cd-products-inner">
          <ProductGrid products={products} loading={loading} />
        </div>
      </section>

      {/* ═══ CLOSING ═══ */}
      <section className="cd-closing cd-reveal">
        <div className="cd-closing-inner">
          <div className="cd-closing-line" />
          <Link to="/collections" className="cd-closing-link">
            View all collections
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

    </article>
  );
}
