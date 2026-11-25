/*
 * BLACKTRIBE JOURNAL — ARTICLE BLOCKS
 *
 * An article is a list of blocks. Each type has one job, so a piece never
 * becomes a wall of text: break every few paragraphs with a picture, a
 * look, a quote, a table or a timeline.
 *
 *   lede      opening paragraph, larger
 *   h2        section heading (id = anchor)
 *   p         paragraph
 *   list      bullet list
 *   rules     numbered short rules (3 is ideal)
 *   look      outfit card: number, picture, wear / skip, tip, pieces
 *   brand     profile card: number, name, founded, people, known for
 *   quote     pull quote
 *   image     picture (size: full | wide | inset)
 *   facts     key / value card
 *   table     simple table
 *   timeline  dates down a line
 *   products  live pieces from the shop
 *   callout   store / shop band with buttons
 */

import { Link } from 'react-router';
import Inline from './Inline';
import ProductStrip from './ProductStrip';

function Img({ src, alt, focus, className, eager = false }) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={focus ? { objectPosition: focus } : undefined}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
    />
  );
}

function Button({ href, children, variant = 'solid' }) {
  const cls = `jr-btn jr-btn--${variant}`;
  return href.startsWith('/')
    ? <Link to={href} className={cls}>{children}</Link>
    : <a href={href} className={cls} target="_blank" rel="noopener noreferrer">{children}</a>;
}

function Block({ b, flip = false }) {
  switch (b.type) {
    case 'lede':
      return <p className="jr-lede"><Inline text={b.text} /></p>;

    case 'h2':
      return <h2 id={b.id} className="jr-h2"><Inline text={b.text} /></h2>;

    case 'p':
      return <p className="jr-p"><Inline text={b.text} /></p>;

    case 'list':
      return (
        <ul className="jr-list">
          {b.items.map((item, i) => <li key={i}><Inline text={item} /></li>)}
        </ul>
      );

    case 'rules':
      return (
        <ol className="jr-rules">
          {b.items.map(([head, body], i) => (
            <li key={i} className="jr-rules__item">
              <span className="jr-rules__n" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
              <strong className="jr-rules__head">{head}</strong>
              <span className="jr-rules__body"><Inline text={body} /></span>
            </li>
          ))}
        </ol>
      );

    case 'look':
      return (
        <section className={`jr-look${flip ? ' jr-look--flip' : ''}`} aria-labelledby={`look-${b.n}`}>
          <div className="jr-look__media">
            {b.image && <Img {...b.image} className="jr-look__img" />}
            <span className="jr-look__n" aria-hidden="true">{b.n}</span>
          </div>
          <div className="jr-look__body">
            <h3 id={`look-${b.n}`} className="jr-look__name"><Inline text={b.name} /></h3>
            {b.for && <p className="jr-look__for"><span>For</span> {b.for}</p>}
            <div className="jr-look__cols">
              {b.wear?.length > 0 && (
                <div>
                  <h4 className="jr-look__label">Wear</h4>
                  <ul className="jr-look__wear">{b.wear.map((w, i) => <li key={i}><Inline text={w} /></li>)}</ul>
                </div>
              )}
              {b.avoid?.length > 0 && (
                <div>
                  <h4 className="jr-look__label">Skip</h4>
                  <ul className="jr-look__avoid">{b.avoid.map((w, i) => <li key={i}><Inline text={w} /></li>)}</ul>
                </div>
              )}
            </div>
            {b.tip && <p className="jr-look__tip"><Inline text={b.tip} /></p>}
            {(b.products?.length || b.collection) && (
              <ProductStrip slugs={b.products || []} collection={b.collection} limit={3} title="Pieces for this look" compact />
            )}
          </div>
        </section>
      );

    case 'brand':
      return (
        <section className={`jr-brand${b.us ? ' jr-brand--us' : ''}`} aria-labelledby={`brand-${b.n}`}>
          <span className="jr-brand__n" aria-hidden="true">{b.n}</span>
          <div className="jr-brand__main">
            <h3 id={`brand-${b.n}`} className="jr-brand__name">{b.name}</h3>
            <dl className="jr-brand__meta">
              {b.founded && <div><dt>Founded</dt><dd>{b.founded}</dd></div>}
              {b.founders && <div><dt>{b.peopleLabel || 'Founded by'}</dt><dd>{b.founders}</dd></div>}
              {b.known && <div><dt>Known for</dt><dd>{b.known}</dd></div>}
            </dl>
            <p className="jr-brand__text"><Inline text={b.text} /></p>
            {b.handle && (
              <a className="jr-brand__handle" href={`https://www.instagram.com/${b.handle}/`} target="_blank" rel="noopener noreferrer">@{b.handle}</a>
            )}
          </div>
        </section>
      );

    case 'quote':
      return (
        <figure className="jr-quote">
          <blockquote><Inline text={b.text} /></blockquote>
          {b.by && <figcaption>{b.by}</figcaption>}
        </figure>
      );

    case 'image':
      return (
        <figure className={`jr-figure jr-figure--${b.size || 'wide'}`}>
          <Img src={b.src} alt={b.alt} focus={b.focus} className="jr-figure__img" />
          {b.caption && <figcaption className="jr-caption">{b.caption}</figcaption>}
        </figure>
      );

    case 'facts':
      return (
        <dl className="jr-facts">
          {b.items.map(([k, v], i) => (
            <div key={i} className="jr-facts__row"><dt>{k}</dt><dd><Inline text={v} /></dd></div>
          ))}
        </dl>
      );

    case 'table':
      return (
        <div className="jr-table-wrap" role="region" aria-label={b.caption || 'Table'} tabIndex={0}>
          <table className="jr-table">
            {b.caption && <caption>{b.caption}</caption>}
            <thead><tr>{b.head.map((h, i) => <th key={i} scope="col">{h}</th>)}</tr></thead>
            <tbody>
              {b.rows.map((row, r) => (
                <tr key={r}>{row.map((cell, c) => (c === 0 ? <th key={c} scope="row">{cell}</th> : <td key={c}><Inline text={cell} /></td>))}</tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'timeline':
      return (
        <ol className="jr-timeline">
          {b.items.map(([when, what], i) => (
            <li key={i}><span className="jr-timeline__when">{when}</span><span className="jr-timeline__what"><Inline text={what} /></span></li>
          ))}
        </ol>
      );

    case 'products':
      return <ProductStrip slugs={b.slugs || []} collection={b.collection} limit={b.limit || 4} title={b.title} link={b.link} />;

    case 'callout':
      return (
        <aside className="jr-callout">
          <h2 className="jr-callout__title"><Inline text={b.title} /></h2>
          <p className="jr-callout__text"><Inline text={b.text} /></p>
          <div className="jr-callout__actions">
            {b.cta && <Button href={b.cta.href}>{b.cta.label}</Button>}
            {b.secondary && <Button href={b.secondary.href} variant="ghost">{b.secondary.label}</Button>}
          </div>
        </aside>
      );

    default:
      return null;
  }
}

export default function Blocks({ blocks }) {
  let looks = 0;
  return blocks.map((b, i) => {
    const flip = b.type === 'look' ? looks++ % 2 === 1 : false;
    return <Block key={i} b={b} flip={flip} />;
  });
}
