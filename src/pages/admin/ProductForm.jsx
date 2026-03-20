/*
 * BLACKTRIBE FASHION — ADMIN PRODUCT FORM
 *
 * Add or edit a product. Used at:
 *   /admin/products/new     → create mode
 *   /admin/products/:id/edit → edit mode (pre-fills from API)
 *
 * All prices entered in ₦, stored as kobo.
 * Images uploaded to Supabase Storage via ImageUploader.
 * Slug auto-generated from name, editable.
 */

import { useState, useEffect } from 'react';
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

const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', 'ONE SIZE'];

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

  /* ─── New color input state ─── */
  const [newColor, setNewColor] = useState({ name: '', hex: '#000000' });

  useEffect(() => {
    document.title = isEdit ? 'Edit Product. BlackTribe Admin.' : 'New Product. BlackTribe Admin.';
    fetchMeta();
    if (isEdit) fetchProduct();
  }, [id]);

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
          colors: p.colors || [],
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
    update('sizes', [...form.sizes, { size: sizeName, stock: 0 }]);
  }

  function removeSize(sizeName) {
    update('sizes', form.sizes.filter((s) => s.size !== sizeName));
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
    if (form.colors.find((c) => c.name.toLowerCase() === newColor.name.toLowerCase())) return;
    update('colors', [...form.colors, { name: newColor.name.trim(), hex: newColor.hex }]);
    setNewColor({ name: '', hex: '#000000' });
  }

  function removeColor(name) {
    update('colors', form.colors.filter((c) => c.name !== name));
  }

  /* ─── Validation ─── */

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required.';
    if (!form.slug.trim()) e.slug = 'Slug is required.';
    if (!form.price || nairaToKobo(form.price) <= 0) e.price = 'Price must be greater than 0.';
    if (form.images.length === 0) e.images = 'At least one image is required.';
    if (form.sizes.length === 0) e.sizes = 'At least one size is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  /* ─── Save ─── */

  async function handleSave() {
    if (!validate()) {
      /* Scroll to first error */
      const firstError = document.querySelector('.input-group--error, .img-uploader--error, .sizes-error');
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
        images: form.images,
        sizes: form.sizes,
        colors: form.colors.length > 0 ? form.colors : null,
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

  return (
    <div className="admin-page product-form">

      <div className="admin-page-header">
        <div className="admin-page-header__info">
          <h2 className="admin-page-header__title">
            {isEdit ? 'Edit Product' : 'New Product'}
          </h2>
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
              <ImageUploader
                images={form.images}
                onChange={(urls) => {
                  update('images', urls);
                  if (errors.images) setErrors((p) => ({ ...p, images: null }));
                }}
                folder={`products/${form.slug || 'new'}`}
              />
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
                  placeholder="Optional. For future sale display."
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

              {/* Stock inputs for selected sizes */}
              {form.sizes.length > 0 && (
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
              <p className="admin-form-section__desc">Optional. Add color variants if the product comes in multiple colors.</p>

              {form.colors.length > 0 && (
                <div className="product-form__colors-list">
                  {form.colors.map((c) => (
                    <div key={c.name} className="product-form__color-chip">
                      <span
                        className="product-form__color-swatch"
                        style={{ background: c.hex }}
                      />
                      <span>{c.name}</span>
                      <button
                        className="product-form__color-remove"
                        onClick={() => removeColor(c.name)}
                        aria-label={`Remove ${c.name}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

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
                  placeholder="https://..."
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

      {/* Sticky save bar on mobile */}
      <div className="admin-form-actions admin-form-actions--sticky">
        <Button variant="secondary" size="small" onClick={() => navigate('/admin/products')}>
          Cancel
        </Button>
        <Button variant="primary" size="small" onClick={handleSave} loading={saving}>
          {isEdit ? 'Save Changes' : 'Create Product'}
        </Button>
      </div>
    </div>
  );
}
