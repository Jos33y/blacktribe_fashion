import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import useAuth from '../../hooks/useAuth';
import useAuthStore from '../../store/authStore';
import { useToast } from '../../components/ui/Toast';
import PasswordlessForm from '../../components/auth/PasswordlessForm';
import LoginForm from '../../components/auth/LoginForm';
import RegisterForm from '../../components/auth/RegisterForm';
import ForgotPasswordForm from '../../components/auth/ForgotPasswordForm';
import { setPageMeta, clearPageMeta } from '../../utils/pageMeta';
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
 *
 * Role-based redirect:
 *   admin/superadmin → /admin
 *   customer → /account (or returnTo if set)
 */
export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const profile = useAuthStore((s) => s.profile);
  const clearError = useAuthStore((s) => s.clearError);
  const { addToast } = useToast();

  /* ─── Detect password reset mode from URL ─── */
  const isResetMode = searchParams.get('reset') === 'true';
  const returnTo = searchParams.get('returnTo');

  const [view, setView] = useState(isResetMode ? 'reset' : 'otp');

  /* Track whether we just signed in (to show toast once) */
  const justSignedIn = useRef(false);

  /* ─── Page meta ─── */
  useEffect(() => {
    const titles = {
      otp: 'Sign In. BlackTribe Fashion.',
      password: 'Sign In. BlackTribe Fashion.',
      register: 'Create Account. BlackTribe Fashion.',
      forgot: 'Reset Password. BlackTribe Fashion.',
      reset: 'Reset Password. BlackTribe Fashion.',
    };
    setPageMeta({
      title: titles[view] || 'Sign In. BlackTribe Fashion.',
      description: 'Sign in or create your BlackTribe Fashion account.',
      path: '/auth',
    });
    return () => clearPageMeta();
  }, [view]);

  /* ─── Role-based redirect ───
   * Watches isAuthenticated AND profile.
   * Profile loads async after sign-in, so we wait for both.
   * This handles:
   *   1. Already logged in user visiting /auth → immediate redirect
   *   2. Just signed in → redirect after profile loads
   */
  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) return;
    if (isResetMode) return;

    /* Wait for profile to load so we know the role */
    if (!profile) return;

    const role = profile.role;
    const isAdminUser = role === 'admin' || role === 'superadmin';

    /* Show toast only on fresh sign-in, not on page revisit */
    if (justSignedIn.current) {
      justSignedIn.current = false;
      addToast(isAdminUser ? 'Signed in. Welcome back.' : 'Signed in.', 'success');
    }

    /* Route based on role */
    if (isAdminUser) {
      navigate(returnTo || '/admin', { replace: true });
    } else if (returnTo) {
      navigate(returnTo, { replace: true });
    } else {
      navigate('/account', { replace: true });
    }
  }, [isAuthenticated, loading, profile, isResetMode, navigate, returnTo]);

  /* ─── Clear errors on view switch ─── */
  const switchView = (newView) => {
    clearError();
    setView(newView);
  };

  /* ─── Auth success handlers ───
   * Don't navigate here. The useEffect above handles redirect
   * once profile loads. Just set the flag for the toast.
   */
  const handleSignInSuccess = () => {
    justSignedIn.current = true;
  };

  const handleRegisterSuccess = () => {
    justSignedIn.current = true;
  };

  const handleResetSuccess = () => {
    addToast('Password updated.', 'success');
    switchView('password');
  };

  /* ─── Don't render while checking auth state ─── */
  if (loading) return null;

  /* ─── Already authenticated (waiting for redirect from useEffect) ─── */
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
