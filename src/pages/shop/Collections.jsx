import { useEffect } from 'react';

export default function Collections() {
  useEffect(() => {
    document.title = 'Collections. BlackTribe Fashion.';
  }, []);

  return (
    <div className="page-enter" style={ { minHeight: '60vh', padding: 'var(--space-6) 0' } }>
      <div className="container">
        <h1>Collections</h1>
      </div>
    </div>
  );
}
