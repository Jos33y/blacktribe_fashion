/*
 * BLACKTRIBE FASHION — JOURNAL ARTICLE
 *
 * Route: /journal/:slug
 * Drafts open with ?preview=1 (never indexed).
 * Content lives in server/content/journal/ so the server can render the
 * same words for Google and AI assistants.
 */

import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import Blocks from '../../components/journal/Blocks';
import { AccentTitle } from '../../components/journal/Inline';
import Inline from '../../components/journal/Inline';
import { getArticle, sectionsOf, allArticles } from '../../../server/content/journal/index.js';
import { setPageMeta, clearPageMeta } from '../../utils/pageMeta';
import NotFound from '../NotFound';
import '../../styles/journal/Journal.css';

function longDate(iso) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function ReadingBar() {
  const [p, setP] = useState(0);
  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        setP(max > 0 ? Math.min(1, window.scrollY / max) : 0);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(frame); };
  }, []);
  return <div className="jr-progress" aria-hidden="true"><span style={{ transform: `scaleX(${p})` }} /></div>;
}

export default function JournalArticle() {
  const { slug } = useParams();
  const [search] = useSearchParams();
  const preview = search.get('preview') === '1';
  const a = getArticle(slug, { includeDrafts: preview });

  useEffect(() => {
    if (!a) return undefined;
    setPageMeta({
      title: a.seoTitle || `${a.title}. BlackTribe Journal.`,
      description: a.description,
      path: `/journal/${a.slug}`,
      image: a.hero?.src?.startsWith('/') ? `https://blacktribefashion.com${a.hero.src}` : a.hero?.src,
      type: 'article',
    });
    return () => clearPageMeta();
  }, [a]);

  if (!a) return <NotFound />;

  const sections = sectionsOf(a);
  const related = (a.related || [])
    .map((s) => getArticle(s, { includeDrafts: preview }))
    .filter(Boolean)
    .concat(allArticles({ includeDrafts: preview }).filter((x) => x.slug !== a.slug && !(a.related || []).includes(x.slug)))
    .slice(0, 2);

  return (
    <article className="jr">
      <ReadingBar />
      {a.status !== 'published' && (
        <p className="jr-draft" role="status">Draft preview. Not public, not indexed.</p>
      )}

      <header className="jr-hero">
        <img
          className="jr-hero__img"
          src={a.hero.src}
          alt={a.hero.alt}
          style={a.hero.focus ? { objectPosition: a.hero.focus } : undefined}
          fetchpriority="high"
        />
        <div className="jr-hero__shade" aria-hidden="true" />
        <div className="jr-hero__inner">
          <p className="jr-kicker">
            <Link to="/journal">Journal</Link><span aria-hidden="true"> / </span>{a.kicker}
          </p>
          <h1 className="jr-title"><AccentTitle title={a.title} accent={a.accent} /></h1>
          {a.dek && <p className="jr-dek">{a.dek}</p>}
          <p className="jr-meta">
            <time dateTime={a.updated || a.published}>{longDate(a.updated || a.published)}</time>
            <span aria-hidden="true">·</span>
            <span>{a.readMins} min read</span>
            <span aria-hidden="true">·</span>
            <span>{a.author}</span>
          </p>
        </div>
        {a.hero.caption && <p className="jr-hero__caption">{a.hero.caption}</p>}
      </header>

      <div className="jr-body">
        {a.summary?.length > 0 && (
          <section className="jr-summary" aria-labelledby="jr-summary-title">
            <h2 id="jr-summary-title" className="jr-summary__label">The short version</h2>
            <ul>{a.summary.map((s, i) => <li key={i}><Inline text={s} /></li>)}</ul>
          </section>
        )}

        {sections.length > 2 && (
          <nav className="jr-toc" aria-label="In this piece">
            <span className="jr-toc__label">In this piece</span>
            <ol>
              {sections.map((s) => <li key={s.id}><a href={`#${s.id}`}>{s.text}</a></li>)}
            </ol>
          </nav>
        )}

        <Blocks blocks={a.blocks} />

        {a.faq?.length > 0 && (
          <section className="jr-faq" aria-labelledby="jr-faq-title">
            <h2 id="jr-faq-title" className="jr-h2">Questions people ask</h2>
            {a.faq.map((f, i) => (
              <details key={i} className="jr-faq__item">
                <summary>{f.q}</summary>
                <p><Inline text={f.a} /></p>
              </details>
            ))}
          </section>
        )}

        {a.sources?.length > 0 && (
          <section className="jr-sources" aria-labelledby="jr-sources-title">
            <h2 id="jr-sources-title" className="jr-sources__label">Sources</h2>
            <ol>
              {a.sources.map((s, i) => (
                <li key={i}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a></li>
              ))}
            </ol>
          </section>
        )}
      </div>

      {related.length > 0 && (
        <aside className="jr-related" aria-labelledby="jr-related-title">
          <h2 id="jr-related-title" className="jr-related__label">Keep reading</h2>
          <div className="jr-related__grid">
            {related.map((r) => (
              <Link key={r.slug} to={`/journal/${r.slug}${preview ? '?preview=1' : ''}`} className="jr-card">
                <span className="jr-card__img">
                  <img src={r.hero.src} alt="" loading="lazy" style={r.hero.focus ? { objectPosition: r.hero.focus } : undefined} />
                </span>
                <span className="jr-card__kicker">{r.kicker}</span>
                <span className="jr-card__title"><AccentTitle title={r.title} accent={r.accent} /></span>
              </Link>
            ))}
          </div>
        </aside>
      )}
    </article>
  );
}
