import { useEffect, useRef } from 'react';
import '../../styles/pages/About.css';

const PRODUCT_IMAGES = [
  '/mock/crystal-velvet-trucker-front.PNG',
  '/mock/sequin-script-zip-shirt-front.PNG',
  '/mock/varsity-jacket-white-front.PNG',
  '/mock/rhinestone-denim-jacket-front.PNG',
  '/mock/obsidian-oversized-tee-black-front.PNG',
  '/mock/full-crystal-trucker-front.PNG',
];

export default function About() {
  const observerRef = useRef(null);

  useEffect(() => {
    document.title = 'About. BlackTribe Fashion.';
  }, []);

  // Scroll reveal
  useEffect(() => {
    const elements = document.querySelectorAll('.about-reveal');

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('about-reveal--visible');
            observerRef.current.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    elements.forEach((el) => observerRef.current.observe(el));

    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <article className="about">

      {/* ═══ HERO ═══ */}
      <section className="page-hero--tall about-hero">
        <div className="page-hero__inner">
          <span className="page-eyebrow">Our Story</span>
          <h1 className="page-headline about-hero-headline">Built From Culture</h1>
          <div className="about-hero-line" />
        </div>
      </section>

      {/* ═══ ORIGIN ═══ */}
      <section className="about-section about-reveal">
        <div className="about-section-inner about-origin">
          <div className="about-origin-meta">
            <span className="about-meta-label">Founded</span>
            <span className="about-meta-value">2018</span>
          </div>
          <div className="about-origin-meta">
            <span className="about-meta-label">Origin</span>
            <span className="about-meta-value">Lagos</span>
          </div>
          <div className="about-origin-meta">
            <span className="about-meta-label">Reach</span>
            <span className="about-meta-value">Worldwide</span>
          </div>
        </div>
      </section>

      {/* ═══ STORY ═══ */}
      <section className="about-section about-reveal">
        <div className="about-section-inner about-story">
          <p className="about-story-lead">
            BlackTribe Fashion started in Lagos in 2018. What began as a small collection of graphic tees has grown into a full premium fashion label with customers across the world.
          </p>
        </div>
      </section>

      {/* ═══ IMAGE STRIP ═══ */}
      <section className="about-image-strip about-reveal">
        <div className="about-image-strip-track">
          {PRODUCT_IMAGES.map((img, i) => (
            <div key={i} className="about-image-strip-item">
              <img src={img} alt="" loading="lazy" />
            </div>
          ))}
        </div>
      </section>

      {/* ═══ IDENTITY ═══ */}
      <section className="about-section about-reveal">
        <div className="about-section-inner about-split">
          <div className="about-split-label">
            <span className="about-label-text">Identity</span>
          </div>
          <div className="about-split-content">
            <p className="about-body">
              Every piece we make is rooted in African street culture and finished with the precision of luxury fashion. We do not mass-produce. We do not follow trends. We create limited collections that mean something to the people who wear them.
            </p>
          </div>
        </div>
      </section>

      {/* ═══ NAME ═══ */}
      <section className="about-section about-reveal">
        <div className="about-section-inner about-split">
          <div className="about-split-label">
            <span className="about-label-text">The Name</span>
          </div>
          <div className="about-split-content">
            <p className="about-body">
              Our name is a statement. "Tribe" means belonging. "Black" means identity. Together, they represent a community of people who wear their culture with pride and without apology.
            </p>
          </div>
        </div>
      </section>

      {/* ═══ EDITORIAL QUOTE ═══ */}
      <section className="about-quote-section about-reveal">
        <div className="about-section-inner">
          <blockquote className="about-quote">
            <p>We design for people who set the standard, not people who follow it.</p>
          </blockquote>
        </div>
      </section>

      {/* ═══ PRODUCT FEATURE ═══ */}
      <section className="about-feature about-reveal">
        <div className="about-feature-image">
          <img
            src="/mock/crystal-velvet-trucker-back.PNG"
            alt="Crystal Velvet Trucker jacket detail"
            loading="lazy"
          />
        </div>
        <div className="about-feature-overlay">
          <span className="about-feature-caption">Crystal details. Applied by hand.</span>
        </div>
      </section>

      {/* ═══ CLOSING ═══ */}
      <section className="about-closing about-reveal">
        <div className="about-section-inner">
          <p className="about-closing-brand">BlackTribe Fashion</p>
          <p className="about-closing-tagline">Redefining Luxury</p>
        </div>
      </section>

    </article>
  );
}
