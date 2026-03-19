/*
 * BLACKTRIBE FASHION — AUTH MIDDLEWARE
 *
 * Verifies Supabase JWT from Authorization header.
 * Attaches user and profile data to req.
 *
 * Two variants:
 *   requireAuth  — 401 if not authenticated
 *   requireAdmin — 403 if not admin/superadmin
 *
 * Flow:
 *   1. Extract Bearer token from Authorization header
 *   2. supabaseAdmin.auth.getUser(token) to verify
 *   3. Fetch profile from profiles table (role, permissions)
 *   4. Attach req.user = { id, email, role, permissions }
 *   5. next()
 */

import { supabaseAdmin } from '../config/database.js';
import { createError } from './errorHandler.js';

/**
 * Extract and verify JWT. Attach user to req.
 * Does NOT reject unauthenticated requests — use requireAuth for that.
 */
export async function attachUser(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    // Verify token with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      req.user = null;
      return next();
    }

    // Fetch profile for role and permissions
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name, role, permissions')
      .eq('id', user.id)
      .single();

    req.user = {
      id: user.id,
      email: user.email,
      role: profile?.role || 'customer',
      permissions: profile?.permissions || [],
      full_name: profile?.full_name || null,
    };

    next();
  } catch (err) {
    console.error('[auth] Token verification failed:', err);
    req.user = null;
    next();
  }
}

/**
 * Require authenticated user. 401 if not.
 */
export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(createError(401, 'Not authenticated.'));
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return next(createError(401, 'Not authenticated.'));
    }

    // Fetch profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name, phone, role, permissions')
      .eq('id', user.id)
      .single();

    req.user = {
      id: user.id,
      email: user.email,
      role: profile?.role || 'customer',
      permissions: profile?.permissions || [],
      full_name: profile?.full_name || null,
      phone: profile?.phone || null,
    };

    next();
  } catch (err) {
    console.error('[auth] Token verification failed:', err);
    return next(createError(401, 'Not authenticated.'));
  }
}

/**
 * Require admin or superadmin role. 403 if not.
 * Must be used after requireAuth.
 */
export function requireAdmin(req, res, next) {
  if (!req.user) {
    return next(createError(401, 'Not authenticated.'));
  }

  const { role } = req.user;
  if (role !== 'admin' && role !== 'superadmin') {
    return next(createError(403, 'Access denied.'));
  }

  next();
}

/**
 * Require a specific permission. 403 if not.
 * Superadmin always passes. Admin checks permissions array.
 * Must be used after requireAuth.
 *
 * Usage: requirePermission('products')
 */
export function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return next(createError(401, 'Not authenticated.'));
    }

    const { role, permissions } = req.user;

    // Superadmin has all permissions
    if (role === 'superadmin') {
      return next();
    }

    // Admin checks permissions array
    if (role === 'admin' && permissions.includes(permission)) {
      return next();
    }

    return next(createError(403, 'Access denied.'));
  };
}
