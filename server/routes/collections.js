/*
 * BLACKTRIBE FASHION — PUBLIC COLLECTIONS API
 *
 * GET /api/collections          — all active collections (with cover image)
 * GET /api/collections/:slug    — single collection with its products
 *
 * Cover image logic:
 *   1. Collection has image_url set → use it
 *   2. No image_url → use first image from first product in collection
 *   3. No products → null
 */

import express from 'express';
import { supabaseAdmin } from '../config/database.js';

const router = express.Router();


/* ─── List all active collections ─── */

router.get('/', async (req, res, next) => {
  try {
    const { data: collections, error } = await supabaseAdmin
      .from('collections')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    /* Enrich each collection with product count and cover image */
    const enriched = await Promise.all(
      (collections || []).map(async (col) => {
        /* Get product count */
        const { count } = await supabaseAdmin
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('collection_id', col.id)
          .eq('is_active', true);

        /* Resolve cover image */
        let coverImage = col.image_url || null;
        if (!coverImage) {
          const { data: firstProduct } = await supabaseAdmin
            .from('products')
            .select('images')
            .eq('collection_id', col.id)
            .eq('is_active', true)
            .order('created_at', { ascending: true })
            .limit(1)
            .single();

          if (firstProduct?.images?.[0]) {
            coverImage = firstProduct.images[0];
          }
        }

        return {
          ...col,
          cover_image: coverImage,
          product_count: count || 0,
        };
      })
    );

    res.json({ success: true, data: enriched });
  } catch (err) {
    next(err);
  }
});


/* ─── Single collection by slug with products ─── */

router.get('/:slug', async (req, res, next) => {
  try {
    const { data: collection, error: colError } = await supabaseAdmin
      .from('collections')
      .select('*')
      .eq('slug', req.params.slug)
      .eq('is_active', true)
      .single();

    if (colError || !collection) {
      return res.status(404).json({ success: false, error: 'Collection not found.' });
    }

    /* Get products in this collection */
    const {
      sort = 'newest',
      page = 1,
      limit = 24,
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabaseAdmin
      .from('products')
      .select('*, categories(name, slug)', { count: 'exact' })
      .eq('collection_id', collection.id)
      .eq('is_active', true);

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
      default:
        query = query.order('created_at', { ascending: false });
    }

    query = query.range(offset, offset + parseInt(limit) - 1);

    const { data: products, count, error: prodError } = await query;
    if (prodError) throw prodError;

    /* Resolve cover image */
    let coverImage = collection.image_url || null;
    if (!coverImage && products?.[0]?.images?.[0]) {
      coverImage = products[0].images[0];
    }

    res.json({
      success: true,
      data: {
        ...collection,
        cover_image: coverImage,
        product_count: count || 0,
        products: products || [],
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
