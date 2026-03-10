import { useEffect } from 'react';

export default function OrderConfirmation() {
  useEffect(() => {
    document.title = 'Order Confirmed. BlackTribe Fashion.';
  }, []);

  return (
    <div className="page-enter" style={ { minHeight: '60vh', padding: 'var(--space-6) 0' } }>
      <div className="container">
        <h1>Order Confirmed</h1>
      </div>
    </div>
  );
}
