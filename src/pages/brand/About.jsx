import { useEffect } from 'react';

export default function About() {
  useEffect(() => {
    document.title = 'About. BlackTribe Fashion.';
  }, []);

  return (
    <div className="page-enter" style={ { minHeight: '60vh', padding: 'var(--space-6) 0' } }>
      <div className="container">
        <h1>About</h1>
      </div>
    </div>
  );
}
