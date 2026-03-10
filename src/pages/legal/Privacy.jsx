import { useEffect } from 'react';

export default function Privacy() {
  useEffect(() => {
    document.title = 'Privacy Policy. BlackTribe Fashion.';
  }, []);

  return (
    <div className="page-enter" style={ { minHeight: '60vh', padding: 'var(--space-6) 0' } }>
      <div className="container">
        <h1>Privacy Policy</h1>
      </div>
    </div>
  );
}
