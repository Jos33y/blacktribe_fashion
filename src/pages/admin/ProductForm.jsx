/*
 * BLACKTRIBE FASHION — ADMIN PRODUCT FORM v2
 *
 * v2: Shopify-style sticky top bar
 *   - Single action bar at top of page (Cancel + Save)
 *   - When header scrolls out of view, slim sticky bar pins
 *     to top of content area with title + actions
 *   - Bottom sticky bar REMOVED (was confusing with two bars)
 *
 * Add or edit a product. Used at:
 *   /admin/products/new     → create mode
 *   /admin/products/:id/edit → edit mode (pre-fills from API)
 *
 * All prices entered in ₦, stored as kobo.
 * Images uploaded to Supabase Storage via ImageUploader.
 * Slug auto-generated from name, editable.
 */

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Skeleton from '../../components/ui/Skeleton';
import { useToast } from '../../components/ui/Toast';
import ImageUploader from '../../components/admin/ImageUploader';
import '../../styles/admin/admin-products.css';

/* ═══ HELPERS ═══ */

function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function nairaToKobo(naira) {
  const num = parseFloat(naira);
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

function koboToNaira(kobo) {
  if (!kobo) return '';
  return String(Math.floor(kobo / 100));
}

const BADGE_OPTIONS = [
  { value: '', label: 'None' },
  { value: 'NEW', label: 'New' },
  { value: 'PRE-ORDER', label: 'Pre-Order' },
  { value: 'LIMITED', label: 'Limited' },
];

const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'One Size'];

/*
 * Colour variants: every colour carries its own photos and stock per size.
 * Older products saved colours as { name, hex } only; those are upgraded on
 * load: the first colour takes the product's photos and stock, the rest
 * start empty so nothing is double-counted.
 */
function toVariantColors(p) {
  const colors = Array.isArray(p.colors) ? p.colors : [];
  const sizes = Array.isArray(p.sizes) ? p.sizes : [];
  return colors
    .filter((c) => c && (c.name || typeof c === 'string'))
    .map((c, i) => {
      const name = typeof c === 'string' ? c : c.name;
      const hex = (typeof c === 'object' && c.hex) || '#0C0C0C';
      if (typeof c === 'object' && Array.isArray(c.sizes)) {
        return { name, hex, images: c.images || [], sizes: c.sizes };
      }
      return {
        name,
        hex,
        images: i === 0 ? (p.images || []) : [],
        sizes: sizes.map((sz) => ({ size: sz.size, stock: i === 0 ? sz.stock || 0 : 0 })),
      };
    });
}

function sumSizes(colors, sizeList) {
  return sizeList.map((s) => ({
    size: s.size,
    stock: colors.reduce((sum, c) => sum + (c.sizes.find((x) => x.size === s.size)?.stock || 0), 0),
  }));
}

const EMPTY_PRODUCT = {
  name: '',
  slug: '',
  short_description: '',
  description: '',
  price: '',
  compare_at_price: '',
  category_id: '',
  collection_id: '',
  images: [],
  sizes: [],
  colors: [],
  tags: [],
  badge: '',
  video_url: '',
  is_featured: false,
  is_active: true,
  show_inventory: false,
  total_inventory: '',
  preorder_deadline: '',
};

/* ═══ COMPONENT ═══ */

