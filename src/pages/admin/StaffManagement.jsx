/*
 * BLACKTRIBE FASHION — ADMIN STAFF MANAGEMENT v3
 *
 * v3: Auto-generates @blacktribefashion.com email from full name.
 * Reserved usernames blocked. Username editable if needed.
 */

import { useState, useEffect } from 'react';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import useAuthStore from '../../store/authStore';
import '../../styles/admin/admin-settings.css';

const ALL_PERMISSIONS = [
  { key: 'products', label: 'Products', desc: 'Create, edit, deactivate products' },
  { key: 'orders', label: 'Orders', desc: 'View, update status, add tracking' },
  { key: 'customers', label: 'Customers', desc: 'View customer list and history' },
  { key: 'collections', label: 'Collections', desc: 'Create, edit collections and categories' },
  { key: 'discounts', label: 'Discounts', desc: 'Create, edit discount codes' },
  { key: 'shipping', label: 'Shipping', desc: 'Manage shipping zones and rates' },
  { key: 'settings', label: 'Settings', desc: 'Site settings, email templates' },
];

const RESERVED_USERNAMES = [
  'support', 'admin', 'info', 'noreply', 'no-reply', 'hello',
  'contact', 'sales', 'help', 'team', 'hr', 'ceo', 'founder',
  'mail', 'postmaster', 'webmaster', 'billing', 'security',
  'staff', 'store', 'shop', 'order', 'orders', 'blacktribe',
];

const DOMAIN = '@blacktribefashion.com';
const MAX_USERNAME_LENGTH = 24;

function generateUsername(fullName) {
  if (!fullName || !fullName.trim()) return '';
  const cleaned = fullName.trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s.-]/g, '').replace(/\s+/g, '.')
    .replace(/\.{2,}/g, '.').replace(/^\.+|\.+$/g, '');
  if (!cleaned) return '';
  return cleaned.length > MAX_USERNAME_LENGTH ? cleaned.substring(0, MAX_USERNAME_LENGTH).replace(/\.+$/, '') : cleaned;
}

function isReservedUsername(username) {
  return RESERVED_USERNAMES.includes(username.toLowerCase().replace(/\./g, ''));
}

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const special = '!@#$%&*';
  let pw = '';
  for (let i = 0; i < 10; i++) pw += chars.charAt(Math.floor(Math.random() * chars.length));
  pw += special.charAt(Math.floor(Math.random() * special.length));
  pw += Math.floor(Math.random() * 90 + 10);
  return pw;
}

