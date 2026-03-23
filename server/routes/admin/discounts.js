/*
 * BLACKTRIBE FASHION — ADMIN: Discounts CRUD
 */

import express from 'express';
import { requirePermission } from '../../middleware/auth.js';
import { supabaseAdmin } from '../../config/database.js';
import { createError } from '../../middleware/errorHandler.js';

const router = express.Router();

router.get('/discounts', requirePermission('discounts'), async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('discounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (err) {
    next(err);
  }
});

router.post('/discounts', requirePermission('discounts'), async (req, res, next) => {
  try {
    const { code, type, value, min_order, usage_limit, starts_at, expires_at, is_active } = req.body;
    if (!code?.trim()) return next(createError(400, 'Discount code is required.'));
    if (!value || value <= 0) return next(createError(400, 'Value must be greater than 0.'));

    const { data, error } = await supabaseAdmin
      .from('discounts')
      .insert({
        code: code.trim().toUpperCase(),
        type: type || 'percentage',
        value,
        min_order: min_order || null,
        usage_limit: usage_limit || null,
        times_used: 0,
        starts_at: starts_at || null,
        expires_at: expires_at || null,
        is_active: is_active !== false,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return next(createError(400, 'A discount with this code already exists.'));
      throw error;
    }
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
});

router.put('/discounts/:id', requirePermission('discounts'), async (req, res, next) => {
  try {
    const { code, type, value, min_order, usage_limit, starts_at, expires_at, is_active } = req.body;
    const updates = {};
    if (code !== undefined) updates.code = code.trim().toUpperCase();
    if (type !== undefined) updates.type = type;
    if (value !== undefined) updates.value = value;
    if (min_order !== undefined) updates.min_order = min_order;
    if (usage_limit !== undefined) updates.usage_limit = usage_limit;
    if (starts_at !== undefined) updates.starts_at = starts_at;
    if (expires_at !== undefined) updates.expires_at = expires_at;
    if (is_active !== undefined) updates.is_active = is_active;

    const { data, error } = await supabaseAdmin
      .from('discounts')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return next(createError(400, 'A discount with this code already exists.'));
      throw error;
    }
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

export default router;
