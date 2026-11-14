/*
 * BLACKTRIBE FASHION — ADMIN EDITORIAL (list)
 *
 * Route: /admin/editorial
 * Lists all features, drafts and published. "New Feature" creates a draft
 * with a cover page and opens the editor.
 * Gated by the 'collections' permission (sidebar + API).
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { api } from '../../utils/api';
import { plainText } from '../../components/editorial/templates';
import '../../styles/admin/admin-settings.css';
import '../../styles/admin/admin-editorial.css';

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminEditorial() {
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', issue_label: '' });
  const [saving, setSaving] = useState(false);
  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Editorial. BlackTribe Admin.';
    load();
  }, []);

  async function load() {
    try {
      const json = await api('/api/admin/editorial');
      setFeatures(json.data || []);
    } catch {
      addToast('Failed to load features.', 'error');
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setForm({ title: '', issue_label: '' });
    setCreating(true);
  }

  async function handleCreate() {
    if (!form.title.trim()) { addToast('Title is required.', 'error'); return; }
    setSaving(true);
    try {
      const json = await api('/api/admin/editorial', {
        method: 'POST',
        body: { title: form.title.trim(), issue_label: form.issue_label.trim() || null },
      });
      setCreating(false);
      navigate(`/admin/editorial/${json.data.id}`);
    } catch (err) {
      addToast(err.message || 'Failed to create feature.', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div className="admin-page-header__info">
          <h2 className="admin-page-header__title">Editorial</h2>
          <p className="admin-page-header__desc">
            Magazine features for the site and for print. {features.length} {features.length === 1 ? 'feature' : 'features'}.
          </p>
        </div>
        <div className="admin-page-header__actions">
          <Button variant="primary" size="small" onClick={openCreate}>+ New Feature</Button>
        </div>
      </div>

      {loading ? (
        <p style={{ color: 'var(--bt-text-muted)', fontSize: 13 }}>Loading...</p>
      ) : features.length === 0 ? (
        <div className="admin-empty">
          <p className="admin-empty__title">No features yet.</p>
          <p className="admin-empty__desc">
            A feature is a set of A4 magazine pages. It shows on the site under Editorial and downloads as a print-ready PDF.
          </p>
          <Button variant="primary" size="small" onClick={openCreate} style={{ marginTop: 16 }}>
            + Create First Feature
          </Button>
        </div>
      ) : (
        <div className="settings-list">
          {features.map((f) => (
            <div
              key={f.id}
              className="settings-list__item"
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/admin/editorial/${f.id}`)}
              onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/admin/editorial/${f.id}`); }}
            >
              <div className="ed-admin-list__thumb">
                {f.cover_image && <img src={f.cover_image} alt="" loading="lazy" />}
              </div>
              <div className="settings-list__info">
                <span className="settings-list__name">{plainText(f.title)}</span>
                <span className="settings-list__meta">
                  {f.issue_label && `${f.issue_label} · `}
                  {f.page_count} {f.page_count === 1 ? 'page' : 'pages'}
                  {` · Updated ${formatDate(f.updated_at)}`}
                </span>
              </div>
              <div className="settings-list__right">
                <span className={`admin-status ${f.status === 'published' ? 'admin-status--confirmed' : 'admin-status--pending'}`}>
                  {f.status === 'published' ? 'Published' : 'Draft'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={creating} onClose={() => setCreating(false)} title="New Feature">
        <div className="settings-modal-form">
          <Input
            label="Title"
            required
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            placeholder="The Crystal Drop"
          />
          <Input
            label="Issue label"
            value={form.issue_label}
            onChange={(e) => setForm((p) => ({ ...p, issue_label: e.target.value }))}
            placeholder="Issue 01 / SS26"
          />
          <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'flex-end' }}>
            <Button variant="secondary" size="small" onClick={() => setCreating(false)}>Cancel</Button>
            <Button variant="primary" size="small" onClick={handleCreate} loading={saving}>Create</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
