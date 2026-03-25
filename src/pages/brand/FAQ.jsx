import { useEffect } from 'react';
import { Link } from 'react-router';
import ExpandableSection from '../../components/ui/ExpandableSection';
import { setPageMeta, clearPageMeta } from '../../utils/pageMeta';
import JsonLd, { buildFAQSchema } from '../../components/seo/JsonLd';
import '../../styles/pages/FAQ.css';

const FAQ_CATEGORIES = [
  {
    label: 'Shipping and Delivery',
    items: [
      {
        question: 'How long does shipping take?',
        answer:
          'Nigeria: 3-5 business days. International: 7-14 business days. You will receive a tracking number by email once your order ships.',
      },
      {
        question: 'How much is shipping?',
        answer:
          'Shipping rates are calculated at checkout based on your location. Rates vary by state within Nigeria and by region for international orders.',
      },
      {
        question: 'Do you ship internationally?',
        answer:
          'Yes. We ship worldwide. International delivery takes 7-14 business days depending on your location.',
      },
      {
        question: 'How do I track my order?',
        answer:
          'You will receive a tracking link by email once your order ships. You can also track your order from your account page or using the link in your confirmation email.',
      },
    ],
  },
  {
    label: 'Orders and Payment',
    items: [
      {
        question: 'What payment methods do you accept?',
        answer:
          'We accept card payments, bank transfers, and USSD through Paystack. All payments are processed securely.',
      },
      {
        question: 'Can I change or cancel my order?',
        answer:
          'Contact us within 2 hours of placing your order at support@blacktribefashion.com. Once an order is in processing, it cannot be changed or cancelled.',
      },
      {
        question: 'How do pre-orders work?',
        answer:
          'When you pre-order a piece, you pay in full at the time of order. The piece ships on the date listed on the product page. Pre-order items are produced in limited quantities and are not restocked.',
      },
    ],
  },
  {
    label: 'Product and Sizing',
    items: [
      {
        question: 'What sizes do you carry?',
        answer:
          'Most pieces are available in S, M, L, XL, and XXL. Sizing details are on each product page. Every piece runs true to size. When in doubt, size up.',
      },
      {
        question: 'What is your return policy?',
        answer:
          'We accept returns within 14 days of delivery. The item must be unworn, unwashed, and have all original tags attached. Contact support@blacktribefashion.com to start a return.',
      },
      {
        question: 'Is BlackTribe a unisex brand?',
        answer:
          "Yes. Every piece is designed to be worn by anyone. There are no separate men's or women's collections.",
      },
    ],
  },
];

export default function FAQ() {
  useEffect(() => {
    setPageMeta({
      title: 'FAQ. BlackTribe Fashion.',
      description: 'Shipping, returns, sizing, payments, and pre-orders. Everything you need to know.',
      path: '/faq',
    });
    return () => clearPageMeta();
  }, []);

  // Scroll reveal
  useEffect(() => {
    const elements = document.querySelectorAll('.faq-reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('faq-reveal--visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  /* ─── Flatten FAQ data for JSON-LD ─── */
  const allFaqs = FAQ_CATEGORIES.flatMap((cat) =>
    cat.items.map((item) => ({ question: item.question, answer: item.answer }))
  );

  return (
    <article className="faq">

      {/* ─── Structured Data (JSON-LD) ─── */}
      <JsonLd data={buildFAQSchema(allFaqs)} />

      {/* ═══ HERO ═══ */}
      <section className="page-hero faq-hero">
        <div className="page-hero__inner">
          <span className="page-eyebrow">Support</span>
          <h1 className="page-headline faq-headline">Frequently Asked Questions</h1>
          <p className="page-intro">
            Shipping, returns, sizing, payments, and pre-orders. Everything you need to know.
          </p>
        </div>
      </section>

      {/* ═══ CATEGORIES ═══ */}
      {FAQ_CATEGORIES.map((category, catIndex) => (
        <section
          key={category.label}
          className="faq-category faq-reveal"
        >
          <div className="faq-category-inner">
            <div className="faq-category-header">
              <span className="faq-category-number">
                {String(catIndex + 1).padStart(2, '0')}
              </span>
              <h2 className="faq-category-label">{category.label}</h2>
            </div>
            <div className="faq-category-items">
              {category.items.map((item, itemIndex) => (
                <ExpandableSection
                  key={itemIndex}
                  title={item.question}
                  defaultOpen={catIndex === 0 && itemIndex === 0}
                >
                  <p className="faq-answer">{item.answer}</p>
                </ExpandableSection>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* ═══ CLOSING CTA ═══ */}
      <section className="faq-closing faq-reveal">
        <div className="faq-closing-inner">
          <div className="faq-closing-line" />
          <p className="faq-closing-text">
            Still have questions?
          </p>
          <Link to="/contact" className="faq-closing-link">
            Get in touch
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

    </article>
  );
}
