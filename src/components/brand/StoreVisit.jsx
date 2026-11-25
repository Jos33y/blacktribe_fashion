import { STORE, storeLines } from '../../config/store';
import '../../styles/brand/StoreVisit.css';

/* Live map of the store. Google's embed needs no API key; it loads only
   when scrolled near, so the Contact page stays fast. */
const MAP_EMBED = `https://www.google.com/maps?q=${encodeURIComponent(
  `${STORE.name}, ${STORE.place}, ${STORE.area}, ${STORE.city}`
)}&z=17&output=embed`;

/* The store block for the Contact page */
export default function StoreVisit() {
  return (
    <section className="store-visit" aria-labelledby="store-visit-title">
      <div className="store-visit__top">
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
            {storeLines.map((line) => <span key={line}>{line}</span>)}
          </address>
          {STORE.hours && (
            <dl className="store-visit__hours">
              {STORE.hours.map(([days, time]) => (
                <div key={days}><dt>{days}</dt><dd>{time}</dd></div>
              ))}
            </dl>
          )}
          <div className="store-visit__actions">
            <a href={STORE.mapsUrl} target="_blank" rel="noopener noreferrer" className="store-visit__cta">
              Get directions
            </a>
            <a href={STORE.reviewUrl} target="_blank" rel="noopener noreferrer" className="store-visit__review">
              Been in? Review us on Google
            </a>
          </div>
        </div>
      </div>

      <div className="store-visit__map">
        <iframe
          src={MAP_EMBED}
          title={`Map: ${STORE.name}, ${STORE.place}, ${STORE.area}, ${STORE.city}`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
        <a href={STORE.mapsUrl} target="_blank" rel="noopener noreferrer" className="store-visit__map-link">
          Open in Google Maps
        </a>
      </div>
    </section>
  );
}
