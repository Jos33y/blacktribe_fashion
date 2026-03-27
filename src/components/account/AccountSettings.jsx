import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import useAuth from '../../hooks/useAuth';
import useAuthStore from '../../store/authStore';
import { useToast } from '../../components/ui/Toast';
import { supabase } from '../../utils/supabase';
import AddressBook from './AddressBook';

/**
 * AccountSettings — "Settings" tab.
 * Name, email (with verification + change), phone, password, addresses, sign out.
 */
export default function AccountSettings() {
  const navigate = useNavigate();
  const { user, profile, email, isAuthenticated } = useAuth();
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const updatePassword = useAuthStore((s) => s.updatePassword);
  const signOut = useAuthStore((s) => s.signOut);
  const { addToast } = useToast();

  /* ─── Name ─── */
  const [name, setName] = useState(profile?.full_name || '');
  const [savingName, setSavingName] = useState(false);
  const nameChanged = name !== (profile?.full_name || '');

  /* ─── Phone ─── */
  const [phone, setPhone] = useState(profile?.phone || '');
  const [savingPhone, setSavingPhone] = useState(false);
  const phoneChanged = phone !== (profile?.phone || '');

  useEffect(() => {
  if (profile) {
    setName(profile.full_name || '');
    setPhone(profile.phone || '');
  }
}, [profile]);

  /* ─── Email change ─── */
  const [showEmailEdit, setShowEmailEdit] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailError, setEmailError] = useState('');

  /* ─── Email verification ─── */
  const [verifyingSent, setVerifyingSent] = useState(false);
  const emailVerified = !!user?.email_confirmed_at;

  /* ─── Password ─── */
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  /* ═══ Save Name ═══ */
  const handleSaveName = async () => {
    setSavingName(true);
    const success = await updateProfile({ full_name: name.trim() || null });
    setSavingName(false);
    if (success) addToast('Name updated.', 'success');
  };

  /* ═══ Save Phone ═══ */
  const handleSavePhone = async () => {
    setSavingPhone(true);
    const success = await updateProfile({ phone: phone.trim() || null });
    setSavingPhone(false);
    if (success) addToast('Phone updated.', 'success');
  };

  /* ═══ Send Verification Email ═══ */
  const handleSendVerification = async () => {
    setVerifyingSent(false);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: user?.email,
    });
    if (error) {
      addToast('Could not send verification email.', 'error');
    } else {
      setVerifyingSent(true);
      addToast('Verification email sent. Check your inbox.', 'success');
    }
  };

  /* ═══ Change Email ═══ */
  const handleChangeEmail = async (e) => {
    e.preventDefault();
    setEmailError('');

    const trimmed = newEmail.trim();
    if (!trimmed) {
      setEmailError('Email is required.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError('Enter a valid email address.');
      return;
    }
    if (trimmed === user?.email) {
      setEmailError('This is your current email.');
      return;
    }

    setSavingEmail(true);
    const { error } = await supabase.auth.updateUser({ email: trimmed });
    setSavingEmail(false);

    if (error) {
      setEmailError(error.message);
    } else {
      addToast('Confirmation sent to new email. Check your inbox.', 'success');
      setShowEmailEdit(false);
      setNewEmail('');
    }
  };

  /* ═══ Change Password ═══ */
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (!newPassword) {
      setPasswordError('Password is required.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setSavingPassword(true);
    const success = await updatePassword(newPassword);
    setSavingPassword(false);

    if (success) {
      addToast('Password updated.', 'success');
      setShowPasswordForm(false);
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  /* ═══ Sign Out ═══ */
  const handleSignOut = async () => {
    await signOut();
    addToast('Signed out.', 'success');
    navigate('/', { replace: true });
  };

  return (
    <div className="account-settings">

      {/* ─── Name ─── */}
      <div className="account-settings__section">
        <label className="account-settings__label" htmlFor="settings-name">
          Name
        </label>
        <div className="account-settings__input-row">
          <input
            id="settings-name"
            type="text"
            className="account-settings__input"
            placeholder="Your name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          {nameChanged && (
            <button
              type="button"
              className="account-settings__save"
              onClick={handleSaveName}
              disabled={savingName}
            >
              {savingName ? 'Saving...' : 'Save'}
            </button>
          )}
        </div>
      </div>

      {/* ─── Email ─── */}
      <div className="account-settings__section">
        <label className="account-settings__label">
          Email
        </label>
        <div className="account-settings__email-display">
          <span className="account-settings__email">{email}</span>
          <span className={`account-settings__badge ${emailVerified ? 'account-settings__badge--verified' : 'account-settings__badge--unverified'}`}>
            {emailVerified ? 'Verified' : 'Not verified'}
          </span>
        </div>

        {!emailVerified && (
          <div className="account-settings__verify">
            <p className="account-settings__verify-hint">
              Verify your email to receive order updates and tracking details.
            </p>
            {verifyingSent ? (
              <p className="account-settings__verify-sent">Verification email sent. Check your inbox.</p>
            ) : (
              <button
                type="button"
                className="account-settings__verify-btn"
                onClick={handleSendVerification}
              >
                Verify Email
              </button>
            )}
          </div>
        )}

        {!showEmailEdit ? (
          <button
            type="button"
            className="account-settings__text-btn"
            onClick={() => setShowEmailEdit(true)}
          >
            Change email
          </button>
        ) : (
          <form onSubmit={handleChangeEmail} className="account-settings__inline-form">
            <input
              type="email"
              className="account-settings__input"
              placeholder="New email address"
              value={newEmail}
              onChange={(e) => { setNewEmail(e.target.value); setEmailError(''); }}
              autoFocus
            />
            {emailError && <p className="account-settings__error">{emailError}</p>}
            <div className="account-settings__inline-actions">
              <button type="submit" className="account-settings__save" disabled={savingEmail}>
                {savingEmail ? 'Saving...' : 'Update Email'}
              </button>
              <button
                type="button"
                className="account-settings__text-btn"
                onClick={() => { setShowEmailEdit(false); setEmailError(''); setNewEmail(''); }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ─── Phone ─── */}
      <div className="account-settings__section">
        <label className="account-settings__label" htmlFor="settings-phone">
          Phone
        </label>
        <div className="account-settings__input-row">
          <input
            id="settings-phone"
            type="tel"
            className="account-settings__input"
            placeholder="+234 800 000 0000 (optional)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          {phoneChanged && (
            <button
              type="button"
              className="account-settings__save"
              onClick={handleSavePhone}
              disabled={savingPhone}
            >
              {savingPhone ? 'Saving...' : 'Save'}
            </button>
          )}
        </div>
      </div>

      {/* ─── Saved Addresses ─── */}
      <div className="account-settings__section">
        <h3 className="account-settings__section-title">Saved Addresses</h3>
        <AddressBook />
      </div>

      {/* ─── Password ─── */}
      <div className="account-settings__section">
        <h3 className="account-settings__section-title">Password</h3>
        {!showPasswordForm ? (
          <button
            type="button"
            className="account-settings__text-btn"
            onClick={() => setShowPasswordForm(true)}
          >
            {profile?.has_password ? 'Change Password' : 'Set a Password'}
          </button>
        ) : (
          <form onSubmit={handleChangePassword} className="account-settings__inline-form">
            <input
              type="password"
              className="account-settings__input"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setPasswordError(''); }}
              autoComplete="new-password"
            />
            <input
              type="password"
              className="account-settings__input"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(''); }}
              autoComplete="new-password"
            />
            {passwordError && <p className="account-settings__error">{passwordError}</p>}
            <div className="account-settings__inline-actions">
              <button type="submit" className="account-settings__save" disabled={savingPassword}>
                {savingPassword ? 'Saving...' : 'Update Password'}
              </button>
              <button
                type="button"
                className="account-settings__text-btn"
                onClick={() => { setShowPasswordForm(false); setPasswordError(''); setNewPassword(''); setConfirmPassword(''); }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ─── Sign Out ─── */}
      <div className="account-settings__section account-settings__section--last">
        <button
          type="button"
          className="account-settings__signout"
          onClick={handleSignOut}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
