import ProductCard from './ProductCard';
import Skeleton from '../ui/Skeleton';
import '../../styles/product/ProductGrid.css';

/**
 * ProductGrid component.
 * 2-col mobile, 3-col desktop. Staggered reveal animation.
 */
export default function ProductGrid({ products = [], loading = false, columns = 3 }) {
  if (loading) {
    return (
      <div className={`product-grid product-grid--${columns}col`}>
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} type="card" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className={`product-grid product-grid--${columns}col reveal-stagger`}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} className="reveal visible" />
      ))}
    </div>
  );
}
