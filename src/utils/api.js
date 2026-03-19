/*
 * BLACKTRIBE FASHION — API UTILITY
 * Fetch wrapper that injects auth token from authStore.
 *
 * Usage:
 *   import { api } from '../utils/api';
 *   const result = await api('/api/orders');
 *   const result = await api('/api/auth/profile', { method: 'PUT', body: { full_name: 'Blaq' } });
 */

import useAuthStore from '../store/authStore';

const BASE = '';  // Same origin — no prefix needed

/**
 * Authenticated fetch wrapper.
 * Automatically adds Authorization header if user is signed in.
 * Parses JSON response.
 * Throws on network error.
 */
export async function api(path, options = {}) {
  const token = useAuthStore.getState().getAccessToken();

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json();

  if (!res.ok) {
    const error = new Error(data.error || 'Something went wrong.');
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}
