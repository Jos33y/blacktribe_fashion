import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    document.title = 'BlackTribe Fashion. Redefining Luxury.';
  }, []);

  return (
    <div className="page-enter" style={ { minHeight: '60vh', padding: 'var(--space-6) 0' } }>
      <div className="container">
        <h1>BlackTribe Fashion</h1>
      </div>
    </div>
  );
}