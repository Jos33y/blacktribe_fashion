/*
 * BLACKTRIBE FASHION — ADMIN EDITORIAL EDITOR
 *
 * Route: /admin/editorial/:id
 *
 * Feature details (title, slug, issue label, subtitle) + an ordered list of
 * pages. Each page picks a template and fills its fields. Every page shows
 * a live preview rendered by the same EditorialPage component the site and
 * the print view use, so what she sees here is what prints.
 *
 * Fixed A4 pages can't grow, so long text is flagged with "Text too long"
 * on the page card. The site's mobile view reflows and shows everything,
 * but print would cut it off.
 *
 * Save writes everything. Publish/Unpublish saves and flips the status.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import Skeleton from '../../components/ui/Skeleton';
import { useToast } from '../../components/ui/Toast';
import ImageUploader from '../../components/admin/ImageUploader';
import EditorialPage from '../../components/editorial/EditorialPage';
import { TEMPLATES, TEMPLATE_KEYS, TONES, MAX_PAGES, newPage, plainText } from '../../components/editorial/templates';
import { api } from '../../utils/api';
import '../../styles/admin/admin-editorial.css';

const EDITORIAL_MAX_EDGE = 3600; /* ~300dpi on full-bleed A4 */

function slugify(str) {
  return str.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
}

const TEMPLATE_OPTIONS = TEMPLATE_KEYS.map((k) => ({ value: k, label: TEMPLATES[k].label }));
const SIDE_OPTIONS = [{ value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }];


/* ═══ FIELD ═══ */

function Field({ field, value, onChange, featureId, productOptions }) {
  switch (field.type) {
    case 'text':
      return (
        <div className="admin-form-row">
          <Input
            label={field.label}
            value={value || ''}
            maxLength={field.max}
            placeholder={field.placeholder}
            onChange={(e) => onChange(e.target.value)}
          />
          {field.accent && (
            <p className="ed-admin-hint">Wrap a word in *stars* to set it in italic.</p>
          )}
        </div>
      );

    case 'lines':
    case 'textarea':
      return (
        <div className="admin-form-row">
          <div className="input-group">
            <label className="input-group__label">{field.label}</label>
            <textarea
              className="admin-textarea"
              value={value || ''}
              maxLength={field.max}
              rows={field.rows || 4}
              placeholder={field.placeholder}
              onChange={(e) => onChange(e.target.value)}
            />
          </div>
        </div>
      );

    case 'image':
      return (
        <div className="admin-form-row">
          <label className="input-group__label">{field.label}</label>
          <ImageUploader
            images={value ? [value] : []}
            onChange={(urls) => onChange(urls[0] || '')}
            folder={featureId}
            bucket="editorial"
            max={1}
            maxEdge={EDITORIAL_MAX_EDGE}
          />
        </div>
      );

    case 'side':
      return (
        <div className="admin-form-row">
          <Select
            label={field.label}
            options={SIDE_OPTIONS}
            value={value || 'left'}
            onChange={(e) => onChange(e.target.value)}
            placeholder={null}
          />
        </div>
      );

    case 'products': {
      const selected = Array.isArray(value) ? value : [];
      const slots = selected.length < field.max ? [...selected, ''] : selected;
      return (
        <div className="admin-form-row">
          <label className="input-group__label">{field.label} (up to {field.max})</label>
          <div className="ed-admin-products">
            {slots.map((pid, i) => (
              <Select
                key={i}
                label={`Piece ${i + 1}`}
                options={[{ value: '', label: i < selected.length ? 'Remove' : 'Add a piece' }, ...productOptions]}
                value={pid}
                onChange={(e) => {
                  const next = [...selected];
                  if (e.target.value) next[i] = e.target.value;
                  else next.splice(i, 1);
                  onChange([...new Set(next.filter(Boolean))]);
                }}
                placeholder={null}
              />
            ))}
          </div>
        </div>
      );
    }

    default:
      return null;
  }
}


/* ═══ PAGE CARD ═══ */

