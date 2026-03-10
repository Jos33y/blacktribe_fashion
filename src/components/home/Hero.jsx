import Button from '../ui/Button';

export default function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-heading">
      <div className="hero__inner container">
        <span className="hero__eyebrow">New Season</span>
        <h1 id="hero-heading" className="hero__heading">
          Shadow Collection
        </h1>
        <p className="hero__subtext">
          Sixteen pieces. Obsidian textures. Crystal details. Available to pre-order now.
        </p>
        <div className="hero__actions">
          <Button to="/collections/shadow-collection" variant="primary" size="large">
            Pre-Order Now
          </Button>
          <Button to="/collections/shadow-collection" variant="secondary" size="large">
            View Collection
          </Button>
        </div>
      </div>
    </section>
  );
}
