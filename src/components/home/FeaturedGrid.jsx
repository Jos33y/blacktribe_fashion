import { Link } from 'react-router';
import ProductGrid from '../product/ProductGrid';
import { getFeaturedProducts } from '../../utils/mockData';

export default function FeaturedGrid() {
  const products = getFeaturedProducts(6);

  return (
    <section className="featured" aria-labelledby="featured-heading">
      <div className="featured__inner container">
        <div className="featured__header">
          <div>
            <span className="featured__label">Featured</span>
            <h2 id="featured-heading" className="featured__title">New Arrivals</h2>
          </div>
          <Link to="/shop" className="featured__link">
            View all
          </Link>
        </div>
        <ProductGrid products={products} />
      </div>
    </section>
  );
}
