import { useEffect } from 'react';
import { Link } from 'react-router';
import { setPageMeta, clearPageMeta } from '../../utils/pageMeta';
import '../../styles/pages/RefundPolicy.css';

export default function RefundPolicy() {
  useEffect(() => {
    setPageMeta({
      title: 'Refund Policy. BlackTribe Fashion.',
      description: 'Refund eligibility, process, and exceptions for BlackTribe Fashion purchases.',
      path: '/refund-policy',
    });
    return () => clearPageMeta();
  }, []);

  return (
    <article className="refund-policy page-enter">

      {/* ═══ HERO ═══ */}
      <section className="page-hero rp-hero">
        <div className="page-hero__inner">
          <span className="page-eyebrow">Policy</span>
          <h1 className="page-headline rp-headline">Refund Policy</h1>
          <p className="rp-updated">Last updated: March 2026</p>
        </div>
      </section>

      {/* ═══ OVERVIEW ═══ */}
      <section className="rp-section">
        <div className="rp-section-inner">
          <div className="rp-split-label">
            <span className="rp-label-number">01</span>
            <h2 className="rp-label-text">Eligibility</h2>
          </div>
          <div className="rp-split-content">
            <p className="rp-body">
              Refunds are available for items returned within 14 days of delivery. To be eligible for a refund, the item must be unworn, unwashed, and in its original condition with all tags attached.
            </p>
            <p className="rp-body">
              Items that show signs of wear, alterations, or missing tags are not eligible for a refund.
            </p>
          </div>
        </div>
      </section>

      {/* ═══ PROCESS ═══ */}
      <section className="rp-section">
        <div className="rp-section-inner">
          <div className="rp-split-label">
            <span className="rp-label-number">02</span>
            <h2 className="rp-label-text">How It Works</h2>
          </div>
          <div className="rp-split-content">
            <div className="rp-steps">
              <div className="rp-step">
                <span className="rp-step-number">1</span>
                <div className="rp-step-content">
                  <h3 className="rp-step-title">Contact us</h3>
                  <p className="rp-step-body">
                    Email support@blacktribefashion.com with your order number and reason for return. We will respond within 24 hours.
                  </p>
                </div>
              </div>
              <div className="rp-step">
                <span className="rp-step-number">2</span>
                <div className="rp-step-content">
                  <h3 className="rp-step-title">Ship the item</h3>
                  <p className="rp-step-body">
                    Once approved, ship the item back to us. Return shipping costs are the responsibility of the customer unless the item is defective.
                  </p>
                </div>
              </div>
              <div className="rp-step">
                <span className="rp-step-number">3</span>
                <div className="rp-step-content">
                  <h3 className="rp-step-title">Receive your refund</h3>
                  <p className="rp-step-body">
                    Refunds are processed within 7 business days of receiving the returned item. The refund is issued to your original payment method.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ EXCEPTIONS ═══ */}
      <section className="rp-section">
        <div className="rp-section-inner">
          <div className="rp-split-label">
            <span className="rp-label-number">03</span>
            <h2 className="rp-label-text">Exceptions</h2>
          </div>
          <div className="rp-split-content">
            <div className="rp-exception-list">
              <div className="rp-exception">
                <span className="rp-exception-key">Pre-orders</span>
                <span className="rp-exception-value">Pre-order items cannot be cancelled or refunded once placed. They ship on the date specified on the product page.</span>
              </div>
              <div className="rp-exception">
                <span className="rp-exception-key">Defective items</span>
                <span className="rp-exception-value">If you receive a defective item, contact us within 48 hours of delivery. We will cover return shipping and issue a full refund or replacement.</span>
              </div>
              <div className="rp-exception">
                <span className="rp-exception-key">Exchanges</span>
                <span className="rp-exception-value">We do not offer direct exchanges. Return the item for a refund and place a new order for the desired size or product.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CLOSING ═══ */}
      <section className="rp-closing">
        <div className="rp-closing-inner">
          <div className="rp-closing-line" />
          <p className="rp-closing-text">Questions about a refund?</p>
          <Link to="/contact" className="rp-closing-link">
            Contact us
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

    </article>
  );
}
