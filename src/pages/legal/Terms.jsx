import { useEffect } from 'react';
import { setPageMeta, clearPageMeta } from '../../utils/pageMeta';
import '../../styles/pages/Legal.css';

const SECTIONS = [
  {
    title: 'Orders and Pricing',
    content: 'All prices are listed in Nigerian Naira. Prices are subject to change without notice, but changes will not affect orders already placed. We reserve the right to cancel any order due to pricing errors.',
  },
  {
    title: 'Payment',
    content: 'Payment is processed at the time of order through Paystack. We accept card payments, bank transfers, and USSD. All transactions are encrypted and secure.',
  },
  {
    title: 'Shipping',
    content: 'Orders within Nigeria ship within 3-5 business days. International orders ship within 7-14 business days. Delivery times are estimates and not guarantees. BlackTribe Fashion is not responsible for delays caused by customs or postal services.',
  },
  {
    title: 'Pre-Orders',
    content: 'Pre-order items are paid in full at the time of order. They ship on the date specified on the product page. Pre-orders cannot be cancelled once placed.',
  },
  {
    title: 'Returns',
    content: 'Returns are accepted within 14 days of delivery. Items must be unworn, unwashed, and in original condition with all tags attached. Return shipping costs are the responsibility of the customer unless the item is defective. Refunds are processed within 7 business days of receiving the returned item.',
  },
  {
    title: 'Account',
    content: 'You are responsible for maintaining the security of your account. BlackTribe Fashion is not liable for unauthorized access to your account.',
  },
  {
    title: 'Intellectual Property',
    content: 'All content on this website, including images, text, logos, and designs, is the property of BlackTribe Fashion and may not be used without written permission.',
  },
  {
    title: 'Limitation of Liability',
    content: 'BlackTribe Fashion is not liable for any indirect, incidental, or consequential damages resulting from the use of this website or the purchase of products.',
  },
  {
    title: 'Governing Law',
    content: 'These terms are governed by the laws of the Federal Republic of Nigeria.',
  },
];

export default function Terms() {
  useEffect(() => {
    setPageMeta({
      title: 'Terms and Conditions. BlackTribe Fashion.',
      description: 'Terms and conditions for purchases on blacktribefashion.com.',
      path: '/terms',
    });
    return () => clearPageMeta();
  }, []);

  return (
    <article className="legal page-enter">

      {/* ═══ HERO ═══ */}
      <section className="page-hero legal-hero">
        <div className="page-hero__inner">
          <span className="page-eyebrow">Legal</span>
          <h1 className="page-headline legal-headline">Terms and Conditions</h1>
          <p className="legal-updated">Last updated: March 2026</p>
        </div>
      </section>

      {/* ═══ INTRO ═══ */}
      <section className="legal-intro-section">
        <div className="legal-section-inner">
          <p className="legal-intro">
            These terms apply to all purchases made through blacktribefashion.com. By placing an order, you agree to these terms.
          </p>
        </div>
      </section>

      {/* ═══ SECTIONS ═══ */}
      {SECTIONS.map((section, index) => (
        <section key={section.title} className="legal-section">
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
      <section className="legal-closing">
        <div className="legal-closing-inner">
          <div className="legal-closing-line" />
          <p className="legal-closing-text">
            For questions about these terms, contact{' '}
            <a href="mailto:support@blacktribefashion.com" className="legal-closing-email">
              support@blacktribefashion.com
            </a>
          </p>
        </div>
      </section>

    </article>
  );
}
