/**
 * Homepage Batch Endpoint — BlackTribe Fashion
 *
 * GET /api/homepage
 *
 * Returns all homepage data in one response:
 *   - featured: 6 newest products (featured prioritized)
 *   - collection: first active collection + its first 3 products
 *
 * Replaces 3 sequential fetches with 1 parallel request.
 * ~300-500ms saved on every homepage load.
 */

import { Router } from 'express';
import { supabaseAdmin } from '../config/database.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    /* Run all queries in parallel */
    const [productsResult, collectionsResult] = await Promise.all([
      supabaseAdmin
        .from('products')
        .select('*, categories(name, slug)')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(12),

      supabaseAdmin
        .from('collections')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1),
    ]);

    const allProducts = productsResult.data || [];
    const collection = collectionsResult.data?.[0] || null;

    /* Featured: prioritize is_featured, fill with newest, max 6 */
    const featured = [
      ...allProducts.filter((p) => p.is_featured),
      ...allProducts.filter((p) => !p.is_featured),
    ].slice(0, 6);

    /* Collection products: filter from the same product set if possible */
    let collectionProducts = [];
    if (collection) {
      collectionProducts = allProducts
        .filter((p) => p.collection_id === collection.id)
        .slice(0, 3);

      /* If no products matched from the prefetched set, query specifically */
      if (collectionProducts.length === 0) {
        const { data: colProds } = await supabaseAdmin
          .from('products')
          .select('*, categories(name, slug)')
          .eq('is_active', true)
          .eq('collection_id', collection.id)
          .order('created_at', { ascending: false })
          .limit(3);

        collectionProducts = colProds || [];
      }
    }

    res.json({
      success: true,
      data: {
        featured,
        collection: collection
          ? { ...collection, products: collectionProducts }
          : null,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
