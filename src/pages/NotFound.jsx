import { useEffect } from 'react';
import { Link } from 'react-router';
import '../styles/pages/NotFound.css';

export default function NotFound() {
  useEffect(() => {
    document.title = '404. BlackTribe Fashion.';
  }, []);

  return (
    <article className="not-found">
      <div className="not-found-inner">

        {/* Background number */}
        <span className="not-found-bg" aria-hidden="true">404</span>

        {/* Content */}
        <div className="not-found-content">
          <span className="not-found-code">404</span>
          <h1 className="not-found-headline">This page does not exist.</h1>
          <p className="not-found-subtext">But we do.</p>
          <Link to="/shop" className="not-found-cta">
            Back to Shop
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

      </div>
    </article>
  );
}
