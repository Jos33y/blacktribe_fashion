/*
 * BLACKTRIBE FASHION — EDITORIAL PAGE RENDERER
 *
 * Renders one magazine page. Same component for the web reader,
 * the print view, and the admin preview, so all three always match.
 *
 * Geometry (see EditorialPage.css):
 *   .ed-frame  = A4 trim (210×297), clips the bleed on screen
 *   .ed-sheet  = A4 + 3mm bleed (216×303), the size that prints
 *   All sizes inside are in "mm" via --mm (container units), so the page
 *   scales to any width and prints at exactly 216×303mm.
 *
 * Props:
 *   page:         { id, template, tone, contact, fields }
 *   number:       page number (1-based), used in the folio
 *   feature:      { title, issue_label }
 *   products:     { [id]: { id, name, slug, price, image } }
 *   interactive:  product pieces link to their pages (default true;
 *                 admin preview passes false so taps don't leave the editor)
 *   onOverflow?:  (overflowing: boolean) => void — text doesn't fit the page
 */

import { useRef, useLayoutEffect } from 'react';
import Accent from './Accent';
import QRCode from './QRCode';
import { CONTACT, formatNaira, paragraphs, plainText, lines } from './templates';
import '../../styles/editorial/EditorialPage.css';

function Folio({ number, feature }) {
  return (
    <footer className="ed-folio" aria-hidden="true">
      <span>BLACKTRIBE FASHION{feature?.issue_label ? `  /  ${feature.issue_label}` : ''}</span>
      <span>{String(number).padStart(2, '0')}</span>
    </footer>
  );
}

function ContactStrip() {
  return (
    <div className="ed-contact">
      <div className="ed-contact__items">
        <span className="ed-contact__item">
          <span className="ed-contact__label">Shop</span>
          {CONTACT.site}
        </span>
        <span className="ed-contact__item">
          <span className="ed-contact__label">Email</span>
          {CONTACT.email}
        </span>
        <span className="ed-contact__item">
          <span className="ed-contact__label">Instagram</span>
          {CONTACT.instagram}
        </span>
      </div>
      <QRCode value={CONTACT.siteUrl} className="ed-contact__qr" label={`QR code: ${CONTACT.site}`} />
    </div>
  );
}

function Body({ text }) {
  return paragraphs(text).map((p, i) => <p key={i}>{p}</p>);
}

function Img({ src, alt = '', className = '' }) {
  if (!src) return <div className={`ed-img ed-img--empty ${className}`} aria-hidden="true" />;
  return <img src={src} alt={alt} className={`ed-img ${className}`} loading="eager" decoding="async" />;
}


/* ═══ TEMPLATES ═══ */

function Brand({ f, fitRef }) {
  const points = lines(f.points, 5);
  return (
    <div className="ed-brand">
      <header className="ed-brand__top">
        {/* Brand guide: the mask and wordmark never sit side by side.
            The wordmark stands alone here, with the tagline beneath. */}
        <div className="ed-brand__mark">
          <span className="ed-brand__wordmark">BLACKTRIBE</span>
          <span className="ed-brand__tagline">Redefining Luxury</span>
        </div>
        {f.mantra && <span className="ed-brand__mantra">{f.mantra}</span>}
      </header>

      <div className="ed-brand__media">
        <Img src={f.image} alt="BlackTribe Fashion" />
      </div>

      <div className="ed-brand__grid">
        <div className="ed-brand__lead">
          {f.heading && <h2 className="ed-heading ed-heading--large"><Accent text={f.heading} /></h2>}
          {f.intro && <p className="ed-brand__intro ed-fit" ref={fitRef}>{f.intro}</p>}
        </div>
        {points.length > 0 && (
          <ol className="ed-brand__points">
            {points.map((pt, i) => (
              <li key={i}>
                <span className="ed-brand__num">{String(i + 1).padStart(2, '0')}</span>
                <span>{pt}</span>
              </li>
            ))}
          </ol>
        )}
      </div>

      {f.cta && <p className="ed-brand__cta"><Accent text={f.cta} /></p>}
    </div>
  );
}

function Cover({ f, feature, showContact }) {
  return (
    <>
      <Img src={f.image} alt={plainText(f.title || feature?.title)} className="ed-img--bleed" />
      <div className="ed-cover__shade" aria-hidden="true" />
      <div className="ed-cover__content">
        <div className="ed-cover__mast">BLACKTRIBE</div>
        <div className="ed-cover__bottom">
          {f.kicker && <span className="ed-kicker">{f.kicker}</span>}
          {f.title && <h2 className="ed-cover__title"><Accent text={f.title} /></h2>}
          {f.dek && <p className="ed-cover__dek">{f.dek}</p>}
          {!showContact && <span className="ed-cover__site">{CONTACT.site}</span>}
        </div>
      </div>
    </>
  );
}

function FullImage({ f }) {
  return (
    <>
      <Img src={f.image} alt={f.caption || ''} className="ed-img--bleed" />
      {(f.caption || f.credit) && (
        <div className="ed-image__caption">
          {f.caption && <p>{f.caption}</p>}
          {f.credit && <span className="ed-credit">{f.credit}</span>}
        </div>
      )}
    </>
  );
}

