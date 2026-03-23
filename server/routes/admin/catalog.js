/*
 * BLACKTRIBE FASHION — ADMIN: Categories + Collections CRUD
 */

import express from 'express';
import { requirePermission } from '../../middleware/auth.js';
import { supabaseAdmin } from '../../config/database.js';
import { createError } from '../../middleware/errorHandler.js';

const router = express.Router();


/* ═══ CATEGORIES ═══ */

router.get('/categories', async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('id, name, slug, sort_order, is_active')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (err) {
    next(err);
  }
});

router.post('/categories', requirePermission('products'), async (req, res, next) => {
  try {
    const { name, slug, sort_order, is_active } = req.body;
    if (!name?.trim()) return next(createError(400, 'Category name is required.'));

    const { data, error } = await supabaseAdmin
      .from('categories')
      .insert({
        name: name.trim(),
        slug: slug?.trim() || name.trim().toLowerCase().replace(/\s+/g, '-'),
        sort_order: sort_order ?? 0,
        is_active: is_active !== false,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return next(createError(400, 'A category with this slug already exists.'));
      throw error;
    }
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.put('/categories/:id', requirePermission('products'), async (req, res, next) => {
  try {
    const { name, slug, sort_order, is_active } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (slug !== undefined) updates.slug = slug.trim();
    if (sort_order !== undefined) updates.sort_order = sort_order;
    if (is_active !== undefined) updates.is_active = is_active;

    const { data, error } = await supabaseAdmin
      .from('categories')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return next(createError(400, 'A category with this slug already exists.'));
      throw error;
    }
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});


/* ═══ COLLECTIONS ═══ */

router.get('/collections', requirePermission('collections'), async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('collections')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (err) {
    next(err);
  }
});

router.post('/collections', requirePermission('collections'), async (req, res, next) => {
  try {
    const { name, slug, description, season, start_date, end_date, is_active, image_url } = req.body;
    if (!name?.trim()) return next(createError(400, 'Collection name is required.'));

    const { data, error } = await supabaseAdmin
      .from('collections')
      .insert({
        name: name.trim(),
        slug: slug?.trim() || name.trim().toLowerCase().replace(/\s+/g, '-'),
        description: description || null,
        image_url: image_url || null,
        season: season || null,
        start_date: start_date || null,
        end_date: end_date || null,
        is_active: is_active !== false,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return next(createError(400, 'A collection with this slug already exists.'));
      throw error;
    }
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.put('/collections/:id', requirePermission('collections'), async (req, res, next) => {
  try {
    const { name, slug, description, season, start_date, end_date, is_active, image_url } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (slug !== undefined) updates.slug = slug.trim();
    if (description !== undefined) updates.description = description || null;
    if (image_url !== undefined) updates.image_url = image_url || null;
    if (season !== undefined) updates.season = season || null;
    if (start_date !== undefined) updates.start_date = start_date || null;
    if (end_date !== undefined) updates.end_date = end_date || null;
    if (is_active !== undefined) updates.is_active = is_active;

    const { data, error } = await supabaseAdmin
      .from('collections')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return next(createError(400, 'A collection with this slug already exists.'));
      throw error;
    }
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

export default router;