function PageCard({
  page, index, total, open, overflow, feature, productsMap, productOptions,
  onToggle, onChange, onMove, onDelete, onOverflow,
}) {
  const tpl = TEMPLATES[page.template];
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!confirmDelete) return;
    const t = setTimeout(() => setConfirmDelete(false), 3000);
    return () => clearTimeout(t);
  }, [confirmDelete]);

  const setField = (key, value) => onChange({ ...page, fields: { ...page.fields, [key]: value } });
  const contactOn = tpl?.contactAlways || !!page.contact;

  return (
    <div className={`admin-card ed-admin-page ${open ? 'ed-admin-page--open' : ''}`}>
      <div className="ed-admin-page__head">
        <div className="ed-admin-page__thumb" onClick={onToggle} aria-hidden="true">
          <EditorialPage page={page} number={index + 1} feature={feature} products={productsMap} interactive={false} />
        </div>
        {/* Off-screen copy at a real size, used only to measure text overflow.
            The 56px thumbnail is too small to measure reliably. */}
        <div className="ed-admin-page__measure" aria-hidden="true">
          <EditorialPage page={page} number={index + 1} feature={feature} products={productsMap} interactive={false} onOverflow={onOverflow} />
        </div>
        <button type="button" className="ed-admin-page__summary" onClick={onToggle} aria-expanded={open}>
          <span className="ed-admin-page__num">Page {index + 1}</span>
          <span className="ed-admin-page__tpl">{tpl?.label}</span>
          {overflow && <span className="ed-admin-page__warn">Text too long for print</span>}
        </button>
        <div className="ed-admin-page__actions">
          <button type="button" className="ed-admin-icon-btn" onClick={() => onMove(-1)} disabled={index === 0} aria-label="Move page up">↑</button>
          <button type="button" className="ed-admin-icon-btn" onClick={() => onMove(1)} disabled={index === total - 1} aria-label="Move page down">↓</button>
          <button
            type="button"
            className={`ed-admin-icon-btn ed-admin-icon-btn--delete ${confirmDelete ? 'ed-admin-icon-btn--confirm' : ''}`}
            onClick={() => (confirmDelete ? onDelete() : setConfirmDelete(true))}
            aria-label={confirmDelete ? 'Tap again to delete page' : 'Delete page'}
          >
            {confirmDelete ? 'Delete?' : '×'}
          </button>
        </div>
      </div>

      {open && (
        <div className="ed-admin-page__body">
          <div className="ed-admin-page__fields">
            <p className="admin-form-section__desc">{tpl?.hint}</p>

            <div className={`admin-form-row ${tpl?.tone ? 'admin-form-row--2' : ''}`}>
              <Select
                label="Template"
                options={TEMPLATE_OPTIONS}
                value={page.template}
                onChange={(e) => onChange({ ...page, template: e.target.value })}
                placeholder={null}
              />
              {tpl?.tone && (
                <Select
                  label="Tone"
                  options={TONES}
                  value={page.tone || 'dark'}
                  onChange={(e) => onChange({ ...page, tone: e.target.value })}
                  placeholder={null}
                />
              )}
            </div>

            {tpl?.fields.map((field) => (
              <Field
                key={field.key}
                field={field}
                value={page.fields?.[field.key]}
                onChange={(v) => setField(field.key, v)}
                featureId={feature.id}
                productOptions={productOptions}
              />
            ))}

            <label className="admin-toggle ed-admin-page__contact">
              <div
                className={`admin-toggle__track ${contactOn ? 'admin-toggle__track--on' : ''} ${tpl?.contactAlways ? 'ed-admin-toggle--locked' : ''}`}
                onClick={() => { if (!tpl?.contactAlways) onChange({ ...page, contact: !page.contact }); }}
              >
                <div className="admin-toggle__thumb" />
              </div>
              <span className="admin-toggle__label">
                Contact strip {tpl?.contactAlways ? '(always on for the brand page)' : '(site, email, Instagram, QR code)'}
              </span>
            </label>

            {overflow && (
              <p className="ed-admin-page__warn-text">
                This text runs past the bottom of the printed page. Shorten it, or split it across two pages.
              </p>
            )}
          </div>

          <div className="ed-admin-page__preview">
            <EditorialPage page={page} number={index + 1} feature={feature} products={productsMap} interactive={false} />
          </div>
        </div>
      )}
    </div>
  );
}


/* ═══ EDITOR ═══ */

