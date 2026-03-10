import '../../styles/ui/Skeleton.css';

/**
 * Skeleton loading placeholder.
 * Types: 'text', 'image', 'card', 'circle'
 */
export default function Skeleton({ type = 'text', width, height, count = 1, className = '' }) {
  const style = {};
  if (width) style.width = width;
  if (height) style.height = height;

  if (type === 'card') {
    return (
      <div className={`skeleton-card ${className}`}>
        <div className="skeleton skeleton-card__image" />
        <div className="skeleton skeleton-card__title" />
        <div className="skeleton skeleton-card__price" />
      </div>
    );
  }

  if (count > 1) {
    return (
      <div className={`skeleton-group ${className}`}>
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className={`skeleton skeleton--${type}`} style={style} />
        ))}
      </div>
    );
  }

  return <div className={`skeleton skeleton--${type} ${className}`} style={style} />;
}
