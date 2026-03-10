import { useEffect } from 'react';

export default function OrderTracking() {
  useEffect(() => {
    document.title = 'Track Your Order. BlackTribe Fashion.';
  }, []);

  return (
    <div className="page-enter" style={ { minHeight: '60vh', padding: 'var(--space-6) 0' } }>
      <div className="container">
        <h1>Track Your Order</h1>
      </div>
    </div>
  );
}
