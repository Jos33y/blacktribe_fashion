import { useState, useEffect } from 'react';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import '../../styles/pages/Contact.css';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    document.title = 'Contact. BlackTribe Fashion.';
  }, []);

  // Scroll reveal
  useEffect(() => {
    const elements = document.querySelectorAll('.contact-reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('contact-reveal--visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (!form.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = 'Enter a valid email address';
    if (!form.message.trim()) newErrors.message = 'Message is required';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          message: form.message.trim(),
        }),
      });

      const json = await res.json();

      if (json.success) {
        setSubmitted(true);
      } else {
        setSubmitError(json.error || 'Something went wrong. Try again.');
      }
    } catch {
      setSubmitError('Something went wrong. Try again or email us directly at support@blacktribefashion.com.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <article className="contact">
        <div className="contact-success">
          <div className="contact-success-inner"> 
            <span className="contact-success-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </span>
            <h1 className="contact-success-title">Message sent.</h1>
            <p className="contact-success-body">
              We will get back to you within 24 hours.
            </p>
            <div className="contact-success-action">
              <Button variant="secondary" to="/">Continue Shopping</Button>
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="contact">

      {/* ═══ HERO ═══ */}
      <section className="page-hero contact-hero">
        <div className="page-hero__inner">
          <span className="page-eyebrow">Get in Touch</span>
          <h1 className="page-headline contact-headline">Contact</h1>
          <p className="page-intro">
            Have a question about an order, sizing, or a collaboration? Reach out. We respond within 24 hours.
          </p>
        </div>
      </section>

      {/* ═══ MAIN CONTENT ═══ */}
      <section className="contact-main contact-reveal">
        <div className="contact-main-inner">

          {/* Left: Channels */}
          <div className="contact-channels">
            <div className="contact-channel">
              <span className="contact-channel-label">Email</span>
              <a
                href="mailto:support@blacktribefashion.com"
                className="contact-channel-value contact-channel-link"
              >
                support@blacktribefashion.com
              </a>
            </div>

            <div className="contact-channel">
              <span className="contact-channel-label">Instagram</span>
              <a
                href="https://instagram.com/blacktribe_fashion"
                target="_blank"
                rel="noopener noreferrer"
                className="contact-channel-value contact-channel-link"
              >
                @blacktribe_fashion
              </a>
            </div>

            <div className="contact-channel">
              <span className="contact-channel-label">Response Time</span>
              <span className="contact-channel-value">Within 24 hours</span>
            </div>
          </div>

          {/* Right: Form */}
          <div className="contact-form-wrapper">
            <form className="contact-form" onSubmit={handleSubmit} noValidate>
              <Input
                label="Name"
                name="name"
                value={form.name}
                onChange={handleChange}
                error={errors.name}
                autoComplete="name"
              />
              <Input
                label="Email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                error={errors.email}
                autoComplete="email"
              />
              <div className="contact-textarea-group">
                <label className="contact-textarea-label" htmlFor="message">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  className={`contact-textarea ${
                    errors.message ? 'contact-textarea--error' : ''
                  }`}
                  value={form.message}
                  onChange={handleChange}
                  rows={6}
                  placeholder="How can we help?"
                  aria-invalid={errors.message ? 'true' : undefined}
                  aria-describedby={
                    errors.message ? 'message-error' : undefined
                  }
                />
                {errors.message && (
                  <p
                    className="contact-textarea-error"
                    id="message-error"
                    role="alert"
                  >
                    {errors.message}
                  </p>
                )}
              </div>

              {submitError && (
                <p className="contact-textarea-error" role="alert">{submitError}</p>
              )}

              <Button variant="primary" type="submit" disabled={submitting}>
                {submitting ? 'Sending...' : 'Send Message'}
              </Button>
            </form>
          </div>
        </div>
      </section>

    </article>
  );
}
