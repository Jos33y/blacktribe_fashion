/*
 * BLACKTRIBE FASHION — JOURNAL INDEX
 *
 * Route: /journal  (?preview=1 also lists drafts)
 * Newest piece leads big. Everything else sits in a grid.
 */

import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router';
import { allArticles } from '../../../server/content/journal/index.js';
import { AccentTitle } from '../../components/journal/Inline';
import { setPageMeta, clearPageMeta } from '../../utils/pageMeta';
import '../../styles/journal/Journal.css';

function Card({ a, lead = false, preview }) {
  return (
    <Link to={`/journal/${a.slug}${preview ? '?preview=1' : ''}`} className={`jr-card${lead ? ' jr-card--lead' : ''}`}>
      <span className="jr-card__img">
        <img
          src={a.hero.src}
          alt={a.hero.alt}
          loading={lead ? 'eager' : 'lazy'}
          style={a.hero.focus ? { objectPosition: a.hero.focus } : undefined}
        />
      </span>
      <span className="jr-card__text">
        <span className="jr-card__kicker">
          {a.kicker}{a.status !== 'published' ? ' · Draft' : ''}
        </span>
        <span className="jr-card__title"><AccentTitle title={a.title} accent={a.accent} /></span>
        {a.dek && <span className="jr-card__dek">{a.dek}</span>}
        <span className="jr-card__meta">{a.readMins} min read</span>
      </span>
    </Link>
  );
}

export default function JournalIndex() {
  const [search] = useSearchParams();
  const preview = search.get('preview') === '1';
  const list = allArticles({ includeDrafts: preview });

  useEffect(() => {
    setPageMeta({
      title: 'Journal. BlackTribe Fashion.',
      description: 'Style guides, culture and the Lagos scene. The BlackTribe Journal, written in Lagos.',
      path: '/journal',
    });
    return () => clearPageMeta();
  }, []);

  const [lead, ...rest] = list;

  return (
    <div className="jr-index">
      <header className="jr-index__head">
        <p className="jr-kicker">From Lagos</p>
        <h1 className="jr-index__title">The <em className="jr-accent">Journal</em></h1>
        <p className="jr-index__intro">Style, culture and the city. What to wear, where to go, and the stories behind the pieces.</p>
      </header>

      {!lead ? (
        <p className="jr-index__empty">New pieces are on the way.</p>
      ) : (
        <>
          <Card a={lead} lead preview={preview} />
          {rest.length > 0 && (
            <div className="jr-index__grid">
              {rest.map((a) => <Card key={a.slug} a={a} preview={preview} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
