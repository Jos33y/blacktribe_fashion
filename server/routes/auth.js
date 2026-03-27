/*
 * BLACKTRIBE FASHION — AUTH ROUTES
 *
 * These are NOT login/register endpoints.
 * Supabase handles auth client-side.
 *
 * These routes handle:
 *   GET  /api/auth/me       — current user profile
 *   PUT  /api/auth/profile  — update profile (name, phone)
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { supabaseAdmin } from '../config/database.js';
import { createError } from '../middleware/errorHandler.js';

const router = Router();


/* ─── GET /api/auth/me ─── */
/* Returns current user profile. Used to verify auth state server-side. */

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('full_name, phone, role, permissions')
      .eq('id', req.user.id)
      .single();

    if (error) {
      return next(createError(500, 'Could not fetch profile.'));
    }

    res.json({
      success: true,
      data: {
        id: req.user.id,
        email: req.user.email,
        full_name: profile?.full_name || null,
        phone: profile?.phone || null,
        role: profile?.role || 'customer',
        permissions: profile?.permissions || [],
      },
    });
  } catch (err) {
    next(err);
  }
});


/* ─── PUT /api/auth/profile ─── */
/* Update name and phone. Cannot change email, role, or permissions. */

router.put('/profile', requireAuth, async (req, res, next) => {
  try {
    const { full_name, phone } = req.body;

    // Build updates object — only include provided fields
    const updates = {};
    if (full_name !== undefined) {
      if (typeof full_name !== 'string') {
        return next(createError(400, 'Name must be a string.'));
      }
      updates.full_name = full_name.trim() || null;
    }
    if (phone !== undefined) {
      if (typeof phone !== 'string') {
        return next(createError(400, 'Phone must be a string.'));
      }
      updates.phone = phone.trim() || null;
    }

    if (Object.keys(updates).length === 0) {
      return next(createError(400, 'No fields to update.'));
    }

    const { error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', req.user.id);

    if (error) {
      console.error('[auth] Profile update failed:', error);
      return next(createError(500, 'Could not update profile.'));
    }

    // Sync to auth.users metadata
    try {
      const metadata = {};
      if (updates.full_name !== undefined) metadata.full_name = updates.full_name;
      if (updates.phone !== undefined) metadata.phone = updates.phone;
      await supabaseAdmin.auth.admin.updateUserById(req.user.id, {
        user_metadata: metadata,
      });
    } catch (syncErr) {
      console.warn('[auth] Could not sync to auth.users:', syncErr.message);
    }
    res.json({
      success: true,
      data: updates,
    });
  } catch (err) {
    next(err);
  }
});


/* ═══════════════════════════════════════════════════════════
   ADDRESSES — Saved shipping addresses
   ═══════════════════════════════════════════════════════════ */


/* ─── GET /api/auth/addresses ─── */

router.get('/addresses', requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('addresses')
      .select('*')
      .eq('user_id', req.user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      return next(createError(500, 'Could not fetch addresses.'));
    }

    res.json({ success: true, data: data || [] });
  } catch (err) {
    next(err);
  }
});


/* ─── POST /api/auth/addresses ─── */

router.post('/addresses', requireAuth, async (req, res, next) => {
  try {
    const { label, full_name, street, city, state, lga, phone } = req.body;

    if (!full_name?.trim() || !street?.trim() || !city?.trim() || !state?.trim()) {
      return next(createError(400, 'Full name, street, city, and state are required.'));
    }

    // Check if this is the first address — make it default
    const { count } = await supabaseAdmin
      .from('addresses')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', req.user.id);

    const isFirst = count === 0;

    const { data, error } = await supabaseAdmin
      .from('addresses')
      .insert({
        user_id: req.user.id,
        label: label?.trim() || null,
        full_name: full_name.trim(),
        street: street.trim(),
        city: city.trim(),
        state: state.trim(),
        lga: lga?.trim() || null,
        phone: phone?.trim() || null,
        is_default: isFirst,
      })
      .select()
      .single();

    if (error) {
      console.error('[addresses] Insert failed:', error);
      return next(createError(500, 'Could not save address.'));
    }

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});


/* ─── PUT /api/auth/addresses/:id ─── */

router.put('/addresses/:id', requireAuth, async (req, res, next) => {
  try {
    const { label, full_name, street, city, state, lga, phone } = req.body;

    const updates = {};
    if (label !== undefined) updates.label = label?.trim() || null;
    if (full_name !== undefined) updates.full_name = full_name.trim();
    if (street !== undefined) updates.street = street.trim();
    if (city !== undefined) updates.city = city.trim();
    if (state !== undefined) updates.state = state.trim();
    if (lga !== undefined) updates.lga = lga?.trim() || null;
    if (phone !== undefined) updates.phone = phone?.trim() || null;

    const { error } = await supabaseAdmin
      .from('addresses')
      .update(updates)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) {
      return next(createError(500, 'Could not update address.'));
    }

    res.json({ success: true, data: updates });
  } catch (err) {
    next(err);
  }
});


/* ─── DELETE /api/auth/addresses/:id ─── */

router.delete('/addresses/:id', requireAuth, async (req, res, next) => {
  try {
    const { error } = await supabaseAdmin
      .from('addresses')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) {
      return next(createError(500, 'Could not remove address.'));
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});


/* ─── PUT /api/auth/addresses/:id/default ─── */

router.put('/addresses/:id/default', requireAuth, async (req, res, next) => {
  try {
    // Unset all defaults for this user
    await supabaseAdmin
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', req.user.id);

    // Set the new default
    const { error } = await supabaseAdmin
      .from('addresses')
      .update({ is_default: true })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) {
      return next(createError(500, 'Could not set default address.'));
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});


export default router;