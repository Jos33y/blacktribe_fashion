import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import MobileNav from '../components/layout/MobileNav';
import SearchOverlay from '../components/layout/SearchOverlay';
import CartDrawer from '../components/cart/CartDrawer';
import useUIStore from '../store/uiStore';
import useCartStore from '../store/cartStore';

const navLinks = [
  { to: '/shop', label: 'Shop' },
  { to: '/collections', label: 'Collections' },
  { to: '/lookbook', label: 'Lookbook' },
  { to: '/about', label: 'About' },
];

export default function StoreLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const mobileNavOpen = useUIStore((s) => s.mobileNavOpen);
  const searchOpen = useUIStore((s) => s.searchOpen);
  const openMobileNav = useUIStore((s) => s.openMobileNav);
  const closeMobileNav = useUIStore((s) => s.closeMobileNav);
  const openSearch = useUIStore((s) => s.openSearch);
  const closeSearch = useUIStore((s) => s.closeSearch);
  const openCartDrawer = useUIStore((s) => s.openCartDrawer);
  const closeAll = useUIStore((s) => s.closeAll);

  const bagCount = useCartStore((s) => s.getItemCount());

  const isCheckout = location.pathname === '/checkout';

  useEffect(() => {
    closeAll();
    window.scrollTo(0, 0);
  }, [location.pathname, closeAll]);

  /* ─── Bag click: on checkout, scroll to summary. Otherwise, open drawer. ─── */
  const handleBagClick = () => {
    if (isCheckout) {
      // On checkout, scroll to the order summary instead of opening drawer
      const summary = document.querySelector('.checkout-summary');
      if (summary) summary.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

      {/* Don't render cart drawer on checkout — summary is inline */}
      {!isCheckout && <CartDrawer />}

      <main id="main-content">
        <Outlet />
      </main>

      <Footer />
    </>
  );
}
