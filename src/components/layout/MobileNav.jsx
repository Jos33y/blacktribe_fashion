import { useEffect } from 'react';
import { NavLink } from 'react-router';
import { CloseIcon } from '../icons';
import useAuth from '../../hooks/useAuth';
import useAuthStore from '../../store/authStore';
import useFocusTrap from '../../hooks/useFocusTrap';
import '../../styles/layout/MobileNav.css';

export default function MobileNav({ isOpen, onClose, navLinks }) {
  const { isAuthenticated, isAdmin, displayName } = useAuth();
  const signOut = useAuthStore((s) => s.signOut);

  /* ─── Focus trap (handles Tab cycling + Escape + focus restore) ─── */
  const trapRef = useFocusTrap(isOpen, onClose);

  const handleSignOut = async () => {
    onClose();
    await signOut();
  };

  /* ─── Lock body scroll ─── */
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
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
        ref={trapRef}
        className={`mobile-nav ${isOpen ? 'mobile-nav--open' : ''}`}
        aria-label="Mobile navigation"
        aria-hidden={!isOpen}
        role="dialog"
        aria-modal="true"
      >
        <div className="mobile-nav__header">
          <button
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
