import { useEffect } from 'react';
import { Link } from 'react-router';
import '../../styles/pages/ShippingReturns.css';

const SHIPPING_ZONES = [
  {
    region: 'Nigeria',
    delivery: '3-5 business days',
    cost: 'Free over ₦50,000',
    note: 'Calculated by state at checkout',
  },
  {
    region: 'West Africa',
    delivery: '7-10 business days',
    cost: 'Calculated at checkout',
    note: 'Ghana, Cameroon, Senegal, and more',
  },
  {
    region: 'International',
    delivery: '7-14 business days',
    cost: 'Calculated at checkout',
    note: 'UK, US, Europe, and worldwide',
  },
];

export default function ShippingReturns() {
  useEffect(() => {
    document.title = 'Shipping & Returns. BlackTribe Fashion.';
  }, []);

  useEffect(() => {
    const elements = document.querySelectorAll('.sr-reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('sr-reveal--visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <article className="shipping-returns">

      {/* ═══ HERO ═══ */}
      <section className="page-hero sr-hero"> 
        <div className="page-hero__inner">
          <span className="page-eyebrow">Policy</span>
          <h1 className="page-headline sr-headline">Shipping & Returns</h1>
          <p className="sr-intro">
            We ship worldwide. Free delivery within Nigeria on orders over ₦50,000. Returns accepted within 14 days.
          </p>
        </div>
      </section>

      {/* ═══ SHIPPING ZONES ═══ */}
      <section className="sr-section sr-reveal">
        <div className="sr-section-inner">
          <div className="sr-split-label">
            <span className="sr-label-number">01</span>
            <h2 className="sr-label-text">Shipping</h2>
          </div>
          <div className="sr-split-content">
            <div className="sr-zones">
              {SHIPPING_ZONES.map((zone) => (
                <div key={zone.region} className="sr-zone">
                  <div className="sr-zone-header">
                    <h3 className="sr-zone-region">{zone.region}</h3>
                    <span className="sr-zone-delivery">{zone.delivery}</span>
                  </div>
                  <div className="sr-zone-details">
                    <span className="sr-zone-cost">{zone.cost}</span>
                    <span className="sr-zone-note">{zone.note}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="sr-note-block">
              <p className="sr-note">
                Delivery times are estimates and not guarantees. BlackTribe Fashion is not responsible for delays caused by customs or postal services.
              </p>
              <p className="sr-note">
                You will receive a tracking number by email once your order ships.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ RETURNS ═══ */}
      <section className="sr-section sr-reveal">
        <div className="sr-section-inner">
          <div className="sr-split-label">
            <span className="sr-label-number">02</span>
            <h2 className="sr-label-text">Returns</h2>
          </div>
          <div className="sr-split-content">
            <div className="sr-policy-list">
              <div className="sr-policy-item">
                <span className="sr-policy-key">Window</span>
                <span className="sr-policy-value">14 days from delivery</span>
              </div>
              <div className="sr-policy-item">
                <span className="sr-policy-key">Condition</span>
                <span className="sr-policy-value">Unworn, unwashed, all original tags attached</span>
              </div>
              <div className="sr-policy-item">
                <span className="sr-policy-key">Return Shipping</span>
                <span className="sr-policy-value">Customer responsibility, unless item is defective</span>
              </div>
              <div className="sr-policy-item">
                <span className="sr-policy-key">Process</span>
                <span className="sr-policy-value">
                  Contact support@blacktribefashion.com to start a return
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ PRE-ORDERS ═══ */}
      <section className="sr-section sr-reveal">
        <div className="sr-section-inner">
          <div className="sr-split-label">
            <span className="sr-label-number">03</span>
            <h2 className="sr-label-text">Pre-Orders</h2>
          </div>
          <div className="sr-split-content">
            <p className="sr-body">
              Pre-order items are paid in full at the time of order. They ship on the date specified on the product page. Pre-orders cannot be cancelled once placed. Pre-order items are produced in limited quantities and are not restocked.
            </p>
          </div>
        </div>
      </section>

      {/* ═══ CLOSING ═══ */}
      <section className="sr-closing sr-reveal">
        <div className="sr-closing-inner">
          <div className="sr-closing-line" />
          <p className="sr-closing-text">Need help with a return or shipment?</p>
          <Link to="/contact" className="sr-closing-link">
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
