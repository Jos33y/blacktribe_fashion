import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import MobileNav from '../components/layout/MobileNav';
import SearchOverlay from '../components/layout/SearchOverlay';
import CartDrawer from '../components/cart/CartDrawer';
import InstallPrompt from '../components/ui/InstallPrompt';
import useUIStore from '../store/uiStore';
import useCartStore from '../store/cartStore';
import { trackPageView } from '../utils/tracker';
import { announceRouteChange } from '../utils/announcer';

const navLinks = [
  { to: '/shop', label: 'Shop' },
  { to: '/collections', label: 'Collections' },
  { to: '/lookbook', label: 'Lookbook' },
  { to: '/about', label: 'About' },
];

/* Routes where the cart drawer should not render */
const NO_CART_DRAWER_ROUTES = ['/checkout', '/order-confirmation', '/pay'];

export default function StoreLayout() {
  const location = useLocation();

  /* ─── UI state from Zustand ─── */
  const mobileNavOpen = useUIStore((s) => s.mobileNavOpen);
  const searchOpen = useUIStore((s) => s.searchOpen);
  const openMobileNav = useUIStore((s) => s.openMobileNav);
  const closeMobileNav = useUIStore((s) => s.closeMobileNav);
  const openSearch = useUIStore((s) => s.openSearch);
  const closeSearch = useUIStore((s) => s.closeSearch);
  const openCartDrawer = useUIStore((s) => s.openCartDrawer);
  const closeAll = useUIStore((s) => s.closeAll);

  /* ─── Cart state ─── */
  const bagCount = useCartStore((s) => s.getItemCount());

  /* ─── Determine if cart drawer is allowed on this route ─── */
  const hideCartDrawer = NO_CART_DRAWER_ROUTES.some(
    (route) => location.pathname.startsWith(route)
  );

  /* ─── Close overlays, scroll to top, track page view, announce route ─── */
  useEffect(() => {
    closeAll();

    // Delay scroll to top so the new lazy route has time to mount.
    // Without this, scrollTo fires while Suspense is still showing
    // the skeleton, then the real page mounts below the fold.
    const scrollTimer = requestAnimationFrame(() => {
      window.scrollTo(0, 0);
    });

    trackPageView(location.pathname);

    /* Announce page change to screen readers after title updates */
    const announceTimer = setTimeout(() => {
      announceRouteChange(document.title);
    }, 300);

    return () => {
      cancelAnimationFrame(scrollTimer);
      clearTimeout(announceTimer);
    };
  }, [location.pathname, closeAll]);

  /* ─── Bag click handler ─── */
  const handleBagClick = () => {
    if (hideCartDrawer) {
      const summary = document.querySelector('.checkout__sidebar');
      if (summary) {
        summary.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }
    openCartDrawer();
  };

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <Navbar
        onMenuToggle={() => mobileNavOpen ? closeMobileNav() : openMobileNav()}
        onSearchOpen={openSearch}
        onBagClick={handleBagClick}
        bagCount={bagCount}
      />

      <MobileNav
        isOpen={mobileNavOpen}
        onClose={closeMobileNav}
        navLinks={navLinks}
      />

      <SearchOverlay
        isOpen={searchOpen}
        onClose={closeSearch}
      />

      {!hideCartDrawer && <CartDrawer />}

      <main id="main-content">
        <Outlet />
      </main>

      <Footer />

      <InstallPrompt />
    </>
  );
}
