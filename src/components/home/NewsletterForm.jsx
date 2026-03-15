import { useState } from 'react';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) return;

    setStatus('loading');
    // TODO: Connect to Resend in Phase 5
    setTimeout(() => {
      setStatus('success');
      setEmail('');
    }, 800);
  };

  if (status === 'success') {
    return (
      <section className="home-newsletter">
        <div className="home-newsletter__inner container">
          <p className="home-newsletter__success">You are in.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="home-newsletter">
      <div className="home-newsletter__inner container">
        <span className="home-newsletter__eyebrow">Stay Connected</span>
        <h2 className="home-newsletter__title">Join the Tribe</h2>
        <p className="home-newsletter__sub">First access to drops. No spam.</p>

        <form className="home-newsletter__form" onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="home-newsletter__input"
            required
            aria-label="Email address"
          />
          <button
            type="submit"
            className="home-newsletter__btn"
            disabled={status === 'loading'}
          >
            {status === 'loading' ? 'Joining...' : 'Subscribe'}
          </button>
        </form>
      </div>
    </section>
  );
}
