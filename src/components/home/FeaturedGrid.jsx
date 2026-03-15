import { Link } from 'react-router';
import ProductCard from '../product/ProductCard';
import { getFeaturedProducts } from '../../utils/mockData';

export default function FeaturedGrid() {
  const products = getFeaturedProducts(6);
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
