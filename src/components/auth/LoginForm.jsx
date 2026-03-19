import { useState } from 'react';
import useAuthStore from '../../store/authStore';

/**
 * LoginForm — Email + password sign in.
 * Secondary auth flow. "Use a code instead" switches back to OTP.
 */
export default function LoginForm({ onSwitchToOtp, onSwitchToRegister, onForgotPassword, onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  const signInWithPassword = useAuthStore((s) => s.signInWithPassword);
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

    setSubmitting(true);
    const success = await signInWithPassword(trimmedEmail, password);
    setSubmitting(false);

    if (success) {
      onSuccess?.();
    }
  };

  return (
    <div className="auth-form">
      <form onSubmit={handleSubmit} noValidate>
        <div className="auth-form__field">
          <label className="auth-form__label" htmlFor="login-email">
            Email
          </label>
          <input
            id="login-email"
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
          <label className="auth-form__label" htmlFor="login-password">
            Password
          </label>
          <input
            id="login-password"
            type="password"
            className={`auth-form__input ${displayError ? 'auth-form__input--error' : ''}`}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setLocalError(''); }}
            autoComplete="current-password"
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
          {submitting ? 'Signing in...' : 'Sign In'}
        </button>

        <div className="auth-form__links">
          <button
            type="button"
            className="auth-form__link"
            onClick={onForgotPassword}
          >
            Forgot password?
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
          <span className="auth-form__link-sep" aria-hidden="true" />
          <button
            type="button"
            className="auth-form__link"
            onClick={onSwitchToRegister}
          >
            Create an account
          </button>
        </div>
      </form>
    </div>
  );
}
