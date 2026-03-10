import { useEffect } from 'react';

export default function Contact() {
  useEffect(() => {
    document.title = 'Contact. BlackTribe Fashion.';
  }, []);

  return (
    <div className="page-enter" style={ { minHeight: '60vh', padding: 'var(--space-6) 0' } }>
      <div className="container">
        <h1>Contact</h1>
      </div>
    </div>
  );
}
