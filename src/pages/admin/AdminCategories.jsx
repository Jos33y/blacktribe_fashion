/*
 * BLACKTRIBE FASHION — ADMIN CATEGORIES
 *
 * Lightweight CRUD. Accessed from Products page header link.
 * Not in the main sidebar nav (categories rarely change).
 * Route: /admin/categories
 *
 * Fields: name, slug, sort_order, is_active.
 * Modal-based create/edit. Reorderable.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import '../../styles/admin/admin-settings.css';

function slugify(str) {
  return str.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
}

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', slug: '', sort_order: 0, is_active: true });
  const [saving, setSaving] = useState(false);
  const [slugManual, setSlugManual] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    document.title = 'Categories. BlackTribe Admin.';
    fetchCategories();
  }, []);

  async function getToken() {
    return (await import('../../store/authStore')).default.getState().getAccessToken();
  }

  async function fetchCategories() {
    try {
      const token = await getToken();
      const res = await fetch('/api/admin/categories', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setCategories(json.data || []);
    } catch {
      addToast('Failed to load categories.', 'error');
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setForm({ name: '', slug: '', sort_order: categories.length + 1, is_active: true });
    setSlugManual(false);
    setEditing('new');
  }

  function openEdit(cat) {
    setForm({
      name: cat.name || '',
      slug: cat.slug || '',
      sort_order: cat.sort_order ?? 0,
      is_active: cat.is_active !== false,
    });
    setSlugManual(true);
    setEditing(cat);
  }

  function update(field, value) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'name' && !slugManual) next.slug = slugify(value);
      return next;
    });
  }

  async function handleSave() {
    if (!form.name.trim()) { addToast('Name is required.', 'error'); return; }

    setSaving(true);
    try {
      const token = await getToken();
      const isNew = editing === 'new';
      const url = isNew ? '/api/admin/categories' : `/api/admin/categories/${editing.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: form.name.trim(),
          slug: form.slug.trim() || slugify(form.name),
          sort_order: parseInt(form.sort_order) || 0,
          is_active: form.is_active,
        }),
      });

      const json = await res.json();
      if (json.success) {
        addToast(isNew ? 'Category created.' : 'Category updated.', 'info');
        setEditing(null);
        fetchCategories();
      } else {
        addToast(json.error || 'Failed to save.', 'error');
      }
    } catch {
      addToast('Something went wrong.', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div className="admin-page-header__info">
          <h2 className="admin-page-header__title">Categories</h2>
          <p className="admin-page-header__desc">
            {categories.length} {categories.length === 1 ? 'category' : 'categories'}
            {' · '}
            <Link to="/admin/products" style={{ color: 'var(--bt-text-secondary)', textDecoration: 'underline', textUnderlineOffset: 3 }}>
              Back to Products
            </Link>
          </p>
        </div>
        <div className="admin-page-header__actions">
          <Button variant="primary" size="small" onClick={openCreate}>
            + New Category
          </Button>
        </div>
      </div>

      {loading ? (
        <p style={{ color: 'var(--bt-text-muted)', fontSize: 13 }}>Loading...</p>
      ) : categories.length === 0 ? (
        <div className="admin-empty">
          <p className="admin-empty__title">No categories yet.</p>
          <Button variant="primary" size="small" onClick={openCreate} style={{ marginTop: 16 }}>
            + Create First Category
          </Button>
        </div>
      ) : (
        <div className="settings-list">
          {categories.map((cat) => (
            <div key={cat.id} className="settings-list__item" onClick={() => openEdit(cat)}>
              <div className="settings-list__info">
                <span className="settings-list__name">{cat.name}</span>
                <span className="settings-list__meta">
                  /{cat.slug} · Order: {cat.sort_order}
                </span>
              </div>
              <div className="settings-list__right">
                <span className={`admin-status ${cat.is_active ? 'admin-status--confirmed' : 'admin-status--cancelled'}`}>
                  {cat.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'New Category' : 'Edit Category'}
      >
        <div className="settings-modal-form">
          <Input
            label="Category Name"
            required
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="Jackets"
          />
          <Input
            label="Slug"
            value={form.slug}
            onChange={(e) => { setSlugManual(true); update('slug', slugify(e.target.value)); }}
            placeholder="jackets"
          />
          <Input
            label="Sort Order"
            type="number"
            value={form.sort_order}
            onChange={(e) => update('sort_order', e.target.value)}
            placeholder="1"
            min="0"
          />
          <label className="admin-toggle" style={{ marginTop: 8 }}>
            <div
              className={`admin-toggle__track ${form.is_active ? 'admin-toggle__track--on' : ''}`}
              onClick={() => update('is_active', !form.is_active)}
            >
              <div className="admin-toggle__thumb" />
            </div>
            <span className="admin-toggle__label">Active</span>
          </label>
          <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'flex-end' }}>
            <Button variant="secondary" size="small" onClick={() => setEditing(null)}>Cancel</Button>
            <Button variant="primary" size="small" onClick={handleSave} loading={saving}>
              {editing === 'new' ? 'Create' : 'Save'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
