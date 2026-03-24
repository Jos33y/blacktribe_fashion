/*
 * BLACKTRIBE FASHION — ADMIN COLLECTIONS
 *
 * CRUD for collections. Inline editing — no separate form page.
 * List view + slide-out panel for create/edit.
 * Fields: name, slug, description, season, start_date, end_date, is_active.
 * Shows product count per collection.
 */

import { useState, useEffect } from 'react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import '../../styles/admin/admin-settings.css';

function slugify(str) {
  return str.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
}

const EMPTY = {
  name: '',
  slug: '',
  description: '',
  season: '',
  start_date: '',
  end_date: '',
  is_active: true,
};

export default function AdminCollections() {
  const [collections, setCollections] = useState([]);
  const [productCounts, setProductCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null = closed, 'new' = create, object = edit
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [slugManual, setSlugManual] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    document.title = 'Collections. BlackTribe Admin.';
    fetchCollections();
  }, []);

  async function getToken() {
    return (await import('../../store/authStore')).default.getState().getAccessToken();
  }

  async function fetchCollections() {
    try {
      const token = await getToken();
      const res = await fetch('/api/admin/collections', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setCollections(json.data || []);
        /* Fetch product counts for each collection */
        fetchProductCounts(json.data || [], token);
      }
    } catch {
      addToast('Failed to load collections.', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function fetchProductCounts(cols, token) {
    if (cols.length === 0) return;
    try {
      /* Fetch all products with their collection_id to count per collection */
      const res = await fetch('/api/admin/products?limit=1000', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success && json.data) {
        const counts = {};
        for (const col of cols) {
          counts[col.id] = 0;
        }
        for (const product of json.data) {
          if (product.collection_id && counts[product.collection_id] !== undefined) {
            counts[product.collection_id]++;
          }
        }
        setProductCounts(counts);
      }
    } catch {
      /* Silent — product counts are supplementary */
    }
  }

  function openCreate() {
    setForm(EMPTY);
    setSlugManual(false);
    setEditing('new');
  }

  function openEdit(col) {
    setForm({
      name: col.name || '',
      slug: col.slug || '',
      description: col.description || '',
      season: col.season || '',
      start_date: col.start_date || '',
      end_date: col.end_date || '',
      is_active: col.is_active !== false,
    });
    setSlugManual(true);
    setEditing(col);
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
    if (!form.slug.trim()) { addToast('Slug is required.', 'error'); return; }

    setSaving(true);
    try {
      const token = await getToken();
      const isNew = editing === 'new';
      const url = isNew ? '/api/admin/collections' : `/api/admin/collections/${editing.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim() || null,
        season: form.season.trim() || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        is_active: form.is_active,
      };

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
        addToast(isNew ? 'Collection created.' : 'Collection updated.', 'info');
        setEditing(null);
        fetchCollections();
      } else {
        addToast(json.error || 'Failed to save.', 'error');
      }
    } catch {
      addToast('Something went wrong.', 'error');
    } finally {
      setSaving(false);
    }
  }

  function formatCount(id) {
    const count = productCounts[id];
    if (count === undefined) return '';
    return `${count} ${count === 1 ? 'piece' : 'pieces'}`;
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div className="admin-page-header__info">
          <h2 className="admin-page-header__title">Collections</h2>
          <p className="admin-page-header__desc">
            {collections.length} {collections.length === 1 ? 'collection' : 'collections'}
          </p>
        </div>
        <div className="admin-page-header__actions">
          <Button variant="primary" size="small" onClick={openCreate}>
            + New Collection
          </Button>
        </div>
      </div>

      {loading ? (
        <p style={{ color: 'var(--bt-text-muted)', fontSize: 13 }}>Loading...</p>
      ) : collections.length === 0 ? (
        <div className="admin-empty">
          <p className="admin-empty__title">No collections yet.</p>
          <Button variant="primary" size="small" onClick={openCreate} style={{ marginTop: 16 }}>
            + Create First Collection
          </Button>
        </div>
      ) : (
        <div className="settings-list">
          {collections.map((col) => (
            <div key={col.id} className="settings-list__item" onClick={() => openEdit(col)}>
              <div className="settings-list__info">
                <span className="settings-list__name">{col.name}</span>
                <span className="settings-list__meta">
                  /{col.slug}
                  {col.season && ` · ${col.season}`}
                  {formatCount(col.id) && ` · ${formatCount(col.id)}`}
                </span>
              </div>
              <div className="settings-list__right">
                <span className={`admin-status ${col.is_active ? 'admin-status--confirmed' : 'admin-status--cancelled'}`}>
                  {col.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'New Collection' : 'Edit Collection'}
      >
        <div className="settings-modal-form">
          <Input
            label="Collection Name"
            required
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="Shadow Collection"
          />
          <Input
            label="Slug"
            value={form.slug}
            onChange={(e) => { setSlugManual(true); update('slug', slugify(e.target.value)); }}
            placeholder="shadow-collection"
          />
          <div className="input-group">
            <label className="input-group__label">Description</label>
            <textarea
              className="admin-textarea"
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              placeholder="Collection description."
              rows={3}
            />
          </div>
          <Input
            label="Season"
            value={form.season}
            onChange={(e) => update('season', e.target.value)}
            placeholder="SS26"
          />
          <div className="admin-form-row admin-form-row--2">
            <Input
              label="Start Date"
              type="date"
              value={form.start_date}
              onChange={(e) => update('start_date', e.target.value)}
            />
            <Input
              label="End Date"
              type="date"
              value={form.end_date}
              onChange={(e) => update('end_date', e.target.value)}
            />
          </div>
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
