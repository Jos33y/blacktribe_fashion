import { useEffect } from 'react';

export default function Auth() {
  useEffect(() => {
    document.title = 'Sign In. BlackTribe Fashion.';
  }, []);

  return (
    <div className="page-enter" style={ { minHeight: '60vh', padding: 'var(--space-6) 0' } }>
      <div className="container">
        <h1>Sign In</h1>
      </div>
    </div>
  );
}
