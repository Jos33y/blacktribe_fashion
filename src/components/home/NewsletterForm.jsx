import { useState } from 'react';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null); // null | 'success' | 'error' | 'duplicate'
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    // TODO: Wire to API in Phase 5
    // Simulating success for now
    await new Promise((r) => setTimeout(r, 600));
    setStatus('success');
    setLoading(false);
  }

  return (
    <section className="newsletter" aria-labelledby="newsletter-heading">
      <div className="newsletter__inner container">
        <h2 id="newsletter-heading" className="newsletter__title">Join the Tribe</h2>
        <p className="newsletter__subtitle">First access to drops. No spam.</p>

        {status === 'success' ? (
          <p className="newsletter__success" role="status">You are in.</p>
        ) : (
          <form className="newsletter__form" onSubmit={handleSubmit}>
            <label htmlFor="newsletter-email" className="sr-only">Email address</label>
            <input
              id="newsletter-email"
              type="email"
              className="newsletter__input"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-label="Email address"
            />
            <button
              type="submit"
              className="newsletter__button"
              disabled={loading}
            >
              {loading ? 'Subscribing...' : 'Subscribe'}
            </button>
          </form>
        )}

        {status === 'duplicate' && (
          <p className="newsletter__error" role="alert">This email is already subscribed.</p>
        )}
        {status === 'error' && (
          <p className="newsletter__error" role="alert">Something went wrong. Try again.</p>
        )}
      </div>
    </section>
  );
}
