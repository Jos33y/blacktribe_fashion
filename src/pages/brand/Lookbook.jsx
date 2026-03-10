import { useEffect } from 'react';

export default function Lookbook() {
  useEffect(() => {
    document.title = 'Lookbook. BlackTribe Fashion.';
  }, []);

  return (
    <div className="page-enter" style={ { minHeight: '60vh', padding: 'var(--space-6) 0' } }>
      <div className="container">
        <h1>Lookbook</h1>
      </div>
    </div>
  );
}
