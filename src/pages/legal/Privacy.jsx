import { useEffect } from 'react';
import { setPageMeta, clearPageMeta } from '../../utils/pageMeta';
import '../../styles/pages/Legal.css';

const SECTIONS = [
  {
    title: 'What We Collect',
    content: 'When you make a purchase or create an account, we collect your name, email address, phone number (if provided), and shipping address. When you browse our site, we collect basic usage data such as pages visited and device type.',
  },
  {
    title: 'How We Use It',
    content: 'We use your information to process orders, send order updates, and improve your shopping experience. If you subscribe to our newsletter, we use your email to send product announcements. We do not send promotional emails unless you have opted in.',
  },
  {
    title: 'Payment Information',
    content: 'We do not store your payment card details. All payment processing is handled securely by Paystack.',
  },
  {
    title: 'Sharing',
    content: 'We do not sell, rent, or share your personal information with third parties for marketing purposes. We share information only with service providers necessary to fulfill your order (shipping carriers, payment processors).',
  },
  {
    title: 'Cookies',
    content: 'We use essential cookies to keep your shopping bag and login session active. We do not use advertising or tracking cookies.',
  },
  {
    title: 'Your Rights',
    content: 'You can request access to your personal data, ask for corrections, or request deletion by contacting support@blacktribefashion.com. We will respond within 14 business days.',
  },
  {
    title: 'Data Retention',
    content: 'We retain order data for 5 years for legal and accounting purposes. Account data is retained until you request deletion.',
  },
  {
    title: 'Changes',
    content: 'We may update this policy from time to time. Changes will be posted on this page with the updated date.',
  },
];

export default function Privacy() {
  useEffect(() => {
    setPageMeta({
      title: 'Privacy Policy. BlackTribe Fashion.',
      description: 'How BlackTribe Fashion collects, uses, and protects your information.',
      path: '/privacy',
    });
    return () => clearPageMeta();
  }, []);

  useEffect(() => {
    const elements = document.querySelectorAll('.legal-reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('legal-reveal--visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <article className="legal">

      {/* ═══ HERO ═══ */}
      <section className="page-hero legal-hero">
        <div className="page-hero__inner">
          <span className="page-eyebrow">Legal</span>
          <h1 className="page-headline legal-headline">Privacy Policy</h1>
          <p className="legal-updated">Last updated: March 2026</p>
        </div>
      </section>

      {/* ═══ INTRO ═══ */}
      <section className="legal-intro-section legal-reveal">
        <div className="legal-section-inner">
          <p className="legal-intro">
            BlackTribe Fashion respects your privacy. This policy explains what information we collect, how we use it, and your rights.
          </p>
        </div>
      </section>

      {/* ═══ SECTIONS ═══ */}
      {SECTIONS.map((section, index) => (
        <section key={section.title} className="legal-section legal-reveal">
          <div className="legal-section-inner legal-split">
            <div className="legal-split-label">
              <span className="legal-label-number">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h2 className="legal-label-text">{section.title}</h2>
            </div>
            <div className="legal-split-content">
              <p className="legal-body">{section.content}</p>
            </div>
          </div>
        </section>
      ))}

      {/* ═══ CLOSING ═══ */}
      <section className="legal-closing legal-reveal">
        <div className="legal-closing-inner">
          <div className="legal-closing-line" />
          <p className="legal-closing-text">
            For privacy questions, contact{' '}
            <a href="mailto:support@blacktribefashion.com" className="legal-closing-email">
              support@blacktribefashion.com
            </a>
          </p>
        </div>
      </section>

    </article>
  );
}
