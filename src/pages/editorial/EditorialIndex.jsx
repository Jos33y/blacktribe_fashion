/*
 * BLACKTRIBE FASHION — EDITORIAL INDEX
 *
 * Lists published features as magazine covers, newest first.
 * Route: /editorial
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import Skeleton from '../../components/ui/Skeleton';
import Accent from '../../components/editorial/Accent';
import { setPageMeta, clearPageMeta } from '../../utils/pageMeta';
import '../../styles/pages/Editorial.css';

export default function EditorialIndex() {
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPageMeta({
      title: 'Editorial. BlackTribe Fashion.',
      description: 'Stories, drops and the people behind them. The BlackTribe Fashion editorial.',
      path: '/editorial',
    });
    return () => clearPageMeta();
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/editorial');
        const json = await res.json();
        if (json.success) setFeatures(json.data || []);
      } catch (err) {
        console.error('[Editorial] fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <article className="editorial">
      <section className="page-hero">
        <div className="page-hero__inner">
          <span className="page-eyebrow">Journal</span>
          <h1 className="page-headline ed-index-headline">Editorial</h1>
          <p className="page-intro page-intro--serif">
            Stories, drops and the people behind them.
          </p>
        </div>
      </section>

      {loading ? (
        <div className="ed-index">
          {[0, 1, 2].map((i) => (
            <div key={i}>
              <Skeleton type="image" style={{ width: '100%', aspectRatio: '210/297', marginBottom: 16 }} />
              <Skeleton type="text" style={{ width: '40%', height: 12, marginBottom: 8 }} />
              <Skeleton type="text" style={{ width: '80%', height: 20 }} />
            </div>
          ))}
        </div>
      ) : features.length === 0 ? (
        <p className="ed-empty">The first issue is on its way.</p>
      ) : (
        <div className="ed-index">
          {features.map((f, i) => (
            <Link key={f.id} to={`/editorial/${f.slug}`} className="ed-card">
              <div className="ed-card__cover">
                {f.cover_image && (
                  <img src={f.cover_image} alt="" loading={i < 3 ? 'eager' : 'lazy'} />
                )}
              </div>
              {f.issue_label && <span className="ed-card__issue">{f.issue_label}</span>}
              <h2 className="ed-card__title"><Accent text={f.title} /></h2>
              {f.dek && <p className="ed-card__dek">{f.dek}</p>}
            </Link>
          ))}
        </div>
      )}
    </article>
  );
}
