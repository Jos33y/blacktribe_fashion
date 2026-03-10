import { useEffect } from 'react';

export default function Checkout() {
  useEffect(() => {
    document.title = 'Checkout. BlackTribe Fashion.';
  }, []);

  return (
    <div className="page-enter" style={ { minHeight: '60vh', padding: 'var(--space-6) 0' } }>
      <div className="container">
        <h1>Checkout</h1>
      </div>
    </div>
  );
}