export default function AdminProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const isEdit = !!id;

  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [categories, setCategories] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [slugManual, setSlugManual] = useState(false);
  const [headerPinned, setHeaderPinned] = useState(false);

  /* ─── New color input state ─── */
  const [newColor, setNewColor] = useState({ name: '', hex: '#000000' });

  /* ─── New tag input state ─── */
  const [newTag, setNewTag] = useState('');

  /* ─── Sticky header observer ─── */
  const headerRef = useRef(null);

  useEffect(() => {
    document.title = isEdit ? 'Edit Product. BlackTribe Admin.' : 'New Product. BlackTribe Admin.';
    fetchMeta();
    if (isEdit) fetchProduct();
  }, [id]);

  /* IntersectionObserver: when the page header scrolls out of .admin-content,
     we pin a slim sticky bar at the top */
  useEffect(() => {
    const headerEl = headerRef.current;
    if (!headerEl) return;

    const scrollRoot = document.querySelector('.admin-content');

    const observer = new IntersectionObserver(
      ([entry]) => {
        setHeaderPinned(!entry.isIntersecting);
      },
      {
        root: scrollRoot || null,
        threshold: 0,
        rootMargin: '0px',
      }
    );

    observer.observe(headerEl);
    return () => observer.disconnect();
  }, [loading]);

  async function getToken() {
    return (await import('../../store/authStore')).default.getState().getAccessToken();
  }

  async function fetchMeta() {
    try {
      const token = await getToken();
      const [catRes, colRes] = await Promise.all([
        fetch('/api/admin/categories', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/collections', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const catJson = await catRes.json();
      const colJson = await colRes.json();
      if (catJson.success) setCategories(catJson.data || []);
      if (colJson.success) setCollections(colJson.data || []);
    } catch { /* silent */ }
  }

  async function fetchProduct() {
    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success && json.data) {
        const p = json.data;
        setForm({
          name: p.name || '',
          slug: p.slug || '',
          short_description: p.short_description || '',
          description: p.description || '',
          price: koboToNaira(p.price),
          compare_at_price: koboToNaira(p.compare_at_price),
          category_id: p.category_id || '',
          collection_id: p.collection_id || '',
          images: p.images || [],
          sizes: p.sizes || [],
          colors: toVariantColors(p),
          tags: p.tags || [],
          badge: p.badge || '',
          video_url: p.video_url || '',
          is_featured: p.is_featured || false,
          is_active: p.is_active !== false,
          show_inventory: p.show_inventory || false,
          total_inventory: p.total_inventory ? String(p.total_inventory) : '',
          preorder_deadline: p.preorder_deadline
            ? new Date(p.preorder_deadline).toISOString().slice(0, 16)
            : '',
        });
        setSlugManual(true);
      }
    } catch {
      addToast('Failed to load product.', 'error');
    } finally {
      setLoading(false);
    }
  }

  /* ─── Field handlers ─── */

  function update(field, value) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      /* Auto-generate slug from name */
      if (field === 'name' && !slugManual) {
        next.slug = slugify(value);
      }
      return next;
    });
    /* Clear field error */
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  }

  function handleSlugChange(value) {
    setSlugManual(true);
    update('slug', slugify(value));
  }

  /* ─── Size management ─── */

  function addSize(sizeName) {
    if (form.sizes.find((s) => s.size === sizeName)) return;
    const order = (x) => { const i = SIZE_OPTIONS.indexOf(x.size); return i === -1 ? 99 : i; };
    const sorted = [...form.sizes, { size: sizeName, stock: 0 }].sort((a, b) => order(a) - order(b));
    setForm((prev) => ({
      ...prev,
      sizes: sorted,
      colors: prev.colors.map((c) => ({
        ...c,
        sizes: sorted.map((sz) => c.sizes.find((x) => x.size === sz.size) || { size: sz.size, stock: 0 }),
      })),
    }));
    if (errors.sizes) setErrors((prev) => ({ ...prev, sizes: null }));
  }

  function removeSize(sizeName) {
    setForm((prev) => ({
      ...prev,
      sizes: prev.sizes.filter((s) => s.size !== sizeName),
      colors: prev.colors.map((c) => ({ ...c, sizes: c.sizes.filter((x) => x.size !== sizeName) })),
    }));
  }

  function updateSizeStock(sizeName, stock) {
    update(
      'sizes',
      form.sizes.map((s) => (s.size === sizeName ? { ...s, stock: parseInt(stock) || 0 } : s))
    );
  }

  /* ─── Color management ─── */

  function addColor() {
    if (!newColor.name.trim()) return;
    if (form.colors.find((c) => c.name.toLowerCase() === newColor.name.trim().toLowerCase())) return;
    const first = form.colors.length === 0;
    update('colors', [...form.colors, {
      name: newColor.name.trim(),
      hex: newColor.hex,
      /* The first colour starts with the product's current photos and stock */
      images: first ? form.images : [],
      sizes: form.sizes.map((sz) => ({ size: sz.size, stock: first ? sz.stock || 0 : 0 })),
    }]);
    setNewColor({ name: '', hex: '#000000' });
  }

  function removeColor(name) {
    update('colors', form.colors.filter((c) => c.name !== name));
  }

  function updateColor(name, patch) {
    update('colors', form.colors.map((c) => (c.name === name ? { ...c, ...patch } : c)));
    if (errors.colors) setErrors((prev) => ({ ...prev, colors: null }));
  }

  function updateColorStock(name, sizeName, stock) {
    update('colors', form.colors.map((c) => (c.name !== name ? c : {
      ...c,
      sizes: c.sizes.map((x) => (x.size === sizeName ? { ...x, stock: Math.max(0, parseInt(stock, 10) || 0) } : x)),
    })));
  }

  function moveColorUp(index) {
    if (index <= 0) return;
    const next = [...form.colors];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    update('colors', next);
  }

  /* ─── Tag management ─── */

  function addTag() {
    const tag = newTag.trim().toLowerCase();
    if (!tag) return;
    if (form.tags.includes(tag)) return;
    update('tags', [...form.tags, tag]);
    setNewTag('');
  }

  function removeTag(tag) {
    update('tags', form.tags.filter((t) => t !== tag));
  }

  /* ─── Validation ─── */

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required.';
    if (!form.slug.trim()) e.slug = 'Slug is required.';
    if (!form.price || nairaToKobo(form.price) <= 0) e.price = 'Price must be greater than 0.';
    if (form.colors.length > 0) {
      const noPhotos = form.colors.filter((c) => !c.images?.length).map((c) => c.name);
      if (noPhotos.length) e.colors = `Add photos for: ${noPhotos.join(', ')}.`;
    } else if (form.images.length === 0) {
      e.images = 'At least one image is required.';
    }
    if (form.sizes.length === 0) e.sizes = 'At least one size is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  /* ─── Save ─── */

  async function handleSave() {
    if (!validate()) {
      /* Scroll to first error */
      const firstError = document.querySelector('.input-group--error, .img-uploader--error, .sizes-error, .colors-error');
      firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setSaving(true);
    try {
      const token = await getToken();
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        short_description: form.short_description.trim() || null,
        description: form.description.trim() || null,
        price: nairaToKobo(form.price),
        compare_at_price: form.compare_at_price ? nairaToKobo(form.compare_at_price) : null,
        category_id: form.category_id || null,
        collection_id: form.collection_id || null,
        /* With colours: main photos = first colour, stock = total per size.
           The server derives the same; sent here so the list view is right immediately. */
        images: form.colors.length > 0 ? form.colors[0].images : form.images,
        sizes: form.colors.length > 0 ? sumSizes(form.colors, form.sizes) : form.sizes,
        colors: form.colors.length > 0 ? form.colors : null,
        tags: form.tags.length > 0 ? form.tags : null,
        badge: form.badge || null,
        video_url: form.video_url.trim() || null,
        is_featured: form.is_featured,
        is_active: form.is_active,
        show_inventory: form.show_inventory,
        total_inventory: form.show_inventory && form.total_inventory
          ? parseInt(form.total_inventory)
          : null,
        preorder_deadline: form.preorder_deadline
          ? new Date(form.preorder_deadline).toISOString()
          : null,
      };

      const url = isEdit ? `/api/admin/products/${id}` : '/api/admin/products';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        addToast(isEdit ? 'Product updated.' : 'Product created.', 'info');
        navigate('/admin/products');
      } else {
        addToast(json.error || 'Failed to save product.', 'error');
      }
    } catch (err) {
      console.error('[product form] save error:', err);
      addToast('Something went wrong.', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="admin-page">
        <Skeleton type="text" style={{ width: '40%', height: 24, marginBottom: 24 }} />
        <Skeleton type="text" count={8} style={{ height: 40, marginBottom: 16 }} />
      </div>
    );
  }

  const categoryOpts = [
    { value: '', label: 'No category' },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ];
  const collectionOpts = [
    { value: '', label: 'No collection' },
    ...collections.map((c) => ({ value: c.id, label: c.name })),
  ];

  const pageTitle = isEdit ? (form.name || 'Edit Product') : 'New Product';

  return (
    <div className="admin-page product-form">

      {/* ─── Sticky pinned bar (appears when header scrolls away) ─── */}
      <div className={`product-form__sticky-bar ${headerPinned ? 'product-form__sticky-bar--visible' : ''}`}>
        <span className="product-form__sticky-title">{pageTitle}</span>
        <div className="product-form__sticky-actions">
          <Button variant="secondary" size="small" onClick={() => navigate('/admin/products')}>
            Cancel
          </Button>
          <Button variant="primary" size="small" onClick={handleSave} loading={saving}>
            {isEdit ? 'Save Changes' : 'Create Product'}
          </Button>
        </div>
      </div>

      {/* ─── Normal page header (observed for intersection) ─── */}
      <div ref={headerRef} className="admin-page-header">
        <div className="admin-page-header__info">
          <h2 className="admin-page-header__title">{pageTitle}</h2>
        </div>
        <div className="admin-page-header__actions">
          <Button variant="secondary" size="small" onClick={() => navigate('/admin/products')}>
            Cancel
          </Button>
          <Button variant="primary" size="small" onClick={handleSave} loading={saving}>
            {isEdit ? 'Save Changes' : 'Create Product'}
          </Button>
        </div>
      </div>

      <div className="product-form__body">

        {/* ─── Left column: main fields ─── */}
        <div className="product-form__main">

          {/* Basic Info */}
          <div className="admin-card">
            <div className="admin-form-section">
              <h3 className="admin-form-section__title">Basic Information</h3>
              <div className="admin-form-row">
                <Input
                  label="Product Name"
                  required
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  error={errors.name}
                  placeholder="Crystal Trucker Jacket"
                />
              </div>
              <div className="admin-form-row">
                <Input
                  label="URL Slug"
                  value={form.slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  error={errors.slug}
                  placeholder="crystal-trucker-jacket"
                />
              </div>
              <div className="admin-form-row">
                <Input
                  label="Short Description"
                  value={form.short_description}
                  onChange={(e) => update('short_description', e.target.value)}
                  placeholder="1-2 sentences for product cards and meta."
                />
              </div>
              <div className="admin-form-row">
                <div className="input-group">
                  <label className="input-group__label">Full Description</label>
                  <textarea
                    className="admin-textarea"
                    value={form.description}
                    onChange={(e) => update('description', e.target.value)}
                    placeholder="Detailed product description. Materials, fit, story."
                    rows={4}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Images */}
          <div className={`admin-card ${errors.images ? 'img-uploader--error' : ''}`}>
            <div className="admin-form-section">
              <h3 className="admin-form-section__title">Images</h3>
              {errors.images && (
                <p className="product-form__field-error">{errors.images}</p>
              )}
              {form.colors.length > 0 ? (
                <p className="admin-form-section__desc">
                  This piece has colours, so photos are set per colour below.
                  The first colour's photos are used on cards and the homepage.
                </p>
              ) : (
              <ImageUploader
                images={form.images}
                onChange={(urls) => {
                  update('images', urls);
                  if (errors.images) setErrors((p) => ({ ...p, images: null }));
                }}
                folder={`products/${form.slug || 'new'}`}
              />
              )}
            </div>
          </div>

          {/* Pricing */}
          <div className="admin-card">
            <div className="admin-form-section">
              <h3 className="admin-form-section__title">Pricing</h3>
              <div className="admin-form-row admin-form-row--2">
                <Input
                  label="Price (₦)"
                  required
                  type="number"
                  value={form.price}
                  onChange={(e) => update('price', e.target.value)}
                  error={errors.price}
                  placeholder="185000"
                  min="0"
                />
                <Input
                  label="Compare-at Price (₦)"
                  type="number"
                  value={form.compare_at_price}
                  onChange={(e) => update('compare_at_price', e.target.value)}
                  placeholder="Optional. For sale display."
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Sizes & Stock */}
          <div className="admin-card">
            <div className="admin-form-section">
              <h3 className="admin-form-section__title">Sizes and Stock</h3>
              {errors.sizes && (
                <p className="product-form__field-error sizes-error">{errors.sizes}</p>
              )}

              {/* Add size buttons */}
              <div className="product-form__size-add">
                {SIZE_OPTIONS.map((s) => {
                  const exists = form.sizes.find((sz) => sz.size === s);
                  return (
                    <button
                      key={s}
                      className={`product-form__size-btn ${exists ? 'product-form__size-btn--active' : ''}`}
                      onClick={() => exists ? removeSize(s) : addSize(s)}
                      type="button"
                    >
                      {s}
                    </button>
                  );
                })}
              </div>

              {form.colors.length > 0 && form.sizes.length > 0 && (
                <p className="admin-form-section__desc" style={{ marginTop: 12 }}>
                  Stock is set per colour below. Total: {sumSizes(form.colors, form.sizes).map((s) => `${s.size} ${s.stock}`).join(' · ')}
                </p>
              )}

              {/* Stock inputs for selected sizes (no colours) */}
              {form.colors.length === 0 && form.sizes.length > 0 && (
                <div className="product-form__size-stock">
                  {form.sizes.map((s) => (
                    <div key={s.size} className="product-form__size-row">
                      <span className="product-form__size-label">{s.size}</span>
                      <input
                        type="number"
                        className="product-form__stock-input"
                        value={s.stock}
                        onChange={(e) => updateSizeStock(s.size, e.target.value)}
                        min="0"
                        placeholder="0"
                      />
                      <span className="product-form__stock-unit">units</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Colors */}
          <div className="admin-card">
            <div className="admin-form-section">
              <h3 className="admin-form-section__title">Colors</h3>
              <p className="admin-form-section__desc">
                Optional. One piece in several colours: each colour gets its own photos and stock.
                Shoppers pick a colour and the photos and sizes switch with it.
              </p>
              {errors.colors && (
                <p className="product-form__field-error colors-error">{errors.colors}</p>
              )}

              {form.colors.map((c, i) => (
                <div key={c.name} className="product-form__variant">
                  <div className="product-form__variant-head">
                    <span className="product-form__color-swatch" style={{ background: c.hex }} />
                    <span className="product-form__variant-name">{c.name}</span>
                    {i === 0
                      ? <span className="product-form__variant-tag">Main</span>
                      : (
                        <button type="button" className="product-form__variant-btn" onClick={() => moveColorUp(i)} aria-label={`Move ${c.name} up`}>
                          Move up
                        </button>
                      )}
                    <button
                      type="button"
                      className="product-form__color-remove"
                      onClick={() => removeColor(c.name)}
                      aria-label={`Remove ${c.name}`}
                    >
                      ×
                    </button>
                  </div>

                  <ImageUploader
                    images={c.images || []}
                    onChange={(urls) => updateColor(c.name, { images: urls })}
                    folder={`products/${form.slug || 'new'}/${slugify(c.name) || 'colour'}`}
                  />

                  {form.sizes.length > 0 ? (
                    <div className="product-form__size-stock">
                      {c.sizes.map((x) => (
                        <div key={x.size} className="product-form__size-row">
                          <span className="product-form__size-label">{x.size}</span>
                          <input
                            type="number"
                            className="product-form__stock-input"
                            value={x.stock}
                            onChange={(e) => updateColorStock(c.name, x.size, e.target.value)}
                            min="0"
                            placeholder="0"
                            aria-label={`${c.name} ${x.size} stock`}
                          />
                          <span className="product-form__stock-unit">units</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="admin-form-section__desc">Pick sizes above to set stock for {c.name}.</p>
                  )}
                </div>
              ))}

              <div className="product-form__color-add">
                <input
                  type="color"
                  className="product-form__color-picker"
                  value={newColor.hex}
                  onChange={(e) => setNewColor((p) => ({ ...p, hex: e.target.value }))}
                />
                <input
                  type="text"
                  className="product-form__color-name"
                  value={newColor.name}
                  onChange={(e) => setNewColor((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Color name (e.g., Black)"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addColor(); } }}
                />
                <button
                  className="product-form__color-add-btn"
                  onClick={addColor}
                  disabled={!newColor.name.trim()}
                  type="button"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="admin-card">
            <div className="admin-form-section">
              <h3 className="admin-form-section__title">Tags</h3>
              <p className="admin-form-section__desc">Optional. Used for search and filtering.</p>

              {form.tags.length > 0 && (
                <div className="product-form__tags-list">
                  {form.tags.map((tag) => (
                    <span key={tag} className="product-form__tag-chip">
                      {tag}
                      <button
                        className="product-form__tag-remove"
                        onClick={() => removeTag(tag)}
                        aria-label={`Remove ${tag}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="product-form__tag-input">
                <input
                  type="text"
                  className="product-form__tag-field"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Type a tag and press Enter"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                />
                <button
                  className="product-form__tag-add-btn"
                  onClick={addTag}
                  disabled={!newTag.trim()}
                  type="button"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Right column: meta, toggles ─── */}
        <div className="product-form__side">

          {/* Organization */}
          <div className="admin-card">
            <div className="admin-form-section">
              <h3 className="admin-form-section__title">Organization</h3>
              <div className="admin-form-row">
                <Select
                  label="Category"
                  options={categoryOpts}
                  value={form.category_id}
                  onChange={(e) => update('category_id', e.target.value)}
                  placeholder={null}
                />
              </div>
              <div className="admin-form-row">
                <Select
                  label="Collection"
                  options={collectionOpts}
                  value={form.collection_id}
                  onChange={(e) => update('collection_id', e.target.value)}
                  placeholder={null}
                />
              </div>
              <div className="admin-form-row">
                <Select
                  label="Badge"
                  options={BADGE_OPTIONS}
                  value={form.badge}
                  onChange={(e) => update('badge', e.target.value)}
                  placeholder={null}
                />
              </div>
              <div className="admin-form-row">
                <Input
                  label="Video URL"
                  value={form.video_url}
                  onChange={(e) => update('video_url', e.target.value)}
                  placeholder="/video/file.mp4 or https://..."
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="admin-card">
            <div className="admin-form-section">
              <h3 className="admin-form-section__title">Status</h3>
              <label className="admin-toggle">
                <div
                  className={`admin-toggle__track ${form.is_active ? 'admin-toggle__track--on' : ''}`}
                  onClick={() => update('is_active', !form.is_active)}
                >
                  <div className="admin-toggle__thumb" />
                </div>
                <span className="admin-toggle__label">Active (visible on store)</span>
              </label>
              <label className="admin-toggle" style={{ marginTop: 12 }}>
                <div
                  className={`admin-toggle__track ${form.is_featured ? 'admin-toggle__track--on' : ''}`}
                  onClick={() => update('is_featured', !form.is_featured)}
                >
                  <div className="admin-toggle__thumb" />
                </div>
                <span className="admin-toggle__label">Featured (homepage)</span>
              </label>
            </div>
          </div>

          {/* Scarcity */}
          <div className="admin-card">
            <div className="admin-form-section">
              <h3 className="admin-form-section__title">Scarcity Indicators</h3>
              <p className="admin-form-section__desc">
                Off by default. When enabled, shows inventory count or pre-order deadline on the product page.
              </p>
              <label className="admin-toggle">
                <div
                  className={`admin-toggle__track ${form.show_inventory ? 'admin-toggle__track--on' : ''}`}
                  onClick={() => update('show_inventory', !form.show_inventory)}
                >
                  <div className="admin-toggle__thumb" />
                </div>
                <span className="admin-toggle__label">Show inventory count</span>
              </label>

              {form.show_inventory && (
                <div style={{ marginTop: 12 }}>
                  <Input
                    label="Total Inventory"
                    type="number"
                    value={form.total_inventory}
                    onChange={(e) => update('total_inventory', e.target.value)}
                    placeholder="200"
                    min="0"
                  />
                </div>
              )}

              <div style={{ marginTop: 12 }}>
                <Input
                  label="Pre-order Deadline"
                  type="datetime-local"
                  value={form.preorder_deadline}
                  onChange={(e) => update('preorder_deadline', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
