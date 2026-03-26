/*
 * BLACKTRIBE FASHION — LOOKBOOK PAGE (Phase 5)
 *
 * Dynamic editorial layout. Fetches real products from API
 * and distributes them into curated grid sections.
 *
 * Layout pattern:
 *   1. hero-pair (1 large + 1 small)
 *   2. trio (3 equal)
 *   3. editorial quote
 *   4. pair (2 equal)
 *   5. hero-pair-reverse (1 small + 1 large)
 *   6. trio (3 equal)
 *
 * Needs minimum 11 products to fill all slots.
 * Gracefully degrades with fewer products.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import Skeleton from '../../components/ui/Skeleton';
import useScrollReveal from '../../hooks/useScrollReveal';
import { setPageMeta, clearPageMeta } from '../../utils/pageMeta';
import '../../styles/pages/Lookbook.css';

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

/* Build editorial sections from a flat product array */
function buildSections(products) {
  const sections = [];
  let idx = 0;

  function take(count) {
    const items = products.slice(idx, idx + count);
    idx += count;
    return items;
  }

  /* Section 1: hero-pair (2 products) */
  const heroPair = take(2);
  if (heroPair.length >= 2) {
    sections.push({
      id: 'hero-1',
      layout: 'hero-pair',
      images: [
        { src: heroPair[0].images[0], name: heroPair[0].name, slug: heroPair[0].slug, span: 'large' },
        { src: heroPair[1].images[0], name: heroPair[1].name, slug: heroPair[1].slug, span: 'small' },
      ],
    });
  } else if (heroPair.length === 1) {
    sections.push({
      id: 'hero-1',
      layout: 'hero-pair',
      images: [
        { src: heroPair[0].images[0], name: heroPair[0].name, slug: heroPair[0].slug, span: 'large' },
      ],
    });
  }

  /* Section 2: trio (3 products) */
  const trio1 = take(3);
  if (trio1.length > 0) {
    sections.push({
      id: 'trio-1',
      layout: 'trio',
      images: trio1.map((p) => ({
        src: p.images[0], name: p.name, slug: p.slug,
      })),
    });
  }

  /* Section 3: editorial quote (always shown) */
  sections.push({
    id: 'quote',
    layout: 'editorial',
    quote: 'Not just clothing. A statement of where you come from and where you are going.',
  });

  /* Section 4: pair (2 products) */
  const pair = take(2);
  if (pair.length > 0) {
    sections.push({
      id: 'pair-1',
      layout: 'pair',
      images: pair.map((p) => ({
        src: p.images[0], name: p.name, slug: p.slug,
      })),
    });
  }

  /* Section 5: hero-pair-reverse (2 products) */
  const heroReverse = take(2);
  if (heroReverse.length >= 2) {
    sections.push({
      id: 'hero-2',
      layout: 'hero-pair-reverse',
      images: [
        { src: heroReverse[0].images[0], name: heroReverse[0].name, slug: heroReverse[0].slug, span: 'small' },
        { src: heroReverse[1].images[0], name: heroReverse[1].name, slug: heroReverse[1].slug, span: 'large' },
      ],
    });
  } else if (heroReverse.length === 1) {
    sections.push({
      id: 'hero-2',
      layout: 'pair',
      images: [
        { src: heroReverse[0].images[0], name: heroReverse[0].name, slug: heroReverse[0].slug },
      ],
    });
  }

  /* Section 6: trio (remaining products, up to 3) */
  const trio2 = take(3);
  if (trio2.length > 0) {
    sections.push({
      id: 'trio-2',
      layout: 'trio',
      images: trio2.map((p) => ({
        src: p.images[0], name: p.name, slug: p.slug,
      })),
    });
  }

  return sections;
}

export default function Lookbook() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPageMeta({
      title: 'Lookbook. BlackTribe Fashion.',
      description: 'Behind the lens. Editorial photography and campaign imagery from BlackTribe Fashion.',
      path: '/lookbook',
    });
    return () => clearPageMeta();
  }, []);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch('/api/products?limit=14&sort=newest');
        const json = await res.json();
        if (json.success && json.data) {
          /* Only use products that have images */
          const withImages = json.data.filter((p) => p.images?.length > 0);
          setSections(buildSections(withImages));
        }
      } catch (err) {
        console.error('[Lookbook] fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  /* Scroll reveals — immediately shows above-fold, observes rest */
  useScrollReveal('.lb-reveal', 'lb-reveal--visible', [loading, sections]);

  if (loading) {
    return (
      <article className="lookbook">
        <section className="page-hero lb-hero">
          <div className="page-hero__inner">
            <span className="page-eyebrow">Editorial</span>
            <h1 className="page-headline lb-headline">Lookbook</h1>
            <p className="page-intro page-intro--serif">
              Behind the lens. Campaign imagery from BlackTribe Fashion.
            </p>
          </div>
        </section>
        <div style={{ padding: '40px 20px', maxWidth: 1200, margin: '0 auto' }}>
          <Skeleton type="image" style={{ width: '100%', aspectRatio: '16/9', marginBottom: 24 }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <Skeleton type="image" style={{ width: '100%', aspectRatio: '3/4' }} />
            <Skeleton type="image" style={{ width: '100%', aspectRatio: '3/4' }} />
            <Skeleton type="image" style={{ width: '100%', aspectRatio: '3/4' }} />
          </div>
        </div>
      </article>
    );
  }

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
      {sections.map((section) => {
        if (section.layout === 'editorial') {
          return (
            <section key={section.id} className="lb-editorial lb-reveal">
              <div className="lb-editorial-inner">
                <blockquote className="lb-quote">
                  <p>{section.quote}</p>
                </blockquote>
                <span className="lb-quote-attr">Redefining Luxury Since 2017</span>
              </div>
            </section>
          );
        }

        return (
          <section key={section.id} className="lb-section lb-reveal">
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
