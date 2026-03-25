export default function Marquee() {
  const items = [
    'New Season',
    'Pre-order available',
    'Worldwide delivery',
    'Shadow Collection SS26',
    'Limited pieces',
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