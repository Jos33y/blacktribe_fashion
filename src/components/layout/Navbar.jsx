import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { SearchIcon, BagIcon, MenuIcon } from '../icons';
import useAuth from '../../hooks/useAuth';
import useAuthStore from '../../store/authStore';
import '../../styles/layout/Navbar.css';

const navLinks = [
  { to: '/shop', label: 'Shop' },
  { to: '/collections', label: 'Collections' },
  { to: '/lookbook', label: 'Lookbook' },
  { to: '/about', label: 'About' },
];

/* Inline UserIcon — stroke-based, 1.5px, 24px viewBox, currentColor */
function UserIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export default function Navbar({ onMenuToggle, onSearchOpen, onBagClick, bagCount = 0 }) {
  const { isAuthenticated, isAdmin, displayName, loading } = useAuth();
  const signOut = useAuthStore((s) => s.signOut);
  const location = useLocation();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  /* ─── Close dropdown on route change ─── */
  useEffect(() => {
    setDropdownOpen(false);
  }, [location.pathname]);

  /* ─── Close dropdown on click outside ─── */
  useEffect(() => {
    if (!dropdownOpen) return;

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') setDropdownOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [dropdownOpen]);

  /* ─── Sign out handler ─── */
  const handleSignOut = async () => {
    setDropdownOpen(false);
    await signOut();
  };

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

          {/* ─── Auth: User icon or Sign In ─── */}
          {!loading && (
            isAuthenticated ? (
              <div className="navbar__user" ref={dropdownRef}>
                <button
                  className="navbar__action navbar__user-btn"
                  aria-label="Account menu"
                  aria-expanded={dropdownOpen}
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  type="button"
                >
                  <UserIcon size={20} />
                </button>

                {dropdownOpen && (
                  <div className="navbar__dropdown" role="menu">
                    <div className="navbar__dropdown-header">
                      <span className="navbar__dropdown-name">
                        {displayName}
                      </span>
                    </div>

                    <Link
                      to="/account"
                      className="navbar__dropdown-item"
                      role="menuitem"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Your Tribe
                    </Link>

                    <Link
                      to="/account?tab=orders"
                      className="navbar__dropdown-item"
                      role="menuitem"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Orders
                    </Link>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        className="navbar__dropdown-item"
                        role="menuitem"
                        onClick={() => setDropdownOpen(false)}
                      >
                        Admin
                      </Link>
                    )}

                    <div className="navbar__dropdown-divider" />

                    <button
                      className="navbar__dropdown-item navbar__dropdown-item--signout"
                      role="menuitem"
                      onClick={handleSignOut}
                      type="button"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/auth"
                className="navbar__action navbar__signin"
                aria-label="Sign in"
              >
                <UserIcon size={20} />
              </Link>
            )
          )}

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
