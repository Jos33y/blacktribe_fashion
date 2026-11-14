/*
 * BLACKTRIBE FASHION — HOMEPAGE HERO
 *
 * Full-bleed obsidian hero: one dark, atmospheric image of the lead piece,
 * darkened under a bottom-weighted gradient, headline over it.
 *
 * Text and link come from the current collection (newest active collection,
 * from /api/homepage), so a new drop takes over the hero when its collection
 * is created.
 *
 * Hero image convention: /images/hero/<collection-slug>.jpg in public/.
 * It must be the piece on obsidian (not the white-background shop photo),
 * landscape, ~2400×1350. If the file is missing, the previous hero image
 * is used so the hero never shows a broken image.
 */

import { useState } from 'react';
import { Link } from 'react-router';

const FALLBACK_IMAGE = '/images/crystal-velvet-trucker-back.PNG';

export default function ProductHero({ collection }) {
  const [imgFailed, setImgFailed] = useState(false);

  const slug = collection?.slug;
  const heroSrc = slug && !imgFailed ? `/images/hero/${slug}.jpg` : FALLBACK_IMAGE;

  const eyebrow = collection?.season ? `New Season. ${collection.season}` : 'New Collection';

  return (
    <section className="home-hero" id="home-hero">
      <div className="home-hero__bg">
        <img
          key={heroSrc}
          src={heroSrc}
          alt=""
          className="home-hero__bg-img"
          aria-hidden="true"
          draggable="false"
          fetchPriority="high"
          onError={() => setImgFailed(true)}
        />
      </div>

      <div className="home-hero__overlay" />

      <div className="home-hero__content container">
        <span className="home-hero__eyebrow">{collection ? eyebrow : 'BlackTribe Fashion'}</span>
        <h1 className="home-hero__headline">{collection?.name || 'Redefining Luxury'}</h1>
        {collection?.description && <p className="home-hero__sub">{collection.description}</p>}
        <div className="home-hero__actions">
          <Link
            to={collection ? `/collections/${collection.slug}` : '/shop'}
            className="home-hero__cta home-hero__cta--primary"
          >
            Shop the Drop
          </Link>
          <Link to="/shop" className="home-hero__cta home-hero__cta--secondary">
            Browse All
          </Link>
        </div>
      </div>

      <div className="home-hero__scroll" aria-hidden="true">
        <svg width="16" height="24" viewBox="0 0 16 24" fill="none" stroke="currentColor" strokeWidth="1">
          <path d="M8 4v12M3 12l5 5 5-5" opacity="0.6" />
        </svg>
      </div>
    </section>
  );
}
