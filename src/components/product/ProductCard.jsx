import { Link } from 'react-router';
import Badge from '../ui/Badge';
import { formatPrice } from '../../utils/formatPrice';
import '../../styles/product/ProductCard.css';

/**
 * ProductCard component.
 * White canvas image container. Hover shadow.
 * Badge (NEW, PRE-ORDER, LIMITED).
 * Product name (Outfit). Price (DM Mono).
 */
export default function ProductCard({ product, className = '' }) {
  const { slug, name, price, images, badge, short_description } = product;
  const imageUrl = images?.[0] || null;

  return (
    <article className={`product-card ${className}`}>
      <Link
        to={`/product/${slug}`}
        className="product-card__link"
        aria-label={`${name}, ${formatPrice(price)}`}
      >
        {/* Image Container */}
        <div className="product-card__canvas">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={short_description || name}
              className="product-card__image"
              loading="lazy"
            />
          ) : (
            <div className="product-card__placeholder">
              <span className="product-card__placeholder-text">No Image</span>
            </div>
          )}
          {badge && (
            <div className="product-card__badge">
              <Badge type={badge} />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="product-card__info">
          <h3 className="product-card__name">{name}</h3>
          <p className="product-card__price price">{formatPrice(price)}</p>
        </div>
      </Link>
    </article>
  );
}
