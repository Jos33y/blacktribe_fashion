export default function InfoStrip() {
  return (
    <div className="info-strip">
      <div className="info-strip__inner container">
        <span className="info-strip__item">Free shipping over ₦50,000</span>
        <span className="info-strip__divider" aria-hidden="true" />
        <span className="info-strip__item">Pre-order available</span>
        <span className="info-strip__divider" aria-hidden="true" />
        <span className="info-strip__item">Worldwide delivery</span>
      </div>
    </div>
  );
}
