/*
 * BLACKTRIBE FASHION — ADMIN SHIPPING v2
 *
 * Geographic region grouping with rate tier overview.
 * Collapsible sections, bulk edit per region, inline editing.
 * 37 Nigerian states + FCT + 4 international zones.
 */

import { useState, useEffect } from 'react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import '../../styles/admin/admin-settings.css';

/* ─── Helpers ─── */

function formatPrice(kobo) {
  if (!kobo && kobo !== 0) return 'Free';
  if (kobo === 0) return 'Free';
  return '₦' + Math.floor(kobo / 100).toLocaleString('en-NG');
}

function koboToNaira(kobo) {
  if (!kobo && kobo !== 0) return '';
  return String(Math.floor(kobo / 100));
}

function nairaToKobo(naira) {
  if (!naira && naira !== '0') return null;
  return Math.round(parseFloat(naira) * 100);
}

/* ─── Geographic Regions (stable, never changes) ─── */

const REGIONS = [
  {
    id: 'lagos',
    name: 'Lagos',
    desc: 'Home base',
    states: ['Lagos'],
  },
  {
    id: 'south-west',
    name: 'South-West',
    desc: 'Ogun, Oyo, Osun, Ondo, Ekiti',
    states: ['Ogun', 'Oyo', 'Osun', 'Ondo', 'Ekiti'],
  },
  {
    id: 'south-south',
    name: 'South-South',
    desc: 'Rivers, Delta, Edo, Bayelsa, Akwa Ibom, Cross River',
    states: ['Rivers', 'Delta', 'Edo', 'Bayelsa', 'Akwa Ibom', 'Cross River'],
  },
  {
    id: 'south-east',
    name: 'South-East',
    desc: 'Anambra, Enugu, Imo, Abia, Ebonyi',
    states: ['Anambra', 'Enugu', 'Imo', 'Abia', 'Ebonyi'],
  },
  {
    id: 'north-central',
    name: 'North-Central',
    desc: 'FCT, Kwara, Kogi, Plateau, Nasarawa, Benue, Niger',
    states: ['FCT', 'Kwara', 'Kogi', 'Plateau', 'Nasarawa', 'Benue', 'Niger'],
  },
  {
    id: 'north-west',
    name: 'North-West',
    desc: 'Kaduna, Kano, Katsina, Zamfara, Sokoto, Kebbi, Jigawa',
    states: ['Kaduna', 'Kano', 'Katsina', 'Zamfara', 'Sokoto', 'Kebbi', 'Jigawa'],
  },
  {
    id: 'north-east',
    name: 'North-East',
    desc: 'Bauchi, Gombe, Adamawa, Taraba, Yobe, Borno',
    states: ['Bauchi', 'Gombe', 'Adamawa', 'Taraba', 'Yobe', 'Borno'],
  },
];

/* ─── Icons ─── */

const ChevronDown = ({ open }) => (
  <svg
    width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5"
    style={{
      transition: 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1)',
      transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
    }}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const GlobeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
  </svg>
);

const TruckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="1" y="3" width="15" height="13" />
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);

/* ═══ COMPONENT ═══ */

