/*
 * BLACKTRIBE FASHION — PUBLIC EDITORIAL API
 *
 * GET /api/editorial          — published features (listing cards)
 * GET /api/editorial/:slug    — single feature with pages + live product data
 *
 * Drafts: /:slug also returns unpublished features when the request carries
 * an admin token with the 'collections' permission (or superadmin). This is
 * how the admin preview and draft print view work. Everyone else gets 404.
 *
 * Product pages store product ids only. Names, prices, slugs and images are
 * resolved here on every request, so prices in a feature are never stale.
 * Inactive products are left out; the page renders the remaining ones.
 */

import express from 'express';
import { supabaseAdmin } from '../config/database.js';
import { attachUser } from '../middleware/auth.js';

const router = express.Router();

function canPreview(user) {
  if (!user) return false;
  if (user.role === 'superadmin') return true;
  return user.role === 'admin' && (user.permissions || []).includes('collections');
}


/* ─── List published features ─── */

router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('editorial_features')
      .select('id, title, slug, issue_label, dek, cover_image, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (err) {
    next(err);
  }
});


/* ─── Single feature by slug ─── */

router.get('/:slug', attachUser, async (req, res, next) => {
  try {
    const { data: feature, error } = await supabaseAdmin
      .from('editorial_features')
      .select('id, title, slug, issue_label, dek, cover_image, pages, status, published_at')
      .eq('slug', req.params.slug)
      .single();

    if (error || !feature || (feature.status !== 'published' && !canPreview(req.user))) {
      return res.status(404).json({ success: false, error: 'Feature not found.' });
    }

    /* Resolve product ids across all product pages */
    const ids = [...new Set(
      (feature.pages || []).flatMap((p) => (p.template === 'products' ? p.fields?.products || [] : []))
    )];

    const products = {};
    if (ids.length > 0) {
      const { data: rows, error: prodError } = await supabaseAdmin
        .from('products')
        .select('id, name, slug, price, images')
        .in('id', ids)
        .eq('is_active', true);

      if (prodError) throw prodError;

      for (const p of rows || []) {
        products[p.id] = {
          id: p.id,
          name: p.name,
          slug: p.slug,
          price: p.price,
          image: p.images?.[0] || '',
        };
      }
    }

    res.json({ success: true, data: { ...feature, products } });
  } catch (err) {
    next(err);
  }
});

export default router;
