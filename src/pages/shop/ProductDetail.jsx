import { useEffect } from 'react';

export default function ProductDetail() {
  useEffect(() => {
    document.title = 'Product. BlackTribe Fashion.';
  }, []);

  return (
    <div className="page-enter" style={ { minHeight: '60vh', padding: 'var(--space-6) 0' } }>
      <div className="container">
        <h1>Product</h1>
      </div>
    </div>
  );
}
