import { Outlet } from 'react-router';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

export default function StoreLayout() {
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content" style={{ flex: 1, paddingTop: 'var(--nav-height)' }}>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
