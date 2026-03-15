import { Link } from 'react-router';
import '../../styles/layout/Footer.css';

const shopLinks = [
  { to: '/shop', label: 'All Pieces' },
  { to: '/collections', label: 'Collections' },
  { to: '/lookbook', label: 'Lookbook' },
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
          <Link to="/" className="footer__logo" aria-label="BlackTribe Fashion home">
            BLACKTRIBE
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
