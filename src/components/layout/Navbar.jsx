import { useState } from 'react';
import { Link, NavLink } from 'react-router';
import { SearchIcon, BagIcon, MenuIcon } from '../icons';
import MobileNav from './MobileNav';
import '../../styles/layout/Navbar.css';

const navLinks = [
  { to: '/shop', label: 'Shop' },
  { to: '/collections', label: 'Collections' },
  { to: '/lookbook', label: 'Lookbook' },
  { to: '/about', label: 'About' },
];

export default function Navbar() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  // TODO: Wire to cartStore in Phase 3
  const bagCount = 0;

  return (
    <>
      <header className="navbar" role="banner">
        <nav className="navbar__inner container" aria-label="Main navigation">
          {/* Logo */}
          <Link to="/" className="navbar__logo" aria-label="BlackTribe Fashion home">
            BLACKTRIBE
          </Link>

          {/* Desktop Nav Links */}
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

          {/* Right Actions */}
          <div className="navbar__actions">
            <button
              className="navbar__action"
              aria-label="Search"
              // TODO: Wire to search overlay in Phase 2
            >
              <SearchIcon size={20} />
            </button>

            <button
              className="navbar__action navbar__bag"
              aria-label={`Shopping bag, ${bagCount} items`}
              // TODO: Wire to cart drawer in Phase 3
            >
              <BagIcon size={20} />
              <span className="navbar__bag-count" aria-hidden="true">
                {bagCount}
              </span>
            </button>

            {/* Mobile menu button */}
            <button
              className="navbar__action navbar__menu-btn"
              aria-label="Open menu"
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen(true)}
            >
              <MenuIcon size={20} />
            </button>
          </div>
        </nav>
      </header>

      <MobileNav
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        navLinks={navLinks}
      />
    </>
  );
}
