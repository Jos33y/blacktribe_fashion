import { useState } from 'react';
import useAuthStore from '../../store/authStore';

/**
 * ForgotPasswordForm — Two modes:
 *
 * Mode "send" (default):
 *   Enter email → Send Reset Code → shows confirmation.
 *   Supabase sends a magic link to the email.
 *
 * Mode "reset" (when isResetMode=true, user clicked the email link):
 *   Enter new password + confirm → Reset Password.
 *   Uses updateUser({ password }) since session is already active.
 */
export default function ForgotPasswordForm({ isResetMode = false, onSwitchToLogin, onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');
  const [resetDone, setResetDone] = useState(false);

  const sendPasswordReset = useAuthStore((s) => s.sendPasswordReset);
  const updatePassword = useAuthStore((s) => s.updatePassword);
  const clearError = useAuthStore((s) => s.clearError);
  const storeError = useAuthStore((s) => s.error);

  const displayError = localError || storeError;

  /* ─── Send reset email ─── */
  const handleSendReset = async (e) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    const trimmed = email.trim();
    if (!trimmed) {
      setLocalError('Email is required.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setLocalError('Enter a valid email address.');
      return;
    }

    setSubmitting(true);
    const success = await sendPasswordReset(trimmed);
    setSubmitting(false);

    if (success) {
      setSent(true);
    }
  };

  /* ─── Set new password ─── */
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    if (!password) {
      setLocalError('Password is required.');
      return;
    }
    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setLocalError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    const success = await updatePassword(password);
    setSubmitting(false);

    if (success) {
      setResetDone(true);
    }
  };

  /* ─── Reset complete: show success ─── */
  if (resetDone) {
    return (
      <div className="auth-form">
        <p className="auth-form__success">Password updated. You can now sign in.</p>
        <div className="auth-form__links">
          <button
            type="button"
            className="auth-form__link"
            onClick={onSwitchToLogin}
          >
            Sign in
          </button>
        </div>
      </div>
    );
  }

  /* ─── Reset mode: new password form ─── */
  if (isResetMode) {
    return (
      <div className="auth-form">
        <form onSubmit={handleResetPassword} noValidate>
          <div className="auth-form__field">
            <label className="auth-form__label" htmlFor="reset-password">
              New Password
            </label>
            <input
              id="reset-password"
              type="password"
              className={`auth-form__input ${displayError ? 'auth-form__input--error' : ''}`}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setLocalError(''); }}
              autoComplete="new-password"
              autoFocus
              disabled={submitting}
            />
          </div>

          <div className="auth-form__field">
            <label className="auth-form__label" htmlFor="reset-confirm">
              Confirm New Password
            </label>
            <input
              id="reset-confirm"
              type="password"
              className={`auth-form__input`}
              value={confirm}
              onChange={(e) => { setConfirm(e.target.value); setLocalError(''); }}
              autoComplete="new-password"
              disabled={submitting}
            />
          </div>

          {displayError && (
            <p className="auth-form__error" role="alert">{displayError}</p>
          )}

          <button
            type="submit"
            className="auth-form__submit"
            disabled={submitting}
          >
            {submitting ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    );
  }

  /* ─── Send mode: email input ─── */
  if (sent) {
    return (
      <div className="auth-form">
        <p className="auth-form__hint">
          Code sent to {email}. Check your inbox and click the reset link.
        </p>
        <div className="auth-form__links">
          <button
            type="button"
            className="auth-form__link"
            onClick={onSwitchToLogin}
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-form">
      <form onSubmit={handleSendReset} noValidate>
        <div className="auth-form__field">
          <label className="auth-form__label" htmlFor="forgot-email">
            Email
          </label>
          <input
            id="forgot-email"
            type="email"
            className={`auth-form__input ${displayError ? 'auth-form__input--error' : ''}`}
            placeholder="you@example.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setLocalError(''); }}
            autoComplete="email"
            autoFocus
            disabled={submitting}
          />
        </div>

        {displayError && (
          <p className="auth-form__error" role="alert">{displayError}</p>
        )}

        <button
          type="submit"
          className="auth-form__submit"
          disabled={submitting}
        >
          {submitting ? 'Sending...' : 'Send Reset Code'}
        </button>

        <div className="auth-form__links">
          <button
            type="button"
            className="auth-form__link"
            onClick={onSwitchToLogin}
          >
            Back to sign in
          </button>
        </div>
      </form>
    </div>
  );
}
