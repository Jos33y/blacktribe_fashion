import { Link } from 'react-router';
import { getProductsByCollection, getCollectionBySlug, getFeaturedProducts } from '../../utils/mockData';
import { formatPrice } from '../../utils/formatPrice';

export default function CollectionPreview() {
  const collection = getCollectionBySlug('shadow-collection');
  const allCollectionProducts = getProductsByCollection('shadow-collection');
  const featuredIds = new Set(getFeaturedProducts(6).map((p) => p.id));

  // Filter out products already shown in New Arrivals
  const products = allCollectionProducts
    .filter((p) => !featuredIds.has(p.id))
    .slice(0, 3);

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
