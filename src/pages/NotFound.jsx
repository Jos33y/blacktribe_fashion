import { useEffect } from 'react';
import { Link } from 'react-router';

export default function NotFound() {
  useEffect(() => {
    document.title = 'Page Not Found. BlackTribe Fashion.';
  }, []);

  return (
    <div className="page-enter" style={{
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: 'var(--space-6) var(--content-padding)',
    }}>
      <h1 style={{ marginBottom: 'var(--space-2)' }}>This page does not exist.</h1>
      <p style={{ color: 'var(--bt-text-secondary)', marginBottom: 'var(--space-5)' }}>
        But we do.
      </p>
      <Link
        to="/shop"
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-small)',
          fontWeight: 'var(--weight-medium)',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--bt-text)',
          borderBottom: '1px solid var(--bt-text)',
          paddingBottom: '2px',
        }}
      >
        Back to Shop
      </Link>
    </div>
  );
}
