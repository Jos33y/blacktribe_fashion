/*
 * BLACKTRIBE FASHION — EDITORIAL FEATURE (web reader)
 *
 * Route: /editorial/:slug
 *
 * Two ways to read, switched at the top (Flip is the default):
 *   Flip  the magazine as a flipbook: spreads on wide screens, one page
 *         at a time on phones, pages turning on a 3D hinge (FlipBook.jsx)
 *   Read  the pages stacked; on phones they reflow into a readable column
 * The choice lives in the URL (?view=read), so a shared link opens the same way.
 * "Download print PDF" opens the print view at /editorial/:slug/print.
 */

import { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router';
import EditorialPage from '../../components/editorial/EditorialPage';
import FlipBook from '../../components/editorial/FlipBook';
import Accent from '../../components/editorial/Accent';
import { plainText } from '../../components/editorial/templates';
import { setPageMeta, clearPageMeta } from '../../utils/pageMeta';
import { api } from '../../utils/api';
import '../../styles/pages/Editorial.css';

export default function EditorialFeature() {
  const { slug } = useParams();
  const [feature, setFeature] = useState(null);
  const [status, setStatus] = useState('loading'); /* loading | ready | missing */
  const [params, setParams] = useSearchParams();
  const view = params.get('view') === 'read' ? 'read' : 'flip';

  const setView = (next) => {
    const nextParams = new URLSearchParams(params);
    if (next === 'read') nextParams.set('view', 'read');
    else nextParams.delete('view');
    setParams(nextParams, { replace: true });
  };

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');

    /* api() sends the admin token when signed in, so drafts preview here too */
    api(`/api/editorial/${encodeURIComponent(slug)}`)
      .then((json) => {
        if (cancelled) return;
        setFeature(json.data);
        setStatus('ready');
      })
      .catch(() => { if (!cancelled) setStatus('missing'); });

    return () => { cancelled = true; };
  }, [slug]);

  useEffect(() => {
    if (!feature) return;
    setPageMeta({
      title: `${plainText(feature.title)}. BlackTribe Fashion.`,
      description: feature.dek || 'A BlackTribe Fashion editorial feature.',
      path: `/editorial/${feature.slug}`,
      image: feature.cover_image || undefined,
      type: 'article',
    });
    return () => clearPageMeta();
  }, [feature]);

  if (status === 'loading') {
    return (
      <article className="editorial">
        <section className="page-hero">
          <div className="page-hero__inner">
            <span className="page-eyebrow">Editorial</span>
          </div>
        </section>
        <div className="ed-reader">
          <div className="ed-skeleton-page" />
        </div>
      </article>
    );
  }

  if (status === 'missing') {
    return (
      <article className="editorial">
        <section className="page-hero">
          <div className="page-hero__inner">
            <span className="page-eyebrow">Editorial</span>
            <h1 className="page-headline ed-feature-headline">Not found</h1>
            <p className="page-intro page-intro--serif">This feature has moved or is no longer available.</p>
          </div>
        </section>
        <div className="ed-feature-actions">
          <Link to="/editorial">All features</Link>
        </div>
      </article>
    );
  }

  const pages = feature.pages || [];

  return (
    <article className="editorial">
      <section className="page-hero">
        <div className="page-hero__inner">
          <span className="page-eyebrow">
            {feature.issue_label || 'Editorial'}
            {feature.status !== 'published' && '  /  Draft preview'}
          </span>
          <h1 className="page-headline ed-feature-headline"><Accent text={feature.title} /></h1>
          {feature.dek && <p className="page-intro page-intro--serif">{feature.dek}</p>}
          <div className="ed-viewswitch" role="group" aria-label="How to read">
            <button type="button" aria-pressed={view === 'flip'} onClick={() => setView('flip')}>Flip</button>
            <button type="button" aria-pressed={view === 'read'} onClick={() => setView('read')}>Read</button>
          </div>
        </div>
      </section>

      {view === 'flip' ? (
        <FlipBook pages={pages} feature={feature} products={feature.products} />
      ) : (
        <div className="ed-reader">
          {pages.map((page, i) => (
            <EditorialPage
              key={page.id}
              page={page}
              number={i + 1}
              feature={feature}
              products={feature.products}
            />
          ))}
        </div>
      )}

      <div className="ed-feature-actions">
        <Link to={`/editorial/${feature.slug}/print`}>Download print PDF</Link>
        <Link to="/shop">Shop the pieces</Link>
        <p className="ed-feature-actions__note">
          The print PDF is A4 with 3mm bleed, ready for magazine layout.
        </p>
      </div>
    </article>
  );
}
