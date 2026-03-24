import { Link } from 'react-router';

export default function ProductHero() {
  return (
    <section className="home-hero" id="home-hero">
      {/* Crystal Velvet Trucker back — dark velvet + crystals blend with obsidian palette */}
      <div className="home-hero__bg">
        <img
          src="/images/crystal-velvet-trucker-back.PNG"
          alt=""
          className="home-hero__bg-img"
          aria-hidden="true"
          draggable="false"
        />
      </div>

      <div className="home-hero__overlay" />

      <div className="home-hero__content container">
        <span className="home-hero__eyebrow">New Season — SS26</span>
        <h1 className="home-hero__headline">Shadow<br />Collection</h1>
        <p className="home-hero__sub">Crystal-encrusted outerwear. Hand-set details. Limited pieces. Available to pre-order now.</p>
        <div className="home-hero__actions">
          <Link to="/collections/shadow-collection" className="home-hero__cta home-hero__cta--primary">
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
