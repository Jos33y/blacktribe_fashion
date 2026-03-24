/*
 * BLACKTRIBE FASHION — NEWSLETTER FORM (HOMEPAGE)
 *
 * POST /api/newsletter/subscribe
 * Handles: success, already subscribed, invalid email, network error.
 * Copy from blacktribe-content.md.
 */

import { useState } from 'react';
import { trackNewsletterSignup } from '../../utils/tracker';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = email.trim();

    if (!trimmed || !trimmed.includes('@')) {
      setStatus('error');
      setErrorMsg('Enter a valid email address.');
      return;
    }

    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      });

      const json = await res.json();

      if (json.success) {
        setStatus('success');
        setEmail('');
        trackNewsletterSignup();
      } else {
        setStatus('error');
        setErrorMsg(json.error || 'Something went wrong. Try again.');
      }
    } catch {
      setStatus('error');
      setErrorMsg('Unable to connect. Check your internet connection.');
    }
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
            onChange={(e) => { setEmail(e.target.value); if (status === 'error') setStatus('idle'); }}
            placeholder="your@email.com"
            className={`home-newsletter__input ${status === 'error' ? 'home-newsletter__input--error' : ''}`}
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

        {status === 'error' && errorMsg && (
          <p className="home-newsletter__error">{errorMsg}</p>
        )}
      </div>
    </section>
  );
}
