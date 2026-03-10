import { Link } from 'react-router';
import { ChevronRightIcon } from '../icons';
import '../../styles/ui/Breadcrumbs.css';

/**
 * Breadcrumbs navigation.
 * items: [{ label: 'Home', to: '/' }, { label: 'Shop', to: '/shop' }, { label: 'Product Name' }]
 * Last item has no `to` (current page).
 */
export default function Breadcrumbs({ items = [] }) {
  if (items.length === 0) return null;

  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol className="breadcrumbs__list">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={i} className="breadcrumbs__item">
              {isLast ? (
                <span className="breadcrumbs__current" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <>
                  <Link to={item.to} className="breadcrumbs__link">
                    {item.label}
                  </Link>
                  <ChevronRightIcon size={12} className="breadcrumbs__separator" aria-hidden="true" />
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
