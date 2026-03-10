import '../../styles/ui/Badge.css';

/**
 * Badge component.
 * Only: NEW, PRE-ORDER, LIMITED, SOLD OUT.
 * No "bestseller", "trending", "hot".
 */
export default function Badge({ type, className = '' }) {
  if (!type) return null;

  const labels = {
    'NEW': 'New',
    'PRE-ORDER': 'Pre-Order',
    'LIMITED': 'Limited',
    'SOLD OUT': 'Sold Out',
  };

  const label = labels[type] || type;

  return (
    <span className={`badge badge--${type.toLowerCase().replace(/\s+/g, '-')} ${className}`}>
      {label}
    </span>
  );
}
