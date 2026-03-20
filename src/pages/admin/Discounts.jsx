/*
 * BLACKTRIBE FASHION — ADMIN DISCOUNTS v2
 *
 * v2: Richer list cards showing code, type, value, usage, min order, dates, status.
 * Modal form unchanged.
 */

import { useState, useEffect } from 'react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import '../../styles/admin/admin-settings.css';

function formatPrice(kobo) {
  if (!kobo && kobo !== 0) return '₦0';
  return '₦' + Math.floor(kobo / 100).toLocaleString('en-NG');
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

function isExpired(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

const EMPTY = {
  code: '', type: 'percentage', value: '', min_order: '', usage_limit: '',
  starts_at: '', expires_at: '', is_active: true,
};

export default function AdminDiscounts() {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const { addToast } = useToast();

  useEffect(() => { document.title = 'Discounts. BlackTribe Admin.'; fetchDiscounts(); }, []);

  async function getToken() {
    return (await import('../../store/authStore')).default.getState().getAccessToken();
  }

  async function fetchDiscounts() {
    try {
      const token = await getToken();
      const res = await fetch('/api/admin/discounts', { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.success) setDiscounts(json.data || []);
    } catch { addToast('Failed to load discounts.', 'error'); }
    finally { setLoading(false); }
  }

  function openCreate() { setForm(EMPTY); setEditing('new'); }

  function openEdit(d) {
    setForm({
      code: d.code || '',
      type: d.type || 'percentage',
      value: d.type === 'fixed' ? String(Math.floor((d.value || 0) / 100)) : String(d.value || ''),
      min_order: d.min_order ? String(Math.floor(d.min_order / 100)) : '',
      usage_limit: d.usage_limit ? String(d.usage_limit) : '',
      starts_at: d.starts_at ? d.starts_at.split('T')[0] : '',
      expires_at: d.expires_at ? d.expires_at.split('T')[0] : '',
      is_active: d.is_active !== false,
    });
    setEditing(d);
  }

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: field === 'code' ? value.toUpperCase().replace(/\s/g, '') : value }));
  }

  async function handleSave() {
    if (!form.code.trim()) { addToast('Code is required.', 'error'); return; }
    if (!form.value || parseFloat(form.value) <= 0) { addToast('Value must be greater than 0.', 'error'); return; }

    setSaving(true);
    try {
      const token = await getToken();
      const isNew = editing === 'new';
      const res = await fetch(isNew ? '/api/admin/discounts' : `/api/admin/discounts/${editing.id}`, {
        method: isNew ? 'POST' : 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: form.code.trim(),
          type: form.type,
          value: form.type === 'fixed' ? Math.round(parseFloat(form.value) * 100) : parseInt(form.value),
          min_order: form.min_order ? Math.round(parseFloat(form.min_order) * 100) : null,
          usage_limit: form.usage_limit ? parseInt(form.usage_limit) : null,
          starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
          expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
          is_active: form.is_active,
        }),
      });
      const json = await res.json();
      if (json.success) { addToast(isNew ? 'Discount created.' : 'Discount updated.', 'info'); setEditing(null); fetchDiscounts(); }
      else { addToast(json.error || 'Failed to save.', 'error'); }
    } catch { addToast('Something went wrong.', 'error'); }
    finally { setSaving(false); }
  }

  function copyCode(e, code) {
    e.stopPropagation();
    navigator.clipboard?.writeText(code);
    addToast('Code copied.', 'info');
  }

  /* Active, inactive, or expired */
  function getDiscountStatus(d) {
    if (!d.is_active) return { label: 'Inactive', cls: 'admin-status--cancelled' };
    if (d.expires_at && isExpired(d.expires_at)) return { label: 'Expired', cls: 'admin-status--cancelled' };
    return { label: 'Active', cls: 'admin-status--confirmed' };
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div className="admin-page-header__info">
          <h2 className="admin-page-header__title">Discounts</h2>
          <p className="admin-page-header__desc">{discounts.length} discount codes</p>
        </div>
        <div className="admin-page-header__actions">
          <Button variant="primary" size="small" onClick={openCreate}>+ New Discount</Button>
        </div>
      </div>

      {loading ? (
        <div className="shipping-skeleton">{[1, 2, 3].map((i) => <div key={i} className="shipping-skeleton__row" />)}</div>
      ) : discounts.length === 0 ? (
        <div className="admin-empty">
          <p className="admin-empty__title">No discount codes yet.</p>
          <p className="admin-empty__desc">Create your first discount code to offer to customers.</p>
          <Button variant="primary" size="small" onClick={openCreate} style={{ marginTop: 16 }}>+ Create First Discount</Button>
        </div>
      ) : (
        <div className="discount-list">
          {discounts.map((d) => {
            const status = getDiscountStatus(d);
            const valueDisplay = d.type === 'percentage' ? `${d.value}% off` : `${formatPrice(d.value)} off`;
            const usageDisplay = d.usage_limit ? `${d.times_used || 0} / ${d.usage_limit}` : `${d.times_used || 0} used`;

            return (
              <div key={d.id} className="discount-card" onClick={() => openEdit(d)}>
                <div className="discount-card__top">
                  <div className="discount-card__code-row">
                    <span className="discount-card__code">{d.code}</span>
                    <button
                      className="discount-card__copy"
                      onClick={(e) => copyCode(e, d.code)}
                      title="Copy code"
                      type="button"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="9" y="9" width="13" height="13" rx="2" />
                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                      </svg>
                    </button>
                  </div>
                  <span className={`admin-status ${status.cls}`}>{status.label}</span>
                </div>

                <div className="discount-card__details">
                  <span className="discount-card__value">{valueDisplay}</span>
                  <span className="discount-card__dot"></span>
                  <span className="discount-card__usage">{usageDisplay}</span>
                  {d.min_order && (
                    <>
                      <span className="discount-card__dot"></span>
                      <span className="discount-card__min">Min {formatPrice(d.min_order)}</span>
                    </>
                  )}
                </div>

                {(d.starts_at || d.expires_at) && (
                  <div className="discount-card__dates">
                    {d.starts_at && <span>From {formatDate(d.starts_at)}</span>}
                    {d.expires_at && (
                      <span className={isExpired(d.expires_at) ? 'discount-card__dates--expired' : ''}>
                        {d.starts_at ? ' — ' : ''}Expires {formatDate(d.expires_at)}
                      </span>
                    )}
                  </div>
                )}

                {/* Usage progress bar (if usage limit set) */}
                {d.usage_limit && (
                  <div className="discount-card__progress">
                    <div
                      className="discount-card__progress-bar"
                      style={{ width: `${Math.min(100, ((d.times_used || 0) / d.usage_limit) * 100)}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal — same form as before */}
      <Modal isOpen={editing !== null} onClose={() => setEditing(null)} title={editing === 'new' ? 'New Discount' : 'Edit Discount'}>
        <div className="settings-modal-form">
          <Input label="Code" required value={form.code} onChange={(e) => update('code', e.target.value)} placeholder="TRIBE10" />
          <div className="admin-form-row admin-form-row--2">
            <Select label="Type" options={[{ value: 'percentage', label: 'Percentage (%)' }, { value: 'fixed', label: 'Fixed (₦)' }]} value={form.type} onChange={(e) => update('type', e.target.value)} placeholder={null} />
            <Input label={form.type === 'percentage' ? 'Value (%)' : 'Value (₦)'} type="number" value={form.value} onChange={(e) => update('value', e.target.value)} placeholder={form.type === 'percentage' ? '10' : '5000'} min="0" />
          </div>
          <div className="admin-form-row admin-form-row--2">
            <Input label="Min Order (₦)" type="number" value={form.min_order} onChange={(e) => update('min_order', e.target.value)} placeholder="Optional" min="0" />
            <Input label="Usage Limit" type="number" value={form.usage_limit} onChange={(e) => update('usage_limit', e.target.value)} placeholder="Unlimited" min="0" />
          </div>
          <div className="admin-form-row admin-form-row--2">
            <Input label="Start Date" type="date" value={form.starts_at} onChange={(e) => update('starts_at', e.target.value)} />
            <Input label="Expiry Date" type="date" value={form.expires_at} onChange={(e) => update('expires_at', e.target.value)} />
          </div>
          <label className="admin-toggle" style={{ marginTop: 8 }}>
            <div className={`admin-toggle__track ${form.is_active ? 'admin-toggle__track--on' : ''}`} onClick={() => update('is_active', !form.is_active)}>
              <div className="admin-toggle__thumb" />
            </div>
            <span className="admin-toggle__label">Active</span>
          </label>
          <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'flex-end' }}>
            <Button variant="secondary" size="small" onClick={() => setEditing(null)}>Cancel</Button>
            <Button variant="primary" size="small" onClick={handleSave} loading={saving}>{editing === 'new' ? 'Create' : 'Save'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
