import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import MobileNav from '../components/layout/MobileNav';
import SearchOverlay from '../components/layout/SearchOverlay';

const navLinks = [
  { to: '/shop', label: 'Shop' },
  { to: '/collections', label: 'Collections' },
  { to: '/lookbook', label: 'Lookbook' },
  { to: '/about', label: 'About' },
];

export default function StoreLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();

  // Close overlays and scroll to top on route change
  useEffect(() => {
    setMobileNavOpen(false);
    setSearchOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <Navbar
        onMenuToggle={() => setMobileNavOpen(!mobileNavOpen)}
        onSearchOpen={() => setSearchOpen(true)}
        bagCount={0}
      />

      <MobileNav
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        navLinks={navLinks}
      />

      <SearchOverlay
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />

      <main id="main-content">
        <Outlet />
      </main>

      <Footer />
    </>
  );
}
