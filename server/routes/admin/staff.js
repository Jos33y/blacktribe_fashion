/*
 * BLACKTRIBE FASHION — ADMIN: Staff Management + Activity Log
 * Superadmin only.
 */

import express from 'express';
import { supabaseAdmin } from '../../config/database.js';
import { createError } from '../../middleware/errorHandler.js';
import { logActivity, getRequestIp } from '../../utils/activityLog.js';

const router = express.Router();

/* Helper: superadmin guard */
function requireSuperadmin(req, res, next) {
  if (req.user?.role !== 'superadmin') {
    return next(createError(403, 'Superadmin access required.'));
  }
  next();
}


/* ═══ STAFF ═══ */

/* List all staff */
router.get('/staff', requireSuperadmin, async (req, res, next) => {
  try {
    const { data: profiles, error: profErr } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, phone, role, permissions, created_at')
      .in('role', ['admin', 'superadmin'])
      .order('created_at', { ascending: true });

    if (profErr) throw profErr;

    const { data: { users }, error: usersErr } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    if (usersErr) throw usersErr;

    const emailMap = {};
    (users || []).forEach((u) => { emailMap[u.id] = u.email; });

    const data = (profiles || []).map((p) => ({
      id: p.id,
      full_name: p.full_name,
      email: emailMap[p.id] || '—',
      phone: p.phone,
      role: p.role,
      permissions: p.permissions || [],
      created_at: p.created_at,
    }));

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

/* Create staff member */
router.post('/staff', requireSuperadmin, async (req, res, next) => {
  try {
    const { full_name, email, password, role, permissions } = req.body;

    if (!full_name?.trim()) return next(createError(400, 'Name is required.'));
    if (!email?.trim()) return next(createError(400, 'Email is required.'));
    if (!password) return next(createError(400, 'Password is required.'));
    if (!['admin', 'superadmin'].includes(role)) return next(createError(400, 'Role must be admin or superadmin.'));

    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim(),
      password,
      email_confirm: true,
      user_metadata: { full_name: full_name.trim() },
    });

    if (authErr) {
      if (authErr.message?.includes('already been registered')) {
        return next(createError(400, 'An account with this email already exists.'));
      }
      throw authErr;
    }

    const userId = authData.user.id;

    const profileData = {
      full_name: full_name.trim(),
      role,
      permissions: role === 'superadmin'
        ? ['products', 'orders', 'customers', 'collections', 'discounts', 'shipping', 'settings']
        : (permissions || []),
    };

    let profileUpdated = false;
    for (let attempt = 0; attempt < 6; attempt++) {
      const { data: updatedRow, error } = await supabaseAdmin
        .from('profiles')
        .update(profileData)
        .eq('id', userId)
        .select('id')
        .maybeSingle();

      if (!error && updatedRow) {
        profileUpdated = true;
        break;
      }

      if (attempt < 5) {
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
      }
    }

    if (!profileUpdated) {
      console.error(`[staff] Profile update failed for ${userId} after 6 retries.`);
      return next(createError(500, 'Account created but profile setup failed. Try editing the staff member to set their role.'));
    }

    res.status(201).json({ success: true, data: { id: userId, email: email.trim() } });
    logActivity(supabaseAdmin, { userId: req.user.id, action: 'staff.created', resourceType: 'staff', resourceId: userId, details: { email: email.trim(), name: full_name.trim(), role }, ip: getRequestIp(req) });
  } catch (err) {
    next(err);
  }
});

/* Update staff role + permissions */
router.put('/staff/:id', requireSuperadmin, async (req, res, next) => {
  try {
    const { role, permissions } = req.body;

    if (req.params.id === req.user.id) {
      return next(createError(400, 'Cannot edit your own role.'));
    }

    if (!['admin', 'superadmin'].includes(role)) {
      return next(createError(400, 'Role must be admin or superadmin.'));
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({
        role,
        permissions: role === 'superadmin'
          ? ['products', 'orders', 'customers', 'collections', 'discounts', 'shipping', 'settings']
          : (permissions || []),
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
    logActivity(supabaseAdmin, { userId: req.user.id, action: 'staff.updated', resourceType: 'staff', resourceId: req.params.id, details: { role, permissions: permissions || [] }, ip: getRequestIp(req) });
  } catch (err) {
    next(err);
  }
});

/* Revoke admin access */
router.delete('/staff/:id', requireSuperadmin, async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) {
      return next(createError(400, 'Cannot revoke your own access.'));
    }

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ role: 'customer', permissions: [] })
      .eq('id', req.params.id);

    if (error) throw error;

    res.json({ success: true });
    logActivity(supabaseAdmin, { userId: req.user.id, action: 'staff.revoked', resourceType: 'staff', resourceId: req.params.id, ip: getRequestIp(req) });
  } catch (err) {
    next(err);
  }
});


/* ═══ ACTIVITY LOG ═══ */

router.get('/activity', requireSuperadmin, async (req, res, next) => {
  try {
    const { page = 1, limit = 50, action_prefix } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabaseAdmin
      .from('activity_log')
      .select('*', { count: 'exact' });

    if (action_prefix && action_prefix !== 'all') {
      query = query.like('action', `${action_prefix}.%`);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    const { data: logs, count, error } = await query;
    if (error) throw error;

    /* Enrich with user names */
    const userIds = [...new Set((logs || []).map((l) => l.user_id).filter(Boolean))];
    let userMap = {};

    if (userIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      const emailMap = {};
      (users || []).forEach((u) => { emailMap[u.id] = u.email; });

      (profiles || []).forEach((p) => {
        userMap[p.id] = { name: p.full_name, email: emailMap[p.id] };
      });
    }

    const enriched = (logs || []).map((log) => ({
      ...log,
      user_name: userMap[log.user_id]?.name || null,
      user_email: userMap[log.user_id]?.email || null,
    }));

    res.json({ success: true, data: enriched, total: count, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    next(err);
  }
});

export default router;
