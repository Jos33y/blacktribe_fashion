/*
 * BLACKTRIBE FASHION — MARQUEE
 *
 * The current collection's name comes from /api/homepage, so the strip
 * follows the drop without code changes. Falls back to brand lines when
 * there is no active collection yet.
 */

export default function Marquee({ collectionName }) {
  const items = [
    collectionName || 'New season',
    'Pre-order available',
    'Worldwide delivery',
    'Redefining Luxury',
  ];

  // Duplicate for seamless loop
  const track = [...items, ...items];

  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee__track">
        {track.map((text, i) => (
          <span key={i} className="marquee__item">
            <span className="marquee__text">{text}</span>
            <span className="marquee__dot" />
          </span>
        ))}
      </div>
    </div>
  );
}
