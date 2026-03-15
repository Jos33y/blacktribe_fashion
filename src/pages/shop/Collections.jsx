import { useEffect } from 'react';
import { Link } from 'react-router';
import { collections, getProductsByCollection } from '../../utils/mockData';
import { formatPrice } from '../../utils/formatPrice';
import '../../styles/pages/Collections.css';

// Get hero image + preview images for each collection
function getCollectionImages(slug) {
  const products = getProductsByCollection(slug);
  const hero = products[0]?.images?.[0] || null;
  const previews = products.slice(1, 5).map((p) => p.images?.[0]).filter(Boolean);
  return { hero, previews, products };
}

export default function Collections() {
  useEffect(() => {
    document.title = 'Collections. BlackTribe Fashion.';
  }, []);

  useEffect(() => {
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
  }, []);

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
        const { hero, previews, products } = getCollectionImages(collection.slug);
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
                    <span className="col-meta-value">{products.length}</span>
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
