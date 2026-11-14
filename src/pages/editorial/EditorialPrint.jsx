/*
 * BLACKTRIBE FASHION — EDITORIAL PRINT VIEW
 *
 * Route: /editorial/:slug/print   (outside StoreLayout: no navbar/footer)
 *
 * Shows every page as a full 216×303mm sheet (A4 + 3mm bleed) with a
 * dashed trim guide on screen. "Save as PDF" calls window.print();
 * the @page rules in Editorial.css set the sheet size and zero margins,
 * so the PDF comes out press-ready: one sheet per page, bleed included.
 *
 * The print button stays disabled until every image has loaded, so a
 * slow connection can't produce a PDF with blank photos.
 *
 * Drafts: admins with the 'collections' permission can print drafts
 * (the API checks the token sent by api()).
 *
 * PDF filename: browsers name the saved PDF after document.title, so the
 * title is swapped just before printing (button or Ctrl+P) to
 *   BlackTribe_Issue-01_born-in-lagos_2026-11-14_1430
 * and restored afterwards.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router';
import EditorialPage from '../../components/editorial/EditorialPage';
import { plainText } from '../../components/editorial/templates';
import { api } from '../../utils/api';
import '../../styles/pages/Editorial.css';

export default function EditorialPrint() {
  const { slug } = useParams();
  const [feature, setFeature] = useState(null);
  const [status, setStatus] = useState('loading'); /* loading | ready | missing */
  const [imagesReady, setImagesReady] = useState(false);
  const pagesRef = useRef(null);
  const screenTitle = useRef('');

  useEffect(() => {
    let cancelled = false;
    api(`/api/editorial/${encodeURIComponent(slug)}`)
      .then((json) => {
        if (cancelled) return;
        setFeature(json.data);
        setStatus('ready');
        document.title = `${plainText(json.data.title)}. Print. BlackTribe Fashion.`;
      })
      .catch(() => { if (!cancelled) setStatus('missing'); });
    return () => { cancelled = true; };
  }, [slug]);

  /* Wait for every image (including product shots) before allowing print */
  useEffect(() => {
    if (status !== 'ready' || !pagesRef.current) return;
    const imgs = Array.from(pagesRef.current.querySelectorAll('img'));
    if (imgs.length === 0) { setImagesReady(true); return; }

    let cancelled = false;
    Promise.all(
      imgs.map((img) => (img.complete
        ? Promise.resolve()
        : new Promise((resolve) => {
          img.addEventListener('load', resolve, { once: true });
          img.addEventListener('error', resolve, { once: true });
        })))
    )
      .then(() => document.fonts?.ready)
      .then(() => { if (!cancelled) setImagesReady(true); });

    return () => { cancelled = true; };
  }, [status, feature]);

  /* Filename-friendly title while the print dialog is open */
  useEffect(() => {
    if (!feature) return;

    const pad = (n) => String(n).padStart(2, '0');
    const fileTitle = () => {
      const d = new Date();
      const stamp = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
      const issue = (feature.issue_label || '').trim().replace(/[^\w]+/g, '-').replace(/^-+|-+$/g, '');
      const draft = feature.status !== 'published' ? '_DRAFT' : '';
      return ['BlackTribe', issue, feature.slug, stamp].filter(Boolean).join('_') + draft;
    };

    const before = () => {
      screenTitle.current = document.title;
      document.title = fileTitle();
    };
    const after = () => {
      if (screenTitle.current) document.title = screenTitle.current;
    };

    window.addEventListener('beforeprint', before);
    window.addEventListener('afterprint', after);
    return () => {
      window.removeEventListener('beforeprint', before);
      window.removeEventListener('afterprint', after);
    };
  }, [feature]);

  const handlePrint = useCallback(() => window.print(), []);

  if (status === 'loading') {
    return <div className="ed-print"><div className="ed-print-note">Loading pages...</div></div>;
  }

  if (status === 'missing') {
    return (
      <div className="ed-print">
        <div className="ed-print-note">
          This feature isn't available. <Link to="/editorial">Back to Editorial</Link>
        </div>
      </div>
    );
  }

  const pages = feature.pages || [];

  return (
    <div className="ed-print">
      <div className="ed-print-toolbar">
        <span className="ed-print-toolbar__title">
          {plainText(feature.title)} / {pages.length} {pages.length === 1 ? 'page' : 'pages'}
          {feature.status !== 'published' && <span className="ed-print-toolbar__draft">Draft</span>}
        </span>
        <Link to={`/editorial/${feature.slug}`}>Back</Link>
        <button
          type="button"
          className="ed-print-toolbar__primary"
          onClick={handlePrint}
          disabled={!imagesReady}
        >
          {imagesReady ? 'Save as PDF' : 'Loading images...'}
        </button>
      </div>

      <div className="ed-print-note">
        <p>
          Each page prints at <strong>216 × 303mm</strong>: A4 (210 × 297mm) plus 3mm bleed on every side.
          The dashed line shows where the magazine trims. Keep text inside the page margins.
        </p>
        <p>
          Use <strong>desktop Chrome</strong>. In the print dialog choose <strong>Save as PDF</strong>,
          set margins to <strong>None</strong> and turn on <strong>Background graphics</strong>.
          The page size is set automatically.
        </p>
      </div>

      <div className="ed-print-pages" ref={pagesRef}>
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
    </div>
  );
}
