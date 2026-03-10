export default function EditorialSplit() {
  return (
    <section className="editorial" aria-labelledby="editorial-quote">
      <div className="editorial__inner container">
        <div className="editorial__image">
          {/* Campaign image slot — replace with real editorial image */}
          <div className="editorial__image-placeholder" />
        </div>
        <div className="editorial__content">
          <blockquote id="editorial-quote" className="editorial__quote">
            Not just clothing. A statement of where you come from and where you are going.
          </blockquote>
          <p className="editorial__attribution">
            Redefining Luxury Since 2018
          </p>
        </div>
      </div>
    </section>
  );
}
