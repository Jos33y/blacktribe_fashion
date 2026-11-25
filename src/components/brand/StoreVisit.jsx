import { STORE, storeLines } from '../../config/store';
import '../../styles/brand/StoreVisit.css';

/* The store block for the Contact page. Drop <StoreVisit /> where it fits. */
export default function StoreVisit() {
  return (
    <section className="store-visit" aria-labelledby="store-visit-title">
      <figure className="store-visit__media">
        <img
          src="/images/store/mask-wall.jpg"
          alt="The BlackTribe mask, backlit in steel on a black stone wall at the store entrance"
          width="960"
          height="1280"
          loading="lazy"
          decoding="async"
          className="store-visit__photo"
        />
        <img
          src="/images/store/window.jpg"
          alt="The BlackTribe mask on the store window, looking out over Lekki"
          width="810"
          height="1080"
          loading="lazy"
          decoding="async"
          className="store-visit__photo store-visit__photo--inset"
        />
      </figure>

      <div className="store-visit__text">
        <p className="store-visit__eyebrow">The store</p>
        <h2 id="store-visit-title" className="store-visit__title">
          Come through, <em>Lagos.</em>
        </h2>
        <p className="store-visit__lede">
          Try the pieces on, see the full collection, meet the tribe.
        </p>
        <address className="store-address store-visit__address">
          <strong>{STORE.place}</strong>
          {storeLines.map((line) => <span key={line}>{line}</span>)}
        </address>
        {STORE.hours && (
          <dl className="store-visit__hours">
            {STORE.hours.map(([days, time]) => (
              <div key={days}><dt>{days}</dt><dd>{time}</dd></div>
            ))}
          </dl>
        )}
        <a
          href={STORE.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="store-visit__cta"
        >
          Get directions
        </a>
      </div>
    </section>
  );
}