export default function AdminShipping() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [editing, setEditing] = useState(null); // single zone
  const [bulkEditing, setBulkEditing] = useState(null); // region bulk
  const [form, setForm] = useState({ rate: '', free_above: '' });
  const [saving, setSaving] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    document.title = 'Shipping. BlackTribe Admin.';
    fetchZones();
  }, []);

  async function getToken() {
    return (await import('../../store/authStore')).default.getState().getAccessToken();
  }

  async function fetchZones() {
    try {
      const token = await getToken();
      const res = await fetch('/api/admin/shipping', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setZones(json.data || []);
    } catch {
      addToast('Failed to load shipping zones.', 'error');
    } finally {
      setLoading(false);
    }
  }

  /* ─── Zone lookup ─── */

  function getZoneByState(stateName) {
    return zones.find(
      (z) => (z.zone_type === 'state' || z.zone_type === 'domestic') && z.name === stateName
    );
  }

  function getRegionZones(region) {
    return region.states.map((s) => getZoneByState(s)).filter(Boolean);
  }

  function getRegionRate(region) {
    const rz = getRegionZones(region);
    if (rz.length === 0) return null;
    const rates = [...new Set(rz.map((z) => z.rate))];
    if (rates.length === 1) return { uniform: true, rate: rates[0] };
    return { uniform: false, min: Math.min(...rates), max: Math.max(...rates) };
  }

  function getRegionDelivery(region) {
    const rz = getRegionZones(region);
    if (rz.length === 0) return null;
    const mins = rz.map((z) => z.estimated_days_min).filter(Boolean);
    const maxs = rz.map((z) => z.estimated_days_max).filter(Boolean);
    if (mins.length === 0) return null;
    return { min: Math.min(...mins), max: Math.max(...maxs) };
  }

  const international = zones.filter((z) => z.zone_type === 'international');

  /* ─── Toggle expand ─── */

  function toggleRegion(id) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  /* ─── Single zone edit ─── */

  function openEdit(zone) {
    setForm({
      rate: koboToNaira(zone.rate),
      free_above: koboToNaira(zone.free_shipping_min),
    });
    setEditing(zone);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/shipping/${editing.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rate: nairaToKobo(form.rate),
          free_above: nairaToKobo(form.free_above),
        }),
      });
      const json = await res.json();
      if (json.success) {
        addToast('Shipping rate updated.', 'info');
        setEditing(null);
        fetchZones();
      } else {
        addToast(json.error || 'Failed to save.', 'error');
      }
    } catch {
      addToast('Something went wrong.', 'error');
    } finally {
      setSaving(false);
    }
  }

  /* ─── Bulk edit ─── */

  function openBulkEdit(region, e) {
    e.stopPropagation();
    const rateInfo = getRegionRate(region);
    const rz = getRegionZones(region);
    const freeAboves = [...new Set(rz.map((z) => z.free_shipping_min).filter(Boolean))];
    setForm({
      rate: rateInfo?.uniform ? koboToNaira(rateInfo.rate) : '',
      free_above: freeAboves.length === 1 ? koboToNaira(freeAboves[0]) : '',
    });
    setBulkEditing(region);
  }

  async function handleBulkSave() {
    const rz = getRegionZones(bulkEditing);
    if (rz.length === 0) return;

    setSaving(true);
    try {
      const token = await getToken();
      const body = {};
      if (form.rate !== '') body.rate = nairaToKobo(form.rate);
      if (form.free_above !== '') body.free_above = nairaToKobo(form.free_above);

      if (Object.keys(body).length === 0) {
        addToast('Enter a rate or free shipping threshold.', 'error');
        setSaving(false);
        return;
      }

      const promises = rz.map((zone) =>
        fetch(`/api/admin/shipping/${zone.id}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      );

      await Promise.all(promises);
      addToast(`Updated ${rz.length} zones in ${bulkEditing.name}.`, 'info');
      setBulkEditing(null);
      fetchZones();
    } catch {
      addToast('Something went wrong.', 'error');
    } finally {
      setSaving(false);
    }
  }

  /* ─── Loading skeleton ─── */

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-page-header">
          <div className="admin-page-header__info">
            <h2 className="admin-page-header__title">Shipping</h2>
            <p className="admin-page-header__desc">Loading zones...</p>
          </div>
        </div>
        <div className="shipping-skeleton">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="shipping-skeleton__row" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page-header">
        <div className="admin-page-header__info">
          <h2 className="admin-page-header__title">Shipping</h2>
          <p className="admin-page-header__desc">
            {zones.length} zones across {REGIONS.length} regions. Click a region to view states, or edit rates individually.
          </p>
        </div>
      </div>

      {/* ─── Rate Tier Overview ─── */}
      <div className="shipping-tiers">
        {REGIONS.map((region) => {
          const rateInfo = getRegionRate(region);
          const rz = getRegionZones(region);
          if (!rateInfo) return null;
          return (
            <button
              key={region.id}
              className="shipping-tier"
              onClick={() => toggleRegion(region.id)}
            >
              <span className="shipping-tier__rate">
                {rateInfo.uniform
                  ? formatPrice(rateInfo.rate)
                  : `${formatPrice(rateInfo.min)}–${formatPrice(rateInfo.max)}`}
              </span>
              <span className="shipping-tier__name">{region.name}</span>
              <span className="shipping-tier__count">
                {rz.length} {rz.length === 1 ? 'state' : 'states'}
              </span>
            </button>
          );
        })}
        {international.length > 0 && (
          <button
            className="shipping-tier shipping-tier--intl"
            onClick={() => toggleRegion('international')}
          >
            <span className="shipping-tier__rate">
              {formatPrice(Math.min(...international.map((z) => z.rate)))}+
            </span>
            <span className="shipping-tier__name">International</span>
            <span className="shipping-tier__count">{international.length} zones</span>
          </button>
        )}
      </div>

      {/* ─── Domestic Regions ─── */}
      <div className="shipping-section-label">
        <TruckIcon />
        <span>Domestic</span>
        <span className="shipping-section-label__count">37 states + FCT</span>
      </div>

      <div className="shipping-regions">
        {REGIONS.map((region) => {
          const rateInfo = getRegionRate(region);
          const delivery = getRegionDelivery(region);
          const rz = getRegionZones(region);
          const isOpen = expanded[region.id] || false;

          if (!rateInfo) return null;

          return (
            <div key={region.id} className={`shipping-region ${isOpen ? 'shipping-region--open' : ''}`}>
              {/* Region header */}
              <button
                className="shipping-region__header"
                onClick={() => toggleRegion(region.id)}
                aria-expanded={isOpen}
              >
                <div className="shipping-region__left">
                  <ChevronDown open={isOpen} />
                  <div className="shipping-region__info">
                    <span className="shipping-region__name">{region.name}</span>
                    <span className="shipping-region__meta">
                      {rz.length} {rz.length === 1 ? 'state' : 'states'}
                      {delivery && ` · ${delivery.min}–${delivery.max} days`}
                    </span>
                  </div>
                </div>
                <div className="shipping-region__right">
                  <span className="shipping-region__rate">
                    {rateInfo.uniform
                      ? formatPrice(rateInfo.rate)
                      : 'Mixed'}
                  </span>
                  <span
                    className="shipping-region__edit"
                    role="button"
                    tabIndex={0}
                    onClick={(e) => openBulkEdit(region, e)}
                    onKeyDown={(e) => { if (e.key === 'Enter') openBulkEdit(region, e); }}
                    title={`Edit all ${region.name} rates`}
                  >
                    <EditIcon />
                  </span>
                </div>
              </button>

              {/* Expanded states */}
              {isOpen && (
                <div className="shipping-region__body">
                  <div className="shipping-states">
                    {rz.map((zone) => (
                      <button
                        key={zone.id}
                        className="shipping-state"
                        onClick={() => openEdit(zone)}
                        title={`Edit ${zone.name}`}
                      >
                        <span className="shipping-state__name">{zone.name}</span>
                        <span className="shipping-state__rate">{formatPrice(zone.rate)}</span>
                        {zone.free_shipping_min && (
                          <span className="shipping-state__free">
                            Free above {formatPrice(zone.free_shipping_min)}
                          </span>
                        )}
                        {zone.estimated_days_min && zone.estimated_days_max && (
                          <span className="shipping-state__days">
                            {zone.estimated_days_min}–{zone.estimated_days_max}d
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ─── International ─── */}
      {international.length > 0 && (
        <>
          <div className="shipping-section-label" style={{ marginTop: 32 }}>
            <GlobeIcon />
            <span>International</span>
            <span className="shipping-section-label__count">{international.length} zones</span>
          </div>

          <div className="shipping-intl">
            {international.map((zone) => (
              <button
                key={zone.id}
                className="shipping-intl__card"
                onClick={() => openEdit(zone)}
              >
                <div className="shipping-intl__top">
                  <span className="shipping-intl__name">{zone.name}</span>
                  <span className="shipping-intl__rate">{formatPrice(zone.rate)}</span>
                </div>
                <div className="shipping-intl__bottom">
                  {zone.estimated_days_min && zone.estimated_days_max && (
                    <span className="shipping-intl__days">
                      {zone.estimated_days_min}–{zone.estimated_days_max} business days
                    </span>
                  )}
                  {zone.free_shipping_min ? (
                    <span className="shipping-intl__free">
                      Free above {formatPrice(zone.free_shipping_min)}
                    </span>
                  ) : (
                    <span className="shipping-intl__no-free">No free shipping</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* ─── Single Zone Edit Modal ─── */}
      <Modal
        isOpen={editing !== null}
        onClose={() => setEditing(null)}
        title={editing ? `${editing.name}` : ''}
      >
        {editing && (
          <div className="settings-modal-form">
            <div className="shipping-edit-context">
              <span className="shipping-edit-context__type">
                {editing.zone_type === 'international' ? 'International zone' : 'Nigerian state'}
              </span>
              {editing.estimated_days_min && editing.estimated_days_max && (
                <span className="shipping-edit-context__days">
                  Delivery: {editing.estimated_days_min}–{editing.estimated_days_max} business days
                </span>
              )}
            </div>
            <Input
              label="Shipping Rate (₦)"
              type="number"
              value={form.rate}
              onChange={(e) => setForm((p) => ({ ...p, rate: e.target.value }))}
              placeholder="e.g. 3500"
              min="0"
            />
            <Input
              label="Free Shipping Above (₦)"
              type="number"
              value={form.free_above}
              onChange={(e) => setForm((p) => ({ ...p, free_above: e.target.value }))}
              placeholder="Leave empty to disable"
              min="0"
            />
            <p className="shipping-edit-hint">
              Set free shipping threshold to 0 for always-free delivery to this zone.
            </p>
            <div className="shipping-edit-actions">
              <Button variant="secondary" size="small" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="small" onClick={handleSave} loading={saving}>
                Save
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ─── Bulk Edit Modal ─── */}
      <Modal
        isOpen={bulkEditing !== null}
        onClose={() => setBulkEditing(null)}
        title={bulkEditing ? `${bulkEditing.name} — Bulk Edit` : ''}
      >
        {bulkEditing && (
          <div className="settings-modal-form">
            <div className="shipping-edit-context">
              <span className="shipping-edit-context__type">
                Applies to {getRegionZones(bulkEditing).length} states
              </span>
              <span className="shipping-edit-context__states">
                {bulkEditing.states.join(', ')}
              </span>
            </div>
            <Input
              label="Shipping Rate (₦)"
              type="number"
              value={form.rate}
              onChange={(e) => setForm((p) => ({ ...p, rate: e.target.value }))}
              placeholder="New rate for all states in this region"
              min="0"
            />
            <Input
              label="Free Shipping Above (₦)"
              type="number"
              value={form.free_above}
              onChange={(e) => setForm((p) => ({ ...p, free_above: e.target.value }))}
              placeholder="Leave empty to keep current"
              min="0"
            />
            <p className="shipping-edit-hint">
              Only filled fields will be updated. Empty fields keep their current values.
            </p>
            <div className="shipping-edit-actions">
              <Button variant="secondary" size="small" onClick={() => setBulkEditing(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="small" onClick={handleBulkSave} loading={saving}>
                Update {getRegionZones(bulkEditing).length} Zones
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
