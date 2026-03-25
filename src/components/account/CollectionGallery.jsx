import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { api } from '../../utils/api';
import Skeleton from '../../components/ui/Skeleton';

/**
 * CollectionGallery — "Your Collection"
 * Purchased product images displayed as a personal lookbook.
 * Each piece links to the product detail page.
 */

/**
 * Generate a URL-safe slug from a product name.
 * Matches the convention used in the products table.
 */
function slugify(name) {
  return name
    .toLowerCase()
    .replace(/['']/g, '')              // remove apostrophes
    .replace(/[^a-z0-9]+/g, '-')       // non-alphanumeric → hyphens
    .replace(/(^-|-$)/g, '');           // trim leading/trailing hyphens
}

export default function CollectionGallery() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCollection = async () => {
      try {
        const result = await api('/api/orders?status=confirmed,processing,shipped,delivered');
        if (result.success && result.data) {
          const seen = new Set();
          const pieces = [];
          for (const order of result.data) {
            for (const item of (order.items || [])) {
              const key = item.product_id || item.name;
              if (!seen.has(key)) {
                seen.add(key);
                pieces.push({
                  id: key,
                  name: item.name,
                  image: item.image_url,
                  slug: item.slug || slugify(item.name),
                });
              }
            }
          }
          setItems(pieces);
        }
      } catch (err) {
        console.error('[collection] Failed to fetch:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCollection();
  }, []);

  if (loading) {
    return (
      <div className="collection-gallery">
        <div className="collection-gallery__grid">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} type="text" style={{ aspectRatio: '3/4', width: '100%' }} />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="account__empty">
        <div className="account__empty-line" />
        <p className="account__empty-quote">
          Your collection is empty. Every piece you wear tells a story. Start writing yours.
        </p>
        <Link to="/shop" className="account__empty-cta">Start Shopping</Link>
      </div>
    );
  }

  return (
    <div className="collection-gallery">
      <p className="collection-gallery__count">
        {items.length} piece{items.length !== 1 ? 's' : ''} in your collection
      </p>
      <div className="collection-gallery__grid">
        {items.map((item) => (
          <Link
            key={item.id}
            to={`/product/${item.slug}`}
            className="collection-gallery__item"
          >
            <div className="collection-gallery__image">
              <img src={item.image} alt={item.name} loading="lazy" />
            </div>
            <span className="collection-gallery__name">{item.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
