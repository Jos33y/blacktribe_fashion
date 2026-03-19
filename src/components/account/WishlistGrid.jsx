import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { api } from '../../utils/api';
import Skeleton from '../../components/ui/Skeleton';
import { formatPrice } from '../../utils/formatPrice';

/**
 * WishlistGrid — "Wishlist" tab.
 * Saved pieces grid. Wired to server in Batch 5.
 */
export default function WishlistGrid() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const result = await api('/api/wishlist');
        if (result.success && result.data) {
          setItems(result.data);
        }
      } catch (err) {
        // Expected to fail until Batch 5 wires the server route
        console.error('[wishlist] Failed to fetch:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, []);

  const handleRemove = async (productId) => {
    try {
      await api(`/api/wishlist/${productId}`, { method: 'DELETE' });
      setItems((prev) => prev.filter((item) => item.product_id !== productId));
    } catch (err) {
      console.error('[wishlist] Failed to remove:', err);
    }
  };

  if (loading) {
    return (
      <div className="wishlist-grid">
        <div className="wishlist-grid__items">
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
          Nothing saved yet. Pieces you love will live here.
        </p>
        <Link to="/shop" className="account__empty-cta">Browse New Arrivals</Link>
      </div>
    );
  }

  return (
    <div className="wishlist-grid">
      <div className="wishlist-grid__items">
        {items.map((item) => (
          <div key={item.product_id} className="wishlist-grid__card">
            <Link
              to={item.slug ? `/product/${item.slug}` : '/shop'}
              className="wishlist-grid__image"
            >
              <img src={item.image_url || item.images?.[0]} alt={item.name} loading="lazy" />
            </Link>
            <div className="wishlist-grid__info">
              <span className="wishlist-grid__name">{item.name}</span>
              <span className="wishlist-grid__price">{formatPrice(item.price)}</span>
            </div>
            <button
              type="button"
              className="wishlist-grid__remove"
              onClick={() => handleRemove(item.product_id)}
              aria-label={`Remove ${item.name} from wishlist`}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