export default function StaffManagement() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [createdCreds, setCreatedCreds] = useState(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const { addToast } = useToast();
  const currentUser = useAuthStore((s) => s.session?.user);
  const profile = useAuthStore((s) => s.profile);

  const [createName, setCreateName] = useState('');
  const [createRole, setCreateRole] = useState('admin');
  const [createPerms, setCreatePerms] = useState(['products', 'orders']);
  const [usernameOverride, setUsernameOverride] = useState('');

  const [editRole, setEditRole] = useState('admin');
  const [editPerms, setEditPerms] = useState([]);

  const autoUsername = generateUsername(createName);
  const username = usernameOverride || autoUsername;
  const generatedEmail = username ? `${username}${DOMAIN}` : '';
  const isReserved = username && isReservedUsername(username);

  useEffect(() => { document.title = 'Staff. BlackTribe Admin.'; fetchStaff(); }, []);
  useEffect(() => { setUsernameOverride(''); }, [createName]);

  async function getToken() {
    return (await import('../../store/authStore')).default.getState().getAccessToken();
  }

  async function fetchStaff() {
    try {
      const token = await getToken();
      const res = await fetch('/api/admin/staff', { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.success) setStaff(json.data || []);
    } catch { addToast('Failed to load staff.', 'error'); }
    finally { setLoading(false); }
  }

  function openCreate() {
    setCreateName(''); setCreateRole('admin'); setCreatePerms(['products', 'orders']);
    setUsernameOverride(''); setCreatedCreds(null); setShowCreate(true);
  }

  function toggleCreatePerm(key) { setCreatePerms((prev) => prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]); }

  async function handleCreate() {
    if (!createName.trim()) { addToast('Name is required.', 'error'); return; }
    if (!username) { addToast('Could not generate email. Check the name.', 'error'); return; }
    if (isReserved) { addToast(`"${username}" is reserved. Edit the username.`, 'error'); return; }
    if (createRole === 'admin' && createPerms.length === 0) { addToast('Select at least one permission.', 'error'); return; }

    const email = generatedEmail;
    const password = generatePassword();
    setSaving(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: createName.trim(), email, password, role: createRole, permissions: createRole === 'superadmin' ? ALL_PERMISSIONS.map((p) => p.key) : createPerms }),
      });
      const json = await res.json();
      if (json.success) { setCreatedCreds({ email, password }); addToast('Staff member created.', 'info'); fetchStaff(); }
      else { addToast(json.error || 'Failed to create staff.', 'error'); }
    } catch { addToast('Something went wrong.', 'error'); }
    finally { setSaving(false); }
  }

  function copyCredentials() {
    if (!createdCreds) return;
    navigator.clipboard?.writeText(`BlackTribe Admin Login\nEmail: ${createdCreds.email}\nPassword: ${createdCreds.password}\nURL: https://blacktribefashion.com/auth`);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  function openEdit(member) { setEditRole(member.role); setEditPerms(member.permissions || []); setEditingStaff(member); }
  function toggleEditPerm(key) { setEditPerms((prev) => prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]); }

  async function handleUpdate() {
    if (editRole === 'admin' && editPerms.length === 0) { addToast('Select at least one permission.', 'error'); return; }
    setSaving(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/staff/${editingStaff.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: editRole, permissions: editRole === 'superadmin' ? ALL_PERMISSIONS.map((p) => p.key) : editPerms }),
      });
      const json = await res.json();
      if (json.success) { addToast('Staff permissions updated.', 'info'); setEditingStaff(null); fetchStaff(); }
      else { addToast(json.error || 'Failed to update.', 'error'); }
    } catch { addToast('Something went wrong.', 'error'); }
    finally { setSaving(false); }
  }

  async function handleRevoke(member) {
    if (!window.confirm(`Revoke admin access for ${member.full_name || member.email}?`)) return;
    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/staff/${member.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.success) { addToast('Admin access revoked.', 'info'); fetchStaff(); }
      else { addToast(json.error || 'Failed to revoke.', 'error'); }
    } catch { addToast('Something went wrong.', 'error'); }
  }

  if (profile?.role !== 'superadmin') {
    return (<div className="admin-page"><div className="admin-empty"><div className="admin-empty__icon"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg></div><p className="admin-empty__title">Superadmin access required</p><p className="admin-empty__desc">Only superadmin accounts can manage staff members and permissions.</p></div></div>);
  }

  const PermGrid = ({ perms, toggle }) => (
    <div className="staff-permissions__grid">
      {ALL_PERMISSIONS.map((perm) => {
        const on = perms.includes(perm.key);
        return (
          <button key={perm.key} className={`staff-perm-toggle ${on ? 'staff-perm-toggle--on' : ''}`} onClick={() => toggle(perm.key)} type="button">
            <span className="staff-perm-toggle__check">{on && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>}</span>
            <div className="staff-perm-toggle__info"><span className="staff-perm-toggle__name">{perm.label}</span><span className="staff-perm-toggle__desc">{perm.desc}</span></div>
          </button>
        );
      })}
    </div>
  );

  const RoleSelect = ({ value, onChange }) => (
    <div className="staff-role-select">
      <span className="staff-role-select__label">Role</span>
      <div className="staff-role-select__options">
        <button type="button" className={`staff-role-option ${value === 'admin' ? 'staff-role-option--active' : ''}`} onClick={() => onChange('admin')}><span className="staff-role-option__title">Admin</span><span className="staff-role-option__desc">Specific permissions only</span></button>
        <button type="button" className={`staff-role-option ${value === 'superadmin' ? 'staff-role-option--active' : ''}`} onClick={() => onChange('superadmin')}><span className="staff-role-option__title">Superadmin</span><span className="staff-role-option__desc">Full access, manages staff</span></button>
      </div>
    </div>
  );

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div className="admin-page-header__info">
          <h2 className="admin-page-header__title">Staff</h2>
          <p className="admin-page-header__desc">Manage admin accounts and permissions.</p>
        </div>
        <div className="admin-page-header__actions"><Button variant="primary" size="small" onClick={openCreate}>Add Staff</Button></div>
      </div>

      {loading ? (
        <div className="shipping-skeleton">{[1, 2, 3].map((i) => <div key={i} className="shipping-skeleton__row"/>)}</div>
      ) : staff.length === 0 ? (
        <div className="admin-empty"><p className="admin-empty__title">No staff members yet</p><p className="admin-empty__desc">Add your first team member to start managing the store together.</p></div>
      ) : (
        <div className="staff-list">
          {staff.map((member) => {
            const isMe = currentUser?.id === member.id;
            return (
              <div key={member.id} className="staff-card">
                <div className="staff-card__top">
                  <div className="staff-card__avatar">{(member.full_name || member.email || '?').charAt(0).toUpperCase()}</div>
                  <div className="staff-card__info"><span className="staff-card__name">{member.full_name || 'Unnamed'}{isMe && <span className="staff-card__you">You</span>}</span><span className="staff-card__email">{member.email}</span></div>
                  <div className="staff-card__role-badge" data-role={member.role}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>{member.role}</div>
                </div>
                <div className="staff-card__permissions">
                  {member.role === 'superadmin' ? <span className="staff-card__perm staff-card__perm--all">All permissions</span> : (member.permissions || []).map((p) => <span key={p} className="staff-card__perm">{p}</span>)}
                </div>
                <div className="staff-card__actions">
                  {isMe ? <span className="staff-card__action staff-card__action--muted">Cannot edit own role</span> : (<><button className="staff-card__action" onClick={() => openEdit(member)}>Edit permissions</button><button className="staff-card__action staff-card__action--danger" onClick={() => handleRevoke(member)}>Revoke access</button></>)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ Create Modal ═══ */}
      <Modal isOpen={showCreate} onClose={() => { setShowCreate(false); setCreatedCreds(null); }} title={createdCreds ? 'Staff Created' : 'Add Staff Member'}>
        {createdCreds ? (
          <div className="staff-creds">
            <div className="staff-creds__notice">Save these credentials now. The password will not be shown again.</div>
            <div className="staff-creds__fields">
              <div className="staff-creds__field"><span className="staff-creds__label">Email</span><span className="staff-creds__value">{createdCreds.email}</span></div>
              <div className="staff-creds__field"><span className="staff-creds__label">Temporary Password</span><span className="staff-creds__value staff-creds__value--mono">{createdCreds.password}</span></div>
            </div>
            <button className="staff-creds__copy" onClick={copyCredentials} type="button">
              {copied ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg> Copied</> : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> Copy Login Details</>}
            </button>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}><Button variant="primary" size="small" onClick={() => { setShowCreate(false); setCreatedCreds(null); }}>Done</Button></div>
          </div>
        ) : (
          <div className="staff-create-form">
            <div className="staff-field">
              <label className="staff-field__label" htmlFor="staff-name">Full Name</label>
              <input id="staff-name" className="staff-field__input" type="text" value={createName} onChange={(e) => setCreateName(e.target.value)} placeholder="e.g. Bola Adeyemi" autoComplete="off" />
            </div>

            <div className="staff-field">
              <label className="staff-field__label">Generated Email</label>
              <div className="staff-email-preview">
                {generatedEmail ? (
                  <span className={`staff-email-preview__value ${isReserved ? 'staff-email-preview__value--error' : ''}`}>
                    {generatedEmail}
                  </span>
                ) : (
                  <span className="staff-email-preview__placeholder">Type a name above to generate email</span>
                )}
                {isReserved && <span className="staff-email-preview__error">This username is reserved. Edit below.</span>}
              </div>
            </div>

            <div className="staff-field">
              <label className="staff-field__label" htmlFor="staff-username">
                Username
                <span className="staff-field__hint">Edit if the auto-generated one doesn't work</span>
              </label>
              <div className="staff-username-row">
                <input
                  id="staff-username"
                  className="staff-field__input staff-field__input--username"
                  type="text"
                  value={usernameOverride || autoUsername}
                  onChange={(e) => {
                    const val = e.target.value.toLowerCase().replace(/[^a-z0-9.-]/g, '').substring(0, MAX_USERNAME_LENGTH);
                    setUsernameOverride(val);
                  }}
                  placeholder="username"
                  autoComplete="off"
                />
                <span className="staff-username-row__domain">{DOMAIN}</span>
              </div>
            </div>

            <RoleSelect value={createRole} onChange={setCreateRole} />
            {createRole === 'admin' && (<div className="staff-permissions"><span className="staff-permissions__label">Permissions</span><PermGrid perms={createPerms} toggle={toggleCreatePerm} /></div>)}

            <div className="shipping-edit-actions">
              <Button variant="secondary" size="small" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button variant="primary" size="small" onClick={handleCreate} loading={saving}>Create Account</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ═══ Edit Modal ═══ */}
      <Modal isOpen={editingStaff !== null} onClose={() => setEditingStaff(null)} title={editingStaff ? editingStaff.full_name || editingStaff.email : ''}>
        {editingStaff && (
          <div className="staff-create-form">
            <div className="shipping-edit-context">
              <span className="shipping-edit-context__type">{editingStaff.email}</span>
              <span className="shipping-edit-context__days">Joined {new Date(editingStaff.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
            <RoleSelect value={editRole} onChange={setEditRole} />
            {editRole === 'admin' && (<div className="staff-permissions"><span className="staff-permissions__label">Permissions</span><PermGrid perms={editPerms} toggle={toggleEditPerm} /></div>)}
            <div className="shipping-edit-actions">
              <Button variant="secondary" size="small" onClick={() => setEditingStaff(null)}>Cancel</Button>
              <Button variant="primary" size="small" onClick={handleUpdate} loading={saving}>Save Changes</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
