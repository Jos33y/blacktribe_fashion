import { useEffect } from 'react';

export default function Account() {
  useEffect(() => {
    document.title = 'Your Tribe. BlackTribe Fashion.';
  }, []);

  return (
    <div className="page-enter" style={ { minHeight: '60vh', padding: 'var(--space-6) 0' } }>
      <div className="container">
        <h1>Your Tribe</h1>
      </div>
    </div>
  );
}
