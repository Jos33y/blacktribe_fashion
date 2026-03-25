/*
 * BLACKTRIBE FASHION — ABOUT PAGE (Phase 5)
 *
 * Image strip now fetches real product images from API.
 */

import { useEffect, useRef, useState } from 'react';
import { setPageMeta, clearPageMeta } from '../../utils/pageMeta';
import '../../styles/pages/About.css';

export default function About() {
  const observerRef = useRef(null);
  const [productImages, setProductImages] = useState([]);

  useEffect(() => {
    setPageMeta({
      title: 'About. BlackTribe Fashion.',
      description: 'Born in Lagos in 2017. Premium streetwear and luxury fashion for people who set the standard.',
      path: '/about',
    });
    return () => clearPageMeta();
  }, []);

  /* Fetch product images for the strip */
  useEffect(() => {
    async function loadImages() {
      try {
        const res = await fetch('/api/products?limit=6&sort=newest');
        const json = await res.json();
        if (json.success && json.data) {
          const images = json.data
            .map((p) => p.images?.[0])
            .filter(Boolean)
            .slice(0, 6);
          setProductImages(images);
        }
      } catch { /* silent — strip just won't show */ }
    }
    loadImages();
  }, []);

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
  }, [productImages]);

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
            <span className="about-meta-value">2017</span>
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
            BlackTribe started in Lagos in 2017 — not as a fashion brand, but as a gathering. Art shows. Warehouse parties. A community of creatives who believed African culture deserved a louder voice. The clothes came later. The identity was always there.
          </p>
        </div>
      </section>

      {/* ═══ IMAGE STRIP ═══ */}
      {productImages.length > 0 && (
        <section className="about-image-strip about-reveal">
          <div className="about-image-strip-track">
            {productImages.map((img, i) => (
              <div key={i} className="about-image-strip-item">
                <img src={img} alt="" loading="lazy" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ═══ ORIGIN STORY ═══ */}
      <section className="about-section about-reveal">
        <div className="about-section-inner about-split">
          <div className="about-split-label">
            <span className="about-label-text">The Beginning</span>
          </div>
          <div className="about-split-content">
            <p className="about-body">
              For four years, BlackTribe was a cultural movement. Events that brought together artists, musicians, and designers across Lagos. The energy at those gatherings — the way people dressed, the way they carried themselves — became the blueprint for everything that followed.
            </p>
          </div>
        </div>
      </section>

      {/* ═══ FASHION ═══ */}
      <section className="about-section about-reveal">
        <div className="about-section-inner about-split">
          <div className="about-split-label">
            <span className="about-label-text">The Fashion</span>
          </div>
          <div className="about-split-content">
            <p className="about-body">
              In 2021, the fashion arm launched. Not as a pivot — as an evolution. Every piece carries the DNA of those early gatherings: hand-set crystal details, tribal mask emblems, and the confidence of people who create culture rather than consume it. Limited runs. No mass production. No compromise.
            </p>
          </div>
        </div>
      </section>

      {/* ═══ IDENTITY ═══ */}
      <section className="about-section about-reveal">
        <div className="about-section-inner about-split">
          <div className="about-split-label">
            <span className="about-label-text">The Name</span>
          </div>
          <div className="about-split-content">
            <p className="about-body">
              "Tribe" is belonging. "Black" is identity. Together, they represent a community that wears its culture without apology. The tribal mask in our logo is not decoration — it is heritage, rendered in a language the world understands.
            </p>
          </div>
        </div>
      </section>

      {/* ═══ EDITORIAL QUOTE ═══ */}
      <section className="about-quote-section about-reveal">
        <div className="about-section-inner">
          <blockquote className="about-quote">
            <p>Nine years of proving that luxury has no geography.</p>
          </blockquote>
        </div>
      </section>

      {/* ═══ PRODUCT FEATURE ═══ */}
      {productImages.length > 0 && (
        <section className="about-feature about-reveal">
          <div className="about-feature-image">
            <img
              src={productImages[0]}
              alt="BlackTribe Fashion — crafted by hand"
              loading="lazy"
            />
          </div>
          <div className="about-feature-overlay">
            <span className="about-feature-caption">Crystal details. Applied by hand.</span>
          </div>
        </section>
      )}

      {/* ═══ CLOSING ═══ */}
      <section className="about-closing about-reveal">
        <div className="about-section-inner">
          <p className="about-closing-brand">BlackTribe Fashion</p>
          <p className="about-closing-tagline">Redefining Luxury Since 2017</p>
        </div>
      </section>

    </article>
  );
}
