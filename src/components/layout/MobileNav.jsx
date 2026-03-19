import { useEffect, useRef } from 'react';
import { NavLink } from 'react-router';
import { CloseIcon } from '../icons';
import useAuth from '../../hooks/useAuth';
import useAuthStore from '../../store/authStore';
import '../../styles/layout/MobileNav.css';

export default function MobileNav({ isOpen, onClose, navLinks }) {
  const navRef = useRef(null);
  const closeRef = useRef(null);

  const { isAuthenticated, isAdmin, displayName } = useAuth();
  const signOut = useAuthStore((s) => s.signOut);

  const handleSignOut = async () => {
    onClose();
    await signOut();
  };

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }

    document.addEventListener('keydown', handleKeyDown);
    // Focus the close button when opening
    closeRef.current?.focus();
    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !navRef.current) return;

    const focusable = navRef.current.querySelectorAll(
      'a, button, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    function handleTab(e) {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`mobile-nav__backdrop ${isOpen ? 'mobile-nav__backdrop--visible' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Nav Panel */}
      <nav
        ref={navRef}
        className={`mobile-nav ${isOpen ? 'mobile-nav--open' : ''}`}
        aria-label="Mobile navigation"
        aria-hidden={!isOpen}
        role="dialog"
      >
        <div className="mobile-nav__header">
          <button
            ref={closeRef}
            className="mobile-nav__close"
            onClick={onClose}
            aria-label="Close menu"
          >
            <CloseIcon size={24} />
          </button>
        </div>

        <ul className="mobile-nav__links" role="list">
          {navLinks.map(({ to, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `mobile-nav__link ${isActive ? 'mobile-nav__link--active' : ''}`
                }
                onClick={onClose}
              >
                {label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="mobile-nav__footer">
          {isAuthenticated ? (
            <>
              {displayName && (
                <span className="mobile-nav__user-name">{displayName}</span>
              )}
              <NavLink to="/account" className="mobile-nav__link" onClick={onClose}>
                Your Tribe
              </NavLink>
              <NavLink to="/account?tab=orders" className="mobile-nav__link" onClick={onClose}>
                Orders
              </NavLink>
              {isAdmin && (
                <NavLink to="/admin" className="mobile-nav__link" onClick={onClose}>
                  Admin
                </NavLink>
              )}
              <button
                className="mobile-nav__link mobile-nav__signout"
                onClick={handleSignOut}
                type="button"
              >
                Sign Out
              </button>
            </>
          ) : (
            <NavLink to="/auth" className="mobile-nav__link" onClick={onClose}>
              Sign In
            </NavLink>
          )}
        </div>
      </nav>
    </>
  );
}
