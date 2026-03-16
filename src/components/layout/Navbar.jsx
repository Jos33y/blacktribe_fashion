import { Link, NavLink } from 'react-router';
import { SearchIcon, BagIcon, MenuIcon } from '../icons';
import '../../styles/layout/Navbar.css';

const navLinks = [
  { to: '/shop', label: 'Shop' },
  { to: '/collections', label: 'Collections' },
  { to: '/lookbook', label: 'Lookbook' },
  { to: '/about', label: 'About' },
];

export default function Navbar({ onMenuToggle, onSearchOpen, onBagClick, bagCount = 0 }) {
  return (
    <header className="navbar" role="banner">
      <nav className="navbar__inner container" aria-label="Main navigation">
        <Link to="/" className="navbar__logo" aria-label="BlackTribe Fashion home">
          BLACKTRIBE
        </Link>

        <ul className="navbar__links" role="list">
          {navLinks.map(({ to, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `navbar__link ${isActive ? 'navbar__link--active' : ''}`
                }
              >
                {label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="navbar__actions">
          <button
            className="navbar__action"
            aria-label="Search"
            onClick={onSearchOpen}
            type="button"
          >
            <SearchIcon size={20} />
          </button>

          <button
            className="navbar__action navbar__bag"
            aria-label={`Shopping bag, ${bagCount} items`}
            onClick={onBagClick}
            type="button"
          >
            <BagIcon size={20} />
            <span className="navbar__bag-count" aria-hidden="true">
              {bagCount}
            </span>
          </button>

          <button
            className="navbar__action navbar__menu-btn"
            aria-label="Open menu"
            onClick={onMenuToggle}
            type="button"
          >
            <MenuIcon size={20} />
          </button>
        </div>
      </nav>
    </header>
  );
}
