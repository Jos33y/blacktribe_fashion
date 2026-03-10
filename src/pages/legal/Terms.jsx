import { useEffect } from 'react';

export default function Terms() {
  useEffect(() => {
    document.title = 'Terms and Conditions. BlackTribe Fashion.';
  }, []);

  return (
    <div className="page-enter" style={ { minHeight: '60vh', padding: 'var(--space-6) 0' } }>
      <div className="container">
        <h1>Terms and Conditions</h1>
      </div>
    </div>
  );
}
