import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import useAuth from '../../hooks/useAuth';
import useAuthStore from '../../store/authStore';
import { useToast } from '../../components/ui/Toast';
import PasswordlessForm from '../../components/auth/PasswordlessForm';
import LoginForm from '../../components/auth/LoginForm';
import RegisterForm from '../../components/auth/RegisterForm';
import ForgotPasswordForm from '../../components/auth/ForgotPasswordForm';
import '../../styles/pages/Auth.css';

/**
 * Auth — Single page, multiple views.
 * URL stays /auth. View state managed internally.
 *
 * Views:
 *   'otp'       — Passwordless email code (default)
 *   'password'  — Email + password login
 *   'register'  — Create account
 *   'forgot'    — Send reset email
 *   'reset'     — Set new password (after clicking reset link)
 */
export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, loading } = useAuth();
  const clearError = useAuthStore((s) => s.clearError);
  const { addToast } = useToast();

  /* ─── Detect password reset mode from URL ─── */
  const isResetMode = searchParams.get('reset') === 'true';

  const [view, setView] = useState(isResetMode ? 'reset' : 'otp');

  /* ─── Page title ─── */
  useEffect(() => {
    const titles = {
      otp: 'Sign In. BlackTribe Fashion.',
      password: 'Sign In. BlackTribe Fashion.',
      register: 'Create Account. BlackTribe Fashion.',
      forgot: 'Reset Password. BlackTribe Fashion.',
      reset: 'Reset Password. BlackTribe Fashion.',
    };
    document.title = titles[view] || 'Sign In. BlackTribe Fashion.';
    return () => { document.title = 'BlackTribe Fashion. Redefining Luxury.'; };
  }, [view]);

  /* ─── Redirect if already authenticated ─── */
  useEffect(() => {
    if (!loading && isAuthenticated && !isResetMode) {
      navigate('/account', { replace: true });
    }
  }, [isAuthenticated, loading, isResetMode, navigate]);

  /* ─── Clear errors on view switch ─── */
  const switchView = (newView) => {
    clearError();
    setView(newView);
  };

  /* ─── Auth success handlers ─── */
  const handleSignInSuccess = () => {
    addToast('Signed in.', 'success');
    navigate('/account', { replace: true });
  };

  const handleRegisterSuccess = () => {
    addToast('Account created. Welcome to the Tribe.', 'success');
    navigate('/account', { replace: true });
  };

  const handleResetSuccess = () => {
    addToast('Password updated.', 'success');
    switchView('password');
  };

  /* ─── Don't render while checking auth state ─── */
  if (loading) return null;

  /* ─── Already authenticated (brief flash before redirect) ─── */
  if (isAuthenticated && !isResetMode) return null;

  /* ─── View titles ─── */
  const headings = {
    otp: 'Sign In',
    password: 'Sign In',
    register: 'Create Account',
    forgot: 'Reset Password',
    reset: 'Reset Password',
  };

  return (
    <div className="auth page-enter">
      <div className="auth__inner">
        <h1 className="auth__title">{headings[view]}</h1>

        {view === 'otp' && (
          <PasswordlessForm
            onSwitchToPassword={() => switchView('password')}
            onSwitchToRegister={() => switchView('register')}
            onSuccess={handleSignInSuccess}
          />
        )}

        {view === 'password' && (
          <LoginForm
            onSwitchToOtp={() => switchView('otp')}
            onSwitchToRegister={() => switchView('register')}
            onForgotPassword={() => switchView('forgot')}
            onSuccess={handleSignInSuccess}
          />
        )}

        {view === 'register' && (
          <RegisterForm
            onSwitchToOtp={() => switchView('otp')}
            onSwitchToLogin={() => switchView('otp')}
            onSuccess={handleRegisterSuccess}
          />
        )}

        {(view === 'forgot' || view === 'reset') && (
          <ForgotPasswordForm
            isResetMode={view === 'reset'}
            onSwitchToLogin={() => switchView('otp')}
            onSuccess={handleResetSuccess}
          />
        )}
      </div>
    </div>
  );
}
