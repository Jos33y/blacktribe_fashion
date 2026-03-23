/*
 * BLACKTRIBE FASHION — ADMIN: Products CRUD
 */

import express from 'express';
import { requirePermission } from '../../middleware/auth.js';
import { supabaseAdmin } from '../../config/database.js';
import { createError } from '../../middleware/errorHandler.js';
import { logActivity, getRequestIp } from '../../utils/activityLog.js';

const router = express.Router();

/* List products */
router.get('/products', requirePermission('products'), async (req, res, next) => {
  try {
    const { search, category, collection, status, sort, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabaseAdmin
      .from('products')
      .select('*, categories(name, slug), collections(name, slug)', { count: 'exact' });

    if (status === 'active') query = query.eq('is_active', true);
    else if (status === 'inactive') query = query.eq('is_active', false);
    if (category) query = query.eq('category_id', category);
    if (collection) query = query.eq('collection_id', collection);
    if (search) query = query.ilike('name', `%${search}%`);

    if (sort === 'price_asc') query = query.order('price', { ascending: true });
    else if (sort === 'price_desc') query = query.order('price', { ascending: false });
    else if (sort === 'name') query = query.order('name', { ascending: true });
    else query = query.order('created_at', { ascending: false });

    query = query.range(offset, offset + parseInt(limit) - 1);

    const { data, count, error } = await query;
    if (error) throw error;

    res.json({ success: true, data, total: count, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    next(err);
  }
});

/* Get single product */
router.get('/products/:id', requirePermission('products'), async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*, categories(id, name, slug), collections(id, name, slug)')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!data) return next(createError(404, 'Product not found.'));

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

/* Create product */
router.post('/products', requirePermission('products'), async (req, res, next) => {
  try {
    const {
      name, slug, short_description, description, price, compare_at_price,
      category_id, collection_id, images, sizes, colors, badge,
      video_url, is_featured, is_active, show_inventory,
      total_inventory, preorder_deadline,
    } = req.body;

    if (!name?.trim()) return next(createError(400, 'Product name is required.'));
    if (!slug?.trim()) return next(createError(400, 'Slug is required.'));
    if (!price || price <= 0) return next(createError(400, 'Price must be greater than 0.'));
    if (!images || images.length === 0) return next(createError(400, 'At least one image is required.'));
    if (!sizes || sizes.length === 0) return next(createError(400, 'At least one size is required.'));

    const { data: existing } = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('slug', slug.trim())
      .single();

    if (existing) return next(createError(400, 'A product with this slug already exists.'));

    const { data, error } = await supabaseAdmin
      .from('products')
      .insert({
        name: name.trim(),
        slug: slug.trim(),
        short_description: short_description || null,
        description: description || null,
        price,
        compare_at_price: compare_at_price || null,
        category_id: category_id || null,
        collection_id: collection_id || null,
        images: images || [],
        sizes: sizes || [],
        colors: colors || null,
        tags: [],
        badge: badge || null,
        video_url: video_url || null,
        is_featured: is_featured || false,
        is_active: is_active !== false,
        show_inventory: show_inventory || false,
        total_inventory: total_inventory || null,
        preorder_deadline: preorder_deadline || null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return next(createError(400, 'A product with this slug already exists.'));
      throw error;
    }

    res.status(201).json({ success: true, data });
    logActivity(supabaseAdmin, { userId: req.user.id, action: 'product.created', resourceType: 'product', resourceId: data.id, details: { name: data.name, price: data.price }, ip: getRequestIp(req) });
  } catch (err) {
    next(err);
  }
});

/* Update product */
router.put('/products/:id', requirePermission('products'), async (req, res, next) => {
  try {
    const {
      name, slug, short_description, description, price, compare_at_price,
      category_id, collection_id, images, sizes, colors, badge,
      video_url, is_featured, is_active, show_inventory,
      total_inventory, preorder_deadline,
    } = req.body;

    const updates = { updated_at: new Date().toISOString() };

    if (name !== undefined) updates.name = name.trim();
    if (slug !== undefined) updates.slug = slug.trim();
    if (short_description !== undefined) updates.short_description = short_description || null;
    if (description !== undefined) updates.description = description || null;
    if (price !== undefined) updates.price = price;
    if (compare_at_price !== undefined) updates.compare_at_price = compare_at_price || null;
    if (category_id !== undefined) updates.category_id = category_id || null;
    if (collection_id !== undefined) updates.collection_id = collection_id || null;
    if (images !== undefined) updates.images = images;
    if (sizes !== undefined) updates.sizes = sizes;
    if (colors !== undefined) updates.colors = colors || null;
    if (badge !== undefined) updates.badge = badge || null;
    if (video_url !== undefined) updates.video_url = video_url || null;
    if (is_featured !== undefined) updates.is_featured = is_featured;
    if (is_active !== undefined) updates.is_active = is_active;
    if (show_inventory !== undefined) updates.show_inventory = show_inventory;
    if (total_inventory !== undefined) updates.total_inventory = total_inventory || null;
    if (preorder_deadline !== undefined) updates.preorder_deadline = preorder_deadline || null;

    if (updates.slug) {
      const { data: existing } = await supabaseAdmin
        .from('products')
        .select('id')
        .eq('slug', updates.slug)
        .neq('id', req.params.id)
        .single();

      if (existing) return next(createError(400, 'A product with this slug already exists.'));
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return next(createError(400, 'A product with this slug already exists.'));
      throw error;
    }

    res.json({ success: true, data });
    logActivity(supabaseAdmin, { userId: req.user.id, action: 'product.updated', resourceType: 'product', resourceId: data.id, details: { name: data.name }, ip: getRequestIp(req) });
  } catch (err) {
    next(err);
  }
});

/* Soft delete product */
router.delete('/products/:id', requirePermission('products'), async (req, res, next) => {
  try {
    const { error } = await supabaseAdmin
      .from('products')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true });
    logActivity(supabaseAdmin, { userId: req.user.id, action: 'product.deactivated', resourceType: 'product', resourceId: req.params.id, ip: getRequestIp(req) });
  } catch (err) {
    next(err);
  }
});

export default router;