function Split({ f, fitRef }) {
  return (
    <div className={`ed-split ${f.side === 'right' ? 'ed-split--right' : ''}`}>
      <div className="ed-split__media">
        <Img src={f.image} alt={plainText(f.heading)} />
      </div>
      <div className="ed-split__text">
        {f.kicker && <span className="ed-kicker">{f.kicker}</span>}
        {f.heading && <h2 className="ed-heading"><Accent text={f.heading} /></h2>}
        <div className="ed-body ed-fit" ref={fitRef}><Body text={f.body} /></div>
      </div>
    </div>
  );
}

function Piece({ p, interactive }) {
  const url = `${CONTACT.siteUrl}/product/${p.slug}`;
  const inner = (
    <>
      <div className="ed-piece__canvas">
        {p.image && <img src={p.image} alt={p.name} loading="eager" decoding="async" />}
      </div>
      <figcaption className="ed-piece__info">
        <span className="ed-piece__text">
          <span className="ed-piece__name">{p.name}</span>
          <span className="ed-piece__price">{formatNaira(p.price)}</span>
          <span className="ed-piece__url">{CONTACT.site}/product/{p.slug}</span>
        </span>
        <QRCode value={url} className="ed-piece__qr" label={`QR code: ${p.name}`} />
      </figcaption>
    </>
  );

  return (
    <figure className="ed-piece">
      {interactive
        ? <a href={`/product/${p.slug}`} className="ed-piece__link">{inner}</a>
        : <div className="ed-piece__link">{inner}</div>}
    </figure>
  );
}

function Products({ f, products = {}, interactive, fitRef }) {
  const items = (f.products || []).map((id) => products[id]).filter(Boolean);
  return (
    <div className="ed-products">
      <header className="ed-products__head">
        {f.heading && <h2 className="ed-heading"><Accent text={f.heading} /></h2>}
        {f.intro && <p className="ed-products__intro ed-fit" ref={fitRef}>{f.intro}</p>}
      </header>
      <div className={`ed-products__grid ed-products__grid--${Math.max(items.length, 1)}`}>
        {items.length === 0 && <div className="ed-products__empty">Pick pieces to show here.</div>}
        {items.map((p) => <Piece key={p.id} p={p} interactive={interactive} />)}
      </div>
    </div>
  );
}

function Statement({ f }) {
  return (
    <div className="ed-statement">
      {f.quote && <blockquote className="ed-statement__quote"><p>{f.quote}</p></blockquote>}
      {f.attribution && <span className="ed-statement__attr">{f.attribution}</span>}
    </div>
  );
}

function Story({ f, fitRef }) {
  return (
    <div className="ed-story">
      <header className="ed-story__head">
        {f.kicker && <span className="ed-kicker">{f.kicker}</span>}
        {f.heading && <h2 className="ed-heading ed-heading--large"><Accent text={f.heading} /></h2>}
      </header>
      {f.image && (
        <div className="ed-story__media"><Img src={f.image} alt={plainText(f.heading)} /></div>
      )}
      <div className="ed-body ed-story__body ed-fit" ref={fitRef}><Body text={f.body} /></div>
    </div>
  );
}

const RENDERERS = {
  brand: Brand,
  cover: Cover,
  image: FullImage,
  split: Split,
  products: Products,
  statement: Statement,
  story: Story,
};

/* Templates that carry the running folio (cover and brand page don't) */
const NO_FOLIO = ['cover', 'brand'];


/* ═══ COMPONENT ═══ */

export default function EditorialPage({ page, number = 1, feature, products, interactive = true, onOverflow }) {
  const fitRef = useRef(null);
  const Renderer = RENDERERS[page?.template];

  /* Report when text is longer than the page can hold */
  useLayoutEffect(() => {
    if (!onOverflow) return;
    const el = fitRef.current;
    if (!el) { onOverflow(false); return; }

    /* Columns overflow sideways (extra columns), single blocks overflow down */
    const check = () => onOverflow(
      el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1
    );
    check();

    const ro = new ResizeObserver(check);
    ro.observe(el);
    document.fonts?.ready?.then(check);
    return () => ro.disconnect();
  }, [page, onOverflow]);

  if (!Renderer) return null;

  const tone = page.template === 'cover' || page.template === 'image' ? 'dark' : page.tone || 'dark';
  const showContact = page.template === 'brand' || !!page.contact;

  return (
    <div className="ed-frame">
      <div className="ed-sheet">
        <article
          className={`ed-page ed-page--${page.template} ed-tone--${tone} ${showContact ? 'ed-page--contact' : ''}`}
          aria-label={`Page ${number}`}
        >
          <Renderer
            f={page.fields || {}}
            products={products}
            feature={feature}
            interactive={interactive}
            showContact={showContact}
            fitRef={fitRef}
          />
          {showContact && <ContactStrip />}
          {!NO_FOLIO.includes(page.template) && <Folio number={number} feature={feature} />}
        </article>
      </div>
    </div>
  );
}
