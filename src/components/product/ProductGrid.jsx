import ProductCard from './ProductCard';
import Skeleton from '../ui/Skeleton';
import '../../styles/product/ProductGrid.css';

export default function ProductGrid({
  products = [],
  loading = false,
  density = 3,
  onQuickView,
  columns,
}) {
  // columns prop overrides density for backward compatibility
  const gridDensity = columns || density;

  if (loading) {
    return (
      <div className={`product-grid product-grid--${gridDensity}`}>
        {Array.from({ length: gridDensity * 2 }).map((_, i) => (
          <div key={i} className="product-grid__skeleton">
            <Skeleton type="image" style={{ aspectRatio: '3/4' }} />
            <Skeleton type="text" style={{ width: '70%', height: 14, marginTop: 12 }} />
            <Skeleton type="text" style={{ width: '40%', height: 12, marginTop: 6 }} />
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div className={`product-grid product-grid--${gridDensity}`}>
      {products.map((product, index) => (
        <div
          key={product.id}
          className="product-grid__item"
          style={{ '--stagger': index % gridDensity }}
        >
          <ProductCard product={product} onQuickView={onQuickView} />
        </div>
      ))}
    </div>
  );
}
