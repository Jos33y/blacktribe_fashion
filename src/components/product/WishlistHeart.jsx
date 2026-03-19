import { useNavigate } from 'react-router';
import useWishlist from '../../hooks/useWishlist';
import { useToast } from '../ui/Toast';

/**
 * WishlistHeart — Toggle wishlist for a product.
 * Shows outline heart when not saved, filled when saved.
 * If not authenticated, navigates to /auth.
 *
 * Props:
 *   productId — the product ID to wishlist
 *   className — optional additional class
 */
export default function WishlistHeart({ productId, className = '' }) {
  const { isWishlisted, toggle, loading, isAuthenticated } = useWishlist(productId);
  const navigate = useNavigate();
  const { addToast } = useToast();

  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    const success = await toggle();
    if (success) {
      addToast(
        isWishlisted ? 'Removed from wishlist.' : 'Saved to wishlist.',
        'success'
      );
    }
  };

  return (
    <button
      type="button"
      className={`wishlist-heart ${isWishlisted ? 'wishlist-heart--active' : ''} ${className}`}
      onClick={handleClick}
      disabled={loading}
      aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
      aria-pressed={isWishlisted}
    >
      {isWishlisted ? (
        /* Filled heart */
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
        </svg>
      ) : (
        /* Outline heart */
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
        </svg>
      )}
    </button>
  );
}
