/*
 * BLACKTRIBE FASHION — WISHLIST ROUTES
 *
 * GET    /api/wishlist          — list user's wishlisted products
 * POST   /api/wishlist          — add product to wishlist
 * DELETE  /api/wishlist/:productId — remove product from wishlist
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { supabaseAdmin } from '../config/database.js';
import { createError } from '../middleware/errorHandler.js';

const router = Router();


/* ─── GET /api/wishlist ─── */
/* Returns wishlisted products with product details for display. */

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('wishlist')
      .select(`
        product_id,
        created_at,
        products:product_id (
          name,
          slug,
          price,
          images,
          badge,
          is_active
        )
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[wishlist] Fetch failed:', error);
      return next(createError(500, 'Could not fetch wishlist.'));
    }

    // Flatten the joined data and filter out inactive products
    const items = (data || [])
      .filter((row) => row.products?.is_active !== false)
      .map((row) => ({
        product_id: row.product_id,
        name: row.products?.name || '',
        slug: row.products?.slug || '',
        price: row.products?.price || 0,
        image_url: row.products?.images?.[0] || '',
        images: row.products?.images || [],
        badge: row.products?.badge || null,
        created_at: row.created_at,
      }));

    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
});


/* ─── POST /api/wishlist ─── */
/* Add a product to wishlist. Ignores duplicates. */

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { product_id } = req.body;

    if (!product_id) {
      return next(createError(400, 'Product ID is required.'));
    }

    // Upsert: ignore if already wishlisted
    const { error } = await supabaseAdmin
      .from('wishlist')
      .upsert(
        { user_id: req.user.id, product_id },
        { onConflict: 'user_id,product_id', ignoreDuplicates: true }
      );

    if (error) {
      console.error('[wishlist] Add failed:', error);
      return next(createError(500, 'Could not add to wishlist.'));
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});


/* ─── DELETE /api/wishlist/:productId ─── */
/* Remove a product from wishlist. */

router.delete('/:productId', requireAuth, async (req, res, next) => {
  try {
    const { productId } = req.params;

    const { error } = await supabaseAdmin
      .from('wishlist')
      .delete()
      .eq('user_id', req.user.id)
      .eq('product_id', productId);

    if (error) {
      console.error('[wishlist] Remove failed:', error);
      return next(createError(500, 'Could not remove from wishlist.'));
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});


export default router;
