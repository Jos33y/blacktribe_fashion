import { useEffect } from 'react';

export default function CollectionDetail() {
  useEffect(() => {
    document.title = 'Collection. BlackTribe Fashion.';
  }, []);

  return (
    <div className="page-enter" style={ { minHeight: '60vh', padding: 'var(--space-6) 0' } }>
      <div className="container">
        <h1>Collection</h1>
      </div>
    </div>
  );
}
