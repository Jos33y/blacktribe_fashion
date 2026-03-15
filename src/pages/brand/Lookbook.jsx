import { useEffect } from 'react';
import { Link } from 'react-router';
import '../../styles/pages/Lookbook.css';

const EDITORIAL_SECTIONS = [
  {
    id: 'shadow',
    label: 'Shadow Collection',
    layout: 'hero-pair',
    images: [
      { src: '/mock/crystal-velvet-trucker-front.PNG', name: 'Crystal Velvet Trucker', slug: 'crystal-velvet-trucker', span: 'large' },
      { src: '/mock/full-crystal-trucker-front.PNG', name: 'Full Crystal Trucker', slug: 'full-crystal-trucker', span: 'small' },
    ],
  },
  {
    id: 'detail',
    layout: 'trio',
    images: [
      { src: '/mock/rhinestone-denim-jacket-front.PNG', name: 'Rhinestone Denim Jacket', slug: 'rhinestone-denim-jacket' },
      { src: '/mock/sequin-script-zip-shirt-front.PNG', name: 'Sequin Script Zip Shirt', slug: 'sequin-script-zip-shirt' },
      { src: '/mock/crystal-star-crop-shirt-front.PNG', name: 'Crystal Star Crop Shirt', slug: 'crystal-star-crop-shirt' },
    ],
  },
  {
    id: 'quote',
    layout: 'editorial',
    quote: 'Not just clothing. A statement of where you come from and where you are going.',
  },
  {
    id: 'urban',
    label: 'Urban Ritual',
    layout: 'pair',
    images: [
      { src: '/mock/varsity-jacket-white-front.PNG', name: 'Varsity Jacket — White', slug: 'varsity-jacket-white' },
      { src: '/mock/varsity-jacket-black-front.PNG', name: 'Varsity Jacket — Black', slug: 'varsity-jacket-black' },
    ],
  },
  {
    id: 'noir',
    label: 'Noir Essentials',
    layout: 'hero-pair-reverse',
    images: [
      { src: '/mock/cow-print-panel-shirt-black.PNG', name: 'Cow Print Panel Shirt', slug: 'cow-print-panel-shirt-black', span: 'small' },
      { src: '/mock/obsidian-oversized-tee-black-front.PNG', name: 'Obsidian Oversized Tee', slug: 'obsidian-oversized-tee-black', span: 'large' },
    ],
  },
  {
    id: 'accessories',
    layout: 'trio',
    images: [
      { src: '/mock/rhinestone-wide-leg-jeans-front.PNG', name: 'Rhinestone Wide-Leg Jeans', slug: 'rhinestone-wide-leg-jeans' },
      { src: '/mock/embossed-denim-jean-short.PNG', name: 'Embossed Denim Jean Short', slug: 'embossed-denim-jean-short' },
      { src: '/mock/tribal-mask-snapback-grey-front.PNG', name: 'Tribal Mask Snapback', slug: 'tribal-mask-snapback-grey' },
    ],
  },
];

function LookbookImage({ src, name, slug }) {
  return (
    <Link to={`/product/${slug}`} className="lb-image-link">
      <div className="lb-image-container">
        <img src={src} alt={name} loading="lazy" className="lb-image" />
        <div className="lb-image-overlay">
          <span className="lb-image-name">{name}</span>
          <span className="lb-image-cta">View piece</span>
        </div>
      </div>
    </Link>
  );
}

export default function Lookbook() {
  useEffect(() => {
    document.title = 'Lookbook. BlackTribe Fashion.';
  }, []);

  useEffect(() => {
    const elements = document.querySelectorAll('.lb-reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('lb-reveal--visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <article className="lookbook">

      {/* ═══ HERO ═══ */}
      <section className="page-hero lb-hero">
        <div className="page-hero__inner">
          <span className="page-eyebrow">Editorial</span>
          <h1 className="page-headline lb-headline">Lookbook</h1>
          <p className="page-intro page-intro--serif">
            Behind the lens. Campaign imagery from BlackTribe Fashion.
          </p>
        </div>
      </section>

      {/* ═══ EDITORIAL SECTIONS ═══ */}
      {EDITORIAL_SECTIONS.map((section) => {
        if (section.layout === 'editorial') {
          return (
            <section key={section.id} className="lb-editorial lb-reveal">
              <div className="lb-editorial-inner">
                <blockquote className="lb-quote">
                  <p>{section.quote}</p>
                </blockquote>
                <span className="lb-quote-attr">Redefining Luxury Since 2018</span>
              </div>
            </section>
          );
        }

        return (
          <section key={section.id} className="lb-section lb-reveal">
            {section.label && (
              <div className="lb-section-header">
                <span className="lb-section-label">{section.label}</span>
              </div>
            )}
            <div className={`lb-grid lb-grid--${section.layout}`}>
              {section.images.map((img) => (
                <div
                  key={img.slug}
                  className={`lb-grid-item ${img.span === 'large' ? 'lb-grid-item--large' : ''} ${img.span === 'small' ? 'lb-grid-item--small' : ''}`}
                >
                  <LookbookImage {...img} />
                </div>
              ))}
            </div>
          </section>
        );
      })}

      {/* ═══ CLOSING ═══ */}
      <section className="lb-closing lb-reveal">
        <div className="lb-closing-inner">
          <div className="lb-closing-line" />
          <Link to="/shop" className="lb-closing-link">
            Shop the collection
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

    </article>
  );
}