export default function AdminEditorialEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [feature, setFeature] = useState(null);
  const [pages, setPages] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null); /* null | 'save' | 'status' */
  const [dirty, setDirty] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [overflow, setOverflow] = useState({});
  const [addTemplate, setAddTemplate] = useState('split');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  /* Stable per-page overflow callbacks */
  const overflowHandlers = useRef({});
  const getOverflowHandler = useCallback((pageId) => {
    if (!overflowHandlers.current[pageId]) {
      overflowHandlers.current[pageId] = (isOver) => {
        setOverflow((prev) => (prev[pageId] === isOver ? prev : { ...prev, [pageId]: isOver }));
      };
    }
    return overflowHandlers.current[pageId];
  }, []);

  useEffect(() => {
    document.title = 'Edit Feature. BlackTribe Admin.';
    load();
  }, [id]);

  /* Warn before leaving with unsaved changes */
  useEffect(() => {
    if (!dirty) return;
    const handler = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  async function load() {
    try {
      const [featJson, prodJson] = await Promise.all([
        api(`/api/admin/editorial/${id}`),
        api('/api/admin/products?limit=1000').catch(() => ({ data: [] })),
      ]);
      const f = featJson.data;
      setFeature({
        id: f.id,
        title: f.title || '',
        slug: f.slug || '',
        issue_label: f.issue_label || '',
        dek: f.dek || '',
        status: f.status,
      });
      setPages(Array.isArray(f.pages) ? f.pages : []);
      setOpenId(f.pages?.[0]?.id || null);
      setProducts((prodJson.data || []).filter((p) => p.is_active !== false));
    } catch {
      addToast('Feature not found.', 'error');
      navigate('/admin/editorial', { replace: true });
    } finally {
      setLoading(false);
    }
  }

  const productsMap = useMemo(() => {
    const map = {};
    for (const p of products) {
      map[p.id] = { id: p.id, name: p.name, slug: p.slug, price: p.price, image: p.images?.[0] || '' };
    }
    return map;
  }, [products]);

  const productOptions = useMemo(
    () => products.map((p) => ({ value: p.id, label: p.name })),
    [products]
  );

  function updateFeature(field, value) {
    setFeature((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'slug') next.slug = slugify(value);
      return next;
    });
    setDirty(true);
  }

  function updatePage(index, nextPage) {
    setPages((prev) => prev.map((p, i) => (i === index ? nextPage : p)));
    setDirty(true);
  }

  function movePage(index, dir) {
    setPages((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setDirty(true);
  }

  function deletePage(index) {
    setPages((prev) => prev.filter((_, i) => i !== index));
    setDirty(true);
  }

  function addPage() {
    if (pages.length >= MAX_PAGES) { addToast(`A feature can have up to ${MAX_PAGES} pages.`, 'error'); return; }
    const page = newPage(addTemplate);
    setPages((prev) => [...prev, page]);
    setOpenId(page.id);
    setDirty(true);
  }

  async function save(nextStatus) {
    if (!feature.title.trim()) { addToast('Title is required.', 'error'); return; }
    if (!feature.slug.trim()) { addToast('Slug is required.', 'error'); return; }

    setSaving(nextStatus ? 'status' : 'save');
    try {
      const body = {
        title: feature.title.trim(),
        slug: feature.slug.trim(),
        issue_label: feature.issue_label.trim() || null,
        dek: feature.dek.trim() || null,
        pages,
      };
      if (nextStatus) body.status = nextStatus;

      const json = await api(`/api/admin/editorial/${id}`, { method: 'PUT', body });
      setFeature((prev) => ({ ...prev, slug: json.data.slug, status: json.data.status }));
      setPages(json.data.pages || []);
      setDirty(false);

      if (nextStatus === 'published') addToast('Published. Live under Editorial.', 'info');
      else if (nextStatus === 'draft') addToast('Unpublished. Back to draft.', 'info');
      else addToast('Saved.', 'info');
    } catch (err) {
      addToast(err.message || 'Failed to save.', 'error');
    } finally {
      setSaving(null);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await api(`/api/admin/editorial/${id}`, { method: 'DELETE' });
      setDirty(false);
      addToast('Feature deleted.', 'info');
      navigate('/admin/editorial', { replace: true });
    } catch (err) {
      addToast(err.message || 'Failed to delete.', 'error');
      setDeleting(false);
    }
  }

  function openOnSite(path) {
    if (dirty) { addToast('Save first so the preview shows your latest changes.', 'error'); return; }
    window.open(path, '_blank', 'noopener');
  }

  if (loading || !feature) {
    return (
      <div className="admin-page">
        <Skeleton type="text" style={{ width: '40%', height: 24, marginBottom: 24 }} />
        <Skeleton type="text" count={6} style={{ height: 48, marginBottom: 16 }} />
      </div>
    );
  }

  const isPublished = feature.status === 'published';
  const overflowCount = pages.filter((p) => overflow[p.id]).length;

  return (
    <div className="admin-page ed-admin">
      <div className="admin-page-header">
        <div className="admin-page-header__info">
          <h2 className="admin-page-header__title">{plainText(feature.title) || 'Untitled feature'}</h2>
          <p className="admin-page-header__desc">
            <span className={`admin-status ${isPublished ? 'admin-status--confirmed' : 'admin-status--pending'}`}>
              {isPublished ? 'Published' : 'Draft'}
            </span>
            {' '}{pages.length} {pages.length === 1 ? 'page' : 'pages'}
            {dirty && ' · Unsaved changes'}
          </p>
        </div>
        <div className="admin-page-header__actions ed-admin__actions">
          <Button variant="secondary" size="small" onClick={() => openOnSite(`/editorial/${feature.slug}`)}>View</Button>
          <Button variant="secondary" size="small" onClick={() => openOnSite(`/editorial/${feature.slug}/print`)}>Print PDF</Button>
          <Button variant="secondary" size="small" onClick={() => save()} loading={saving === 'save'} disabled={!!saving}>Save</Button>
          <Button variant="primary" size="small" onClick={() => save(isPublished ? 'draft' : 'published')} loading={saving === 'status'} disabled={!!saving}>
            {isPublished ? 'Unpublish' : 'Publish'}
          </Button>
        </div>
      </div>

      {overflowCount > 0 && (
        <div className="ed-admin__banner">
          {overflowCount} {overflowCount === 1 ? 'page has' : 'pages have'} more text than fits the printed page.
          The site shows it all on phones, but print cuts it off.
        </div>
      )}

      {/* ─── Details ─── */}
      <div className="admin-card">
        <div className="admin-form-section">
          <h3 className="admin-form-section__title">Feature details</h3>
          <div className="admin-form-row admin-form-row--2">
            <Input label="Title" required value={feature.title} onChange={(e) => updateFeature('title', e.target.value)} maxLength={120} />
            <Input label="Issue label" value={feature.issue_label} onChange={(e) => updateFeature('issue_label', e.target.value)} placeholder="Issue 01 / SS26" maxLength={60} />
          </div>
          <div className="admin-form-row">
            <Input label="URL slug" value={feature.slug} onChange={(e) => updateFeature('slug', e.target.value)} placeholder="the-crystal-drop" />
          </div>
          <div className="admin-form-row">
            <div className="input-group">
              <label className="input-group__label">Subtitle (listing card and search results)</label>
              <textarea
                className="admin-textarea"
                rows={2}
                maxLength={300}
                value={feature.dek}
                onChange={(e) => updateFeature('dek', e.target.value)}
                placeholder="One or two lines about this feature."
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Pages ─── */}
      <div className="ed-admin__pages">
        {pages.map((page, i) => (
          <PageCard
            key={page.id}
            page={page}
            index={i}
            total={pages.length}
            open={openId === page.id}
            overflow={!!overflow[page.id]}
            feature={feature}
            productsMap={productsMap}
            productOptions={productOptions}
            onToggle={() => setOpenId(openId === page.id ? null : page.id)}
            onChange={(next) => updatePage(i, next)}
            onMove={(dir) => movePage(i, dir)}
            onDelete={() => deletePage(i)}
            onOverflow={getOverflowHandler(page.id)}
          />
        ))}
      </div>

      <div className="admin-card ed-admin__add">
        <Select
          label="Add a page"
          options={TEMPLATE_OPTIONS}
          value={addTemplate}
          onChange={(e) => setAddTemplate(e.target.value)}
          placeholder={null}
        />
        <Button variant="secondary" size="small" onClick={addPage} disabled={pages.length >= MAX_PAGES}>+ Add page</Button>
      </div>

      <div className="ed-admin__danger">
        <button type="button" className="ed-admin__delete-link" onClick={() => setDeleteOpen(true)}>Delete this feature</button>
      </div>

      <Modal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete feature?">
        <p style={{ color: 'var(--bt-text-secondary)', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
          “{plainText(feature.title)}” and all its pages will be removed from the site. This can't be undone.
        </p>
        <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'flex-end' }}>
          <Button variant="secondary" size="small" onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button variant="primary" size="small" onClick={handleDelete} loading={deleting}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
