import { useEffect } from 'react';

export default function AdminOrderDetail() {
  useEffect(() => {
    document.title = 'Admin. BlackTribe Fashion.';
  }, []);

  return (
    <div style={ { minHeight: '100vh', padding: 'var(--space-6)', background: 'var(--bt-bg)' } }>
      <div style={ { maxWidth: 1200, margin: '0 auto' } }>
        <h1>Admin: OrderDetail</h1>
        <p style={ { color: 'var(--bt-text-secondary)', marginTop: 'var(--space-3)' } }>
          Built in Phase 6.
        </p>
      </div>
    </div>
  );
}
