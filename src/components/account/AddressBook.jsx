import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { useToast } from '../../components/ui/Toast';

/**
 * AddressBook — Saved addresses.
 * Add, edit, delete, set default.
 * Uses /api/auth/addresses endpoints.
 */
export default function AddressBook() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const { addToast } = useToast();

  /* ─── Form state ─── */
  const [form, setForm] = useState({
    label: '',
    full_name: '',
    street: '',
    city: '',
    state: '',
    lga: '',
    phone: '',
  });

  const resetForm = () => {
    setForm({ label: '', full_name: '', street: '', city: '', state: '', lga: '', phone: '' });
    setEditing(null);
    setShowForm(false);
  };

  /* ─── Fetch addresses ─── */
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const result = await api('/api/auth/addresses');
        if (result.success && result.data) {
          setAddresses(result.data);
        }
      } catch (err) {
        console.error('[addresses] Failed to fetch:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAddresses();
  }, []);

  /* ─── Save (create or update) ─── */
  const handleSave = async (e) => {
    e.preventDefault();

    if (!form.full_name.trim() || !form.street.trim() || !form.city.trim() || !form.state.trim()) {
      addToast('Fill in all required fields.', 'error');
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        const result = await api(`/api/auth/addresses/${editing}`, {
          method: 'PUT',
          body: form,
        });
        if (result.success) {
          setAddresses((prev) => prev.map((a) => a.id === editing ? { ...a, ...form } : a));
          addToast('Address saved.', 'success');
          resetForm();
        }
      } else {
        const result = await api('/api/auth/addresses', {
          method: 'POST',
          body: form,
        });
        if (result.success && result.data) {
          setAddresses((prev) => [...prev, result.data]);
          addToast('Address saved.', 'success');
          resetForm();
        }
      }
    } catch (err) {
      addToast('Could not save address.', 'error');
    } finally {
      setSaving(false);
    }
  };

  /* ─── Delete ─── */
  const handleDelete = async (id) => {
    try {
      await api(`/api/auth/addresses/${id}`, { method: 'DELETE' });
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      addToast('Address removed.', 'success');
    } catch (err) {
      addToast('Could not remove address.', 'error');
    }
  };

  /* ─── Set default ─── */
  const handleSetDefault = async (id) => {
    try {
      await api(`/api/auth/addresses/${id}/default`, { method: 'PUT' });
      setAddresses((prev) => prev.map((a) => ({ ...a, is_default: a.id === id })));
    } catch (err) {
      addToast('Could not set default.', 'error');
    }
  };

  /* ─── Edit ─── */
  const handleEdit = (address) => {
    setForm({
      label: address.label || '',
      full_name: address.full_name,
      street: address.street,
      city: address.city,
      state: address.state,
      lga: address.lga || '',
      phone: address.phone || '',
    });
    setEditing(address.id);
    setShowForm(true);
  };

  if (loading) {
    return <p className="account-settings__hint">Loading addresses...</p>;
  }

  return (
    <div className="address-book">
      {/* ─── Address list ─── */}
      {addresses.length > 0 && (
        <div className="address-book__list">
          {addresses.map((addr) => (
            <div key={addr.id} className="address-book__card">
              <div className="address-book__card-header">
                <span className="address-book__card-label">
                  {addr.label || 'Address'}
                  {addr.is_default && (
                    <span className="address-book__default-badge">Default</span>
                  )}
                </span>
              </div>
              <p className="address-book__card-name">{addr.full_name}</p>
              <p className="address-book__card-line">
                {addr.street}, {addr.city}
                {addr.state && `, ${addr.state}`}
                {addr.lga && ` (${addr.lga})`}
              </p>
              {addr.phone && <p className="address-book__card-line">{addr.phone}</p>}
              <div className="address-book__card-actions">
                <button type="button" className="address-book__action" onClick={() => handleEdit(addr)}>
                  Edit
                </button>
                {!addr.is_default && (
                  <button type="button" className="address-book__action" onClick={() => handleSetDefault(addr.id)}>
                    Set as default
                  </button>
                )}
                <button type="button" className="address-book__action address-book__action--delete" onClick={() => handleDelete(addr.id)}>
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Add / Edit form ─── */}
      {showForm ? (
        <form onSubmit={handleSave} className="address-book__form">
          <input
            type="text"
            className="account-settings__input"
            placeholder="Label (e.g. Home, Office)"
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
          />
          <input
            type="text"
            className="account-settings__input"
            placeholder="Full name"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            required
          />
          <input
            type="text"
            className="account-settings__input"
            placeholder="Street address"
            value={form.street}
            onChange={(e) => setForm({ ...form, street: e.target.value })}
            required
          />
          <div className="address-book__row">
            <input
              type="text"
              className="account-settings__input"
              placeholder="City"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              required
            />
            <input
              type="text"
              className="account-settings__input"
              placeholder="State"
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              required
            />
          </div>
          <div className="address-book__row">
            <input
              type="text"
              className="account-settings__input"
              placeholder="LGA (optional)"
              value={form.lga}
              onChange={(e) => setForm({ ...form, lga: e.target.value })}
            />
            <input
              type="tel"
              className="account-settings__input"
              placeholder="Phone (optional)"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div className="account-settings__inline-actions">
            <button type="submit" className="account-settings__save" disabled={saving}>
              {saving ? 'Saving...' : editing ? 'Update Address' : 'Save Address'}
            </button>
            <button type="button" className="account-settings__text-btn" onClick={resetForm}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          className="account-settings__text-btn"
          onClick={() => setShowForm(true)}
        >
          Add Address
        </button>
      )}
    </div>
  );
}
