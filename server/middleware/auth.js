/*
 * BLACKTRIBE FASHION — AUTH MIDDLEWARE v2.1
 *
 * v2.1: Login logging uses server-side in-memory cache.
 * Logs admin sign-in once per user per hour. Zero frontend changes needed.
 */

import { supabaseAdmin } from '../config/database.js';
import { createError } from './errorHandler.js';
import { logActivity, getRequestIp } from '../utils/activityLog.js';

/* ─── Login dedup cache ─── */
const loginCache = new Map();
const LOGIN_TTL = 60 * 60 * 1000; // 1 hour

function shouldLogLogin(userId) {
  const last = loginCache.get(userId);
  if (last && Date.now() - last < LOGIN_TTL) return false;
  loginCache.set(userId, Date.now());
  return true;
}

// Clean stale entries every 30 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, time] of loginCache) {
    if (now - time > LOGIN_TTL) loginCache.delete(key);
  }
}, 30 * 60 * 1000);


export async function attachUser(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) { req.user = null; return next(); }
  const token = authHeader.replace('Bearer ', '');

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) { req.user = null; return next(); }

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

export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return next(createError(401, 'Not authenticated.'));
  const token = authHeader.replace('Bearer ', '');

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) return next(createError(401, 'Not authenticated.'));

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

export function requireAdmin(req, res, next) {
  if (!req.user) return next(createError(401, 'Not authenticated.'));
  const { role } = req.user;
  if (role !== 'admin' && role !== 'superadmin') return next(createError(403, 'Access denied.'));

  /* Log admin login — once per user per hour, server-side dedup */
  if (shouldLogLogin(req.user.id)) {
    logActivity(supabaseAdmin, {
      userId: req.user.id,
      action: 'auth.login',
      details: { email: req.user.email, role: req.user.role },
      ip: getRequestIp(req),
    });
  }

  next();
}

export function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) return next(createError(401, 'Not authenticated.'));
    const { role, permissions } = req.user;
    if (role === 'superadmin') return next();
    if (role === 'admin' && permissions.includes(permission)) return next();
    return next(createError(403, 'Access denied.'));
  };
}
