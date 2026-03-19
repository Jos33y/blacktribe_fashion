/*
 * BLACKTRIBE FASHION — useAuth Hook
 * Convenience wrapper around authStore.
 * Components import this instead of reaching into the store directly.
 */

import useAuthStore from '../store/authStore';

export default function useAuth() {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const session = useAuthStore((s) => s.session);
  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);

  const isAuthenticated = session !== null;
  const role = profile?.role || 'customer';
  const isAdmin = role === 'admin' || role === 'superadmin';
  const isSuperAdmin = role === 'superadmin';

  return {
    user,
    profile,
    session,
    loading,
    error,
    isAuthenticated,
    isAdmin,
    isSuperAdmin,
    role,
    displayName: profile?.full_name || user?.email?.split('@')[0] || '',
    email: user?.email || '',
  };
}
