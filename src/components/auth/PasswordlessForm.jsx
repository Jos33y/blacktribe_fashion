import { useState } from 'react';
import useAuthStore from '../../store/authStore';
import CodeInput from './CodeInput';

/**
 * PasswordlessForm — Primary auth flow.
 * Step 1: Enter email → Send Code
 * Step 2: Enter 6-digit code → Verify
 */
export default function PasswordlessForm({ onSwitchToPassword, onSwitchToRegister, onSuccess }) {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState('email'); // 'email' | 'code'
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [localError, setLocalError] = useState('');

  const sendOtp = useAuthStore((s) => s.sendOtp);
  const verifyOtp = useAuthStore((s) => s.verifyOtp);
  const clearError = useAuthStore((s) => s.clearError);
  const storeError = useAuthStore((s) => s.error);

  const displayError = localError || storeError;

  /* ─── Send OTP ─── */
  const handleSendCode = async (e) => {
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

    setSending(true);
    const success = await sendOtp(trimmed);
    setSending(false);

    if (success) {
      setStep('code');
    }
  };

  /* ─── Verify OTP ─── */
  const handleVerify = async (codeValue) => {
    const token = codeValue || code;
    if (token.length !== 6) return;

    setLocalError('');
    clearError();
    setVerifying(true);

    const success = await verifyOtp(email.trim(), token);
    setVerifying(false);

    if (success) {
      onSuccess?.();
    }
  };

  /* ─── Resend Code ─── */
  const handleResend = async () => {
    setLocalError('');
    clearError();
    setSending(true);
    await sendOtp(email.trim());
    setSending(false);
  };

  /* ─── Back to email step ─── */
  const handleChangeEmail = () => {
    setStep('email');
    setCode('');
    setLocalError('');
    clearError();
  };

  return (
    <div className="auth-form">
      {step === 'email' ? (
        <form onSubmit={handleSendCode} noValidate>
          <div className="auth-form__field">
            <label className="auth-form__label" htmlFor="otp-email">
              Email
            </label>
            <input
              id="otp-email"
              type="email"
              className={`auth-form__input ${displayError ? 'auth-form__input--error' : ''}`}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setLocalError(''); }}
              autoComplete="email"
              autoFocus
              disabled={sending}
            />
          </div>

          {displayError && (
            <p className="auth-form__error" role="alert">{displayError}</p>
          )}

          <button
            type="submit"
            className="auth-form__submit"
            disabled={sending}
          >
            {sending ? 'Sending...' : 'Send Code'}
          </button>

          <div className="auth-form__links">
            <button
              type="button"
              className="auth-form__link"
              onClick={onSwitchToPassword}
            >
              Prefer a password?
            </button>
          </div>

          <div className="auth-form__links">
            <button
              type="button"
              className="auth-form__link"
              onClick={onSwitchToRegister}
            >
              Create an account
            </button>
          </div>
        </form>
      ) : (
        <div>
          <p className="auth-form__hint">
            We sent a 6-digit code to {email}.
            <br />Check your inbox.
          </p>

          <div className="auth-form__field">
            <label className="auth-form__label">
              Enter Code
            </label>
            <CodeInput
              onChange={setCode}
              onComplete={handleVerify}
              disabled={verifying}
              error={!!displayError}
            />
          </div>

          {displayError && (
            <p className="auth-form__error" role="alert">{displayError}</p>
          )}

          <button
            type="button"
            className="auth-form__submit"
            onClick={() => handleVerify(code)}
            disabled={verifying || code.length !== 6}
          >
            {verifying ? 'Verifying...' : 'Verify'}
          </button>

          <div className="auth-form__links">
            <button
              type="button"
              className="auth-form__link"
              onClick={handleResend}
              disabled={sending}
            >
              {sending ? 'Sending...' : 'Send a new code'}
            </button>
            <span className="auth-form__link-sep" aria-hidden="true" />
            <button
              type="button"
              className="auth-form__link"
              onClick={handleChangeEmail}
            >
              Change email
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
