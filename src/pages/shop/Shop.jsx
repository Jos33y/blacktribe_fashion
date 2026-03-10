import { useEffect } from 'react';

export default function Shop() {
  useEffect(() => {
    document.title = 'Shop. BlackTribe Fashion.';
  }, []);

  return (
    <div className="page-enter" style={ { minHeight: '60vh', padding: 'var(--space-6) 0' } }>
      <div className="container">
        <h1>Shop</h1>
      </div>
    </div>
  );
}
