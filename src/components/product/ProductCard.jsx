import { Link } from 'react-router';
import Badge from '../ui/Badge';
import { formatPrice } from '../../utils/formatPrice';
import '../../styles/product/ProductCard.css';

export default function ProductCard({ product, onQuickView, index }) {
  if (!product) return null;

  const mainImage = product.images?.[0];
  const hoverImage = product.images?.[1] || null;

  return (
    <article className={`product-card ${hoverImage ? 'product-card--has-hover' : ''}`}>
      {/* Image Container */}
      <div className="product-card__canvas">
        <Link
          to={`/product/${product.slug}`}
          className="product-card__image-link"
          aria-label={product.name}
        >
          {mainImage && (
            <img
              src={mainImage}
              alt={product.name}
              className="product-card__image product-card__image--main"
              loading={index !== undefined && index < 2 ? 'eager' : 'lazy'}
            />
          )}
          {hoverImage && (
            <img
              src={hoverImage}
              alt=""
              className="product-card__image product-card__image--hover"
              loading={index !== undefined && index < 2 ? 'eager' : 'lazy'}
              aria-hidden="true"
            />
          )}
        </Link>

        {/* Badge */}
        {product.badge && (
          <div className="product-card__badge">
            <Badge type={product.badge} />
          </div>
        )}

        {/* Quick View trigger */}
        {onQuickView && (
          <button
            className="product-card__quick-view"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onQuickView(product);
            }}
            aria-label={`Quick view: ${product.name}`}
            type="button"
          >
            Quick View
          </button>
        )}
      </div>

      {/* Info */}
      <div className="product-card__info">
        <Link to={`/product/${product.slug}`} className="product-card__name-link">
          <h3 className="product-card__name">{product.name}</h3>
        </Link>
        <p className="product-card__price">{formatPrice(product.price)}</p>
      </div>
    </article>
  );
}
