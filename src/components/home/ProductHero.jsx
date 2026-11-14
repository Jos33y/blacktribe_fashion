/*
 * BLACKTRIBE FASHION — HOMEPAGE HERO
 *
 * Driven by the current collection (newest active collection, from
 * /api/homepage). Name, description, link and image all come from data,
 * so a new drop takes over the hero the moment its collection is created.
 *
 * Layout: product on a white canvas inside the obsidian frame (the brand's
 * "products on white canvas, dark frame" rule). Product photography is shot
 * on white, so it is shown as-is rather than darkened behind text.
 *   Mobile:  canvas on top, text below
 *   Desktop: text left, canvas right
 *
 * The canvas starts below the navbar, so the transparent navbar always sits
 * on obsidian and stays legible.
 */

import { Link } from 'react-router';
import Skeleton from '../ui/Skeleton';

export default function ProductHero({ collection, loading }) {
  const ready = !loading && collection;

  const eyebrow = collection?.season ? `New collection. ${collection.season}` : 'New collection';
  const count = collection?.product_count;

  return (
    <section className="home-hero" id="home-hero" aria-label={ready ? collection.name : 'Current collection'}>
      <div className="home-hero__canvas">
        {ready && collection.hero_image ? (
          <img
            src={collection.hero_image}
            alt={collection.name}
            className="home-hero__canvas-img"
            fetchPriority="high"
            draggable="false"
          />
        ) : (
          <div className="home-hero__canvas-empty" aria-hidden="true" />
        )}
      </div>

      <div className="home-hero__content container">
        {ready ? (
          <>
            <span className="home-hero__eyebrow">
              {eyebrow}{count ? `. ${count} pieces` : ''}
            </span>
            <h1 className="home-hero__headline">{collection.name}</h1>
            {collection.description && <p className="home-hero__sub">{collection.description}</p>}
            <div className="home-hero__actions">
              <Link to={`/collections/${collection.slug}`} className="home-hero__cta home-hero__cta--primary">
                Shop the Drop
              </Link>
              <Link to="/shop" className="home-hero__cta home-hero__cta--secondary">
                Browse All
              </Link>
            </div>
          </>
        ) : loading ? (
          <>
            <Skeleton type="text" style={{ width: 140, height: 10, marginBottom: 14 }} />
            <Skeleton type="text" style={{ width: '70%', height: 56, marginBottom: 16 }} />
            <Skeleton type="text" style={{ width: '85%', height: 14, marginBottom: 28 }} />
          </>
        ) : (
          /* No active collection: keep the hero useful */
          <>
            <span className="home-hero__eyebrow">BlackTribe Fashion</span>
            <h1 className="home-hero__headline">Redefining Luxury</h1>
            <div className="home-hero__actions">
              <Link to="/shop" className="home-hero__cta home-hero__cta--primary">Shop All</Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
