/**
 * Homepage Batch Endpoint — BlackTribe Fashion
 *
 * GET /api/homepage
 *
 * Returns all homepage data in one response:
 *   - featured:   6 newest products (featured prioritized)
 *   - collection: the newest active collection, which drives the hero,
 *                 the marquee and the collection section. Includes:
 *                   products      3 pieces NOT already in featured
 *                   product_count live count of active pieces
 *                   hero_image    collection image_url, else its newest piece's photo
 *
 * The newest collection is the current drop. Creating a new collection in
 * admin moves the whole homepage over to it; nothing is hardcoded.
 */

import { Router } from 'express';
import { supabaseAdmin } from '../config/database.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    /* Run independent queries in parallel */
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

    let collectionData = null;

    if (collection) {
      /* Every active piece in the collection (newest first) + live count */
      const { data: colProds, count } = await supabaseAdmin
        .from('products')
        .select('*, categories(name, slug)', { count: 'exact' })
        .eq('is_active', true)
        .eq('collection_id', collection.id)
        .order('created_at', { ascending: false });

      const pieces = colProds || [];
      const featuredIds = new Set(featured.map((p) => p.id));

      /* Collection section shows pieces the visitor hasn't just seen in
         New Arrivals; tops up from featured only if the collection is small */
      const fresh = pieces.filter((p) => !featuredIds.has(p.id));
      const products = [...fresh, ...pieces.filter((p) => featuredIds.has(p.id))].slice(0, 3);

      const heroImage = collection.image_url
        || pieces.find((p) => p.images?.length)?.images?.[0]
        || null;

      collectionData = {
        ...collection,
        products,
        product_count: count ?? pieces.length,
        hero_image: heroImage,
      };
    }

    res.json({
      success: true,
      data: {
        featured,
        collection: collectionData,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
