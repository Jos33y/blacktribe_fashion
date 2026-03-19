import { useState } from 'react';
import useAuthStore from '../../store/authStore';

/**
 * RegisterForm — Create account with email + password.
 * "Already have an account? Sign in" switches to login.
 */
export default function RegisterForm({ onSwitchToOtp, onSwitchToLogin, onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  const signUp = useAuthStore((s) => s.signUp);
  const clearError = useAuthStore((s) => s.clearError);
  const storeError = useAuthStore((s) => s.error);

  const displayError = localError || storeError;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setLocalError('Email is required.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setLocalError('Enter a valid email address.');
      return;
    }
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
    const success = await signUp(trimmedEmail, password);
    setSubmitting(false);

    if (success) {
      onSuccess?.();
    }
  };

  return (
    <div className="auth-form">
      <form onSubmit={handleSubmit} noValidate>
        <div className="auth-form__field">
          <label className="auth-form__label" htmlFor="register-email">
            Email
          </label>
          <input
            id="register-email"
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

        <div className="auth-form__field">
          <label className="auth-form__label" htmlFor="register-password">
            Password
          </label>
          <input
            id="register-password"
            type="password"
            className={`auth-form__input`}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setLocalError(''); }}
            autoComplete="new-password"
            disabled={submitting}
          />
        </div>

        <div className="auth-form__field">
          <label className="auth-form__label" htmlFor="register-confirm">
            Confirm Password
          </label>
          <input
            id="register-confirm"
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
          {submitting ? 'Creating account...' : 'Create Account'}
        </button>

        <div className="auth-form__links">
          <span className="auth-form__link-text">Already have an account?</span>
          <button
            type="button"
            className="auth-form__link"
            onClick={onSwitchToLogin}
          >
            Sign in
          </button>
        </div>

        <div className="auth-form__links">
          <button
            type="button"
            className="auth-form__link"
            onClick={onSwitchToOtp}
          >
            Use a code instead
          </button>
        </div>
      </form>
    </div>
  );
}
