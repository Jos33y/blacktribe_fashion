/*
 * BLACKTRIBE FASHION — PUBLIC PRODUCTS API
 *
 * GET /api/products          — list with filters, sort, pagination
 * GET /api/products/:slug    — single product by slug
 * GET /api/products/:slug/related — 4 related products (same category)
 *
 * Uses public Supabase client (respects RLS).
 * All prices in kobo. Frontend converts to ₦.
 */

import express from 'express';
import { supabase, supabaseAdmin } from '../config/database.js';

const router = express.Router();


/* ─── List products ─── */

router.get('/', async (req, res, next) => {
  try {
    const {
      category, collection, search, badge,
      price_min, price_max, size,
      sort = 'newest',
      page = 1, limit = 24,
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabaseAdmin
      .from('products')
      .select('*, categories(name, slug)', { count: 'exact' })
      .eq('is_active', true);

    /* Filters */
    if (category) {
      /* Category can be a slug or UUID */
      const isUuid = category.match(/^[0-9a-f]{8}-/i);
      if (isUuid) {
        query = query.eq('category_id', category);
      } else {
        /* Resolve slug to ID */
        const { data: cat } = await supabaseAdmin
          .from('categories')
          .select('id')
          .eq('slug', category)
          .eq('is_active', true)
          .single();
        if (cat) {
          query = query.eq('category_id', cat.id);
        } else {
          return res.json({ success: true, data: [], total: 0, page: parseInt(page), limit: parseInt(limit) });
        }
      }
    }

    if (collection) {
      const isUuid = collection.match(/^[0-9a-f]{8}-/i);
      if (isUuid) {
        query = query.eq('collection_id', collection);
      } else {
        const { data: col } = await supabaseAdmin
          .from('collections')
          .select('id')
          .eq('slug', collection)
          .eq('is_active', true)
          .single();
        if (col) {
          query = query.eq('collection_id', col.id);
        } else {
          return res.json({ success: true, data: [], total: 0, page: parseInt(page), limit: parseInt(limit) });
        }
      }
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,short_description.ilike.%${search}%,tags.cs.{${search.toLowerCase()}}`);
    }

    if (badge) {
      query = query.eq('badge', badge.toUpperCase());
    }

    if (price_min) {
      query = query.gte('price', parseInt(price_min));
    }

    if (price_max) {
      query = query.lte('price', parseInt(price_max));
    }

    /* Sort */
    switch (sort) {
      case 'price_asc':
        query = query.order('price', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('price', { ascending: false });
        break;
      case 'name':
        query = query.order('name', { ascending: true });
        break;
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    /* Pagination */
    query = query.range(offset, offset + parseInt(limit) - 1);

    const { data, count, error } = await query;
    if (error) throw error;

    /* If size filter requested, filter in-memory (sizes is jsonb) */
    let filtered = data || [];
    if (size) {
      filtered = filtered.filter((p) =>
        p.sizes?.some((s) => s.size === size && s.stock > 0)
      );
    }

    res.json({
      success: true,
      data: filtered,
      total: size ? filtered.length : count,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    next(err);
  }
});


/* ─── Single product by slug ─── */

router.get('/:slug', async (req, res, next) => {
  try {
    const { data: product, error } = await supabaseAdmin
      .from('products')
      .select('*, categories(name, slug), collections(name, slug)')
      .eq('slug', req.params.slug)
      .eq('is_active', true)
      .single();

    if (error || !product) {
      return res.status(404).json({ success: false, error: 'Product not found.' });
    }

    /* Calculate remaining inventory from sizes */
    if (product.sizes && Array.isArray(product.sizes)) {
      product.remaining_inventory = product.sizes.reduce((sum, s) => sum + (s.stock || 0), 0);
    }

    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
});


/* ─── Related products (same category, max 4) ─── */

router.get('/:slug/related', async (req, res, next) => {
  try {
    /* First get the product to know its category */
    const { data: product } = await supabaseAdmin
      .from('products')
      .select('id, category_id, collection_id')
      .eq('slug', req.params.slug)
      .single();

    if (!product) {
      return res.json({ success: true, data: [] });
    }

    let query = supabaseAdmin
      .from('products')
      .select('id, name, slug, price, images, badge, sizes, short_description')
      .eq('is_active', true)
      .neq('id', product.id)
      .limit(4);

    /* Prefer same category, fallback to same collection */
    if (product.category_id) {
      query = query.eq('category_id', product.category_id);
    } else if (product.collection_id) {
      query = query.eq('collection_id', product.collection_id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;

    /* If not enough from same category, fill from same collection */
    let related = data || [];
    if (related.length < 4 && product.collection_id && product.category_id) {
      const existingIds = related.map((r) => r.id);
      const { data: more } = await supabaseAdmin
        .from('products')
        .select('id, name, slug, price, images, badge, sizes, short_description')
        .eq('is_active', true)
        .eq('collection_id', product.collection_id)
        .not('id', 'in', `(${[product.id, ...existingIds].join(',')})`)
        .limit(4 - related.length)
        .order('created_at', { ascending: false });

      if (more) related = [...related, ...more];
    }

    /* If still not enough, fill with any recent products */
    if (related.length < 4) {
      const existingIds = [product.id, ...related.map((r) => r.id)];
      const { data: more } = await supabaseAdmin
        .from('products')
        .select('id, name, slug, price, images, badge, sizes, short_description')
        .eq('is_active', true)
        .not('id', 'in', `(${existingIds.join(',')})`)
        .limit(4 - related.length)
        .order('created_at', { ascending: false });

      if (more) related = [...related, ...more];
    }

    res.json({ success: true, data: related });
  } catch (err) {
    next(err);
  }
});

export default router;
