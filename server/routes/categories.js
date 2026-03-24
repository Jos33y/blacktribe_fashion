/*
 * BLACKTRIBE FASHION — PUBLIC CATEGORIES API
 *
 * GET /api/categories — all active categories with product counts
 *
 * Used by the Shop page filter sidebar.
 */

import express from 'express';
import { supabaseAdmin } from '../config/database.js';

const router = express.Router();


/* ─── List all active categories ─── */

router.get('/', async (req, res, next) => {
  try {
    const { data: categories, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;

    /* Enrich with product counts */
    const enriched = await Promise.all(
      (categories || []).map(async (cat) => {
        const { count } = await supabaseAdmin
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('category_id', cat.id)
          .eq('is_active', true);

        return {
          ...cat,
          product_count: count || 0,
        };
      })
    );

    res.json({ success: true, data: enriched });
  } catch (err) {
    next(err);
  }
});

export default router;
