import { Link } from 'react-router';
import '../../styles/layout/Footer.css';
import '../../styles/brand/StoreVisit.css';
import { STORE, storeLines } from '../../config/store';

const shopLinks = [
  { to: '/shop', label: 'All Pieces' },
  { to: '/collections', label: 'Collections' },
  { to: '/lookbook', label: 'Lookbook' },
  { to: '/editorial', label: 'Editorial' },
  { to: '/journal', label: 'Journal' },
];

const companyLinks = [
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
  { to: '/faq', label: 'FAQ' },
];

const helpLinks = [
  { to: '/shipping-returns', label: 'Shipping & Returns' },
  { to: '/refund-policy', label: 'Refund Policy' },
  { to: '/terms', label: 'Terms' },
  { to: '/privacy', label: 'Privacy' },
];

export default function Footer() {
  return (
    <footer className="footer" role="contentinfo">
      <div className="footer__inner container">
        {/* Brand Column */}
        <div className="footer__brand">
          <Link to="/" aria-label="BlackTribe Fashion home">
            <img
              src="/logo_white.png"
              alt=""
              className="footer__mask"
              width="28"
              aria-hidden="true"
              loading="lazy"
            />
            <span className="footer__logo">BLACKTRIBE</span>
          </Link>
          <p className="footer__tagline">Redefining Luxury</p>
        </div>

        {/* Link Columns */}
        <div className="footer__columns">
          <div className="footer__column">
            <h3 className="footer__column-title">Shop</h3>
            <ul role="list">
              {shopLinks.map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="footer__link">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer__column">
            <h3 className="footer__column-title">Company</h3>
            <ul role="list">
              {companyLinks.map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="footer__link">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer__column">
            <h3 className="footer__column-title">Help</h3>
            <ul role="list">
              {helpLinks.map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="footer__link">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer__column footer__column--store">
            <h3 className="footer__column-title">Visit</h3>
            <address className="store-address">
              {storeLines.map((line) => <span key={line}>{line}</span>)}
            </address>
            <a
              href={STORE.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="footer__link store-directions"
            >
              Get directions
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer__bottom">
        <div className="footer__bottom-inner container">
          <p className="footer__copyright">
            &copy; {new Date().getFullYear()} BlackTribe Fashion. All rights reserved.
          </p>
          <div className="footer__social">
            <a
              href="https://instagram.com/blacktribe_fashion"
              target="_blank"
              rel="noopener noreferrer"
              className="footer__social-link"
              aria-label="Instagram"
            >
              Instagram
            </a>
            <a
              href="https://twitter.com/blacktribe"
              target="_blank"
              rel="noopener noreferrer"
              className="footer__social-link"
              aria-label="Twitter"
            >
              Twitter
            </a>
            <a
              href="https://tiktok.com/@blacktribe"
              target="_blank"
              rel="noopener noreferrer"
              className="footer__social-link"
              aria-label="TikTok"
            >
              TikTok
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
