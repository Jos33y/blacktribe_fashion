/*
 * BLACKTRIBE FASHION — MOCK DATA
 * Matches the real Supabase schema exactly.
 * Prices in kobo (₦185,000 = 18500000).
 * Replace with API calls in Phase 5.
 */

export const categories = [
  {
    id: 'cat-001',
    name: 'Jackets',
    slug: 'jackets',
    description: 'Outerwear crafted for presence.',
    image_url: null,
    sort_order: 1,
    is_active: true,
  },
  {
    id: 'cat-002',
    name: 'Shirts',
    slug: 'shirts',
    description: 'Pieces that speak without shouting.',
    image_url: null,
    sort_order: 2,
    is_active: true,
  },
  {
    id: 'cat-003',
    name: 'Tees',
    slug: 'tees',
    description: 'Heavyweight essentials.',
    image_url: null,
    sort_order: 3,
    is_active: true,
  },
];

export const collections = [
  {
    id: 'col-001',
    name: 'Shadow Collection',
    slug: 'shadow-collection',
    description: 'Sixteen pieces. Obsidian textures. Crystal details.',
    image_url: '/mock/crystal-trucker-front.png',
    season: 'SS26',
    is_active: true,
    start_date: '2026-03-01',
    end_date: null,
    created_at: '2026-03-01T00:00:00Z',
    product_count: 4,
  },
  {
    id: 'col-002',
    name: 'Noir Essentials',
    slug: 'noir-essentials',
    description: 'The foundation. Every wardrobe starts here.',
    image_url: '/mock/sparkle-zip-front.png',
    season: 'AW25',
    is_active: true,
    start_date: '2025-09-01',
    end_date: null,
    created_at: '2025-09-01T00:00:00Z',
    product_count: 3,
  },
  {
    id: 'col-003',
    name: 'Urban Ritual',
    slug: 'urban-ritual',
    description: 'Street-level ceremony. Culture meets craft.',
    image_url: '/mock/varsity-front.png',
    season: 'SS26',
    is_active: true,
    start_date: '2026-02-01',
    end_date: null,
    created_at: '2026-02-01T00:00:00Z',
    product_count: 2,
  },
];

export const products = [
  {
    id: 'prod-001',
    name: 'Crystal Trucker Jacket',
    slug: 'crystal-trucker-jacket',
    description: 'Black velvet trucker silhouette with hand-set crystal detailing on pockets and back panel. BlackTribe script embroidery on chest. Silver snap buttons throughout.',
    short_description: 'Black velvet trucker with hand-set crystal details.',
    price: 18500000,
    compare_at_price: null,
    category_id: 'cat-001',
    collection_id: 'col-001',
    images: [
      '/mock/crystal-trucker-front.png',
      '/mock/crystal-trucker-back.png',
    ],
    sizes: [
      { size: 'S', stock: 8 },
      { size: 'M', stock: 15 },
      { size: 'L', stock: 12 },
      { size: 'XL', stock: 6 },
      { size: 'XXL', stock: 3 },
    ],
    colors: [{ name: 'Obsidian', hex: '#0C0C0C' }],
    tags: ['crystal', 'trucker', 'velvet'],
    badge: 'PRE-ORDER',
    video_url: null,
    is_featured: true,
    is_active: true,
    show_inventory: true,
    total_inventory: 200,
    preorder_deadline: '2026-03-30T23:59:59Z',
    sku: 'BT-CTJ-001',
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
  },
  {
    id: 'prod-002',
    name: 'Sparkle Zip Shirt',
    slug: 'sparkle-zip-shirt',
    description: 'Oversized short-sleeve shirt with full sequin body and BlackTribe script applique. Center zip closure. All-over crystal sparkle finish.',
    short_description: 'Oversized sequin shirt with BlackTribe script applique.',
    price: 14500000,
    compare_at_price: null,
    category_id: 'cat-002',
    collection_id: 'col-001',
    images: [
      '/mock/sparkle-zip-front.png',
    ],
    sizes: [
      { size: 'M', stock: 10 },
      { size: 'L', stock: 10 },
      { size: 'XL', stock: 8 },
    ],
    colors: [{ name: 'Obsidian', hex: '#0C0C0C' }],
    tags: ['sequin', 'zip', 'sparkle'],
    badge: 'NEW',
    video_url: null,
    is_featured: true,
    is_active: true,
    show_inventory: false,
    total_inventory: null,
    preorder_deadline: null,
    sku: 'BT-SZS-001',
    created_at: '2026-03-05T00:00:00Z',
    updated_at: '2026-03-05T00:00:00Z',
  },
  {
    id: 'prod-003',
    name: 'Cow Print Button-Up',
    slug: 'cow-print-button-up',
    description: 'Grey washed cotton upper with black and white cow print lower panel. BlackTribe script embroidery on chest. Contrast black cuffs. Relaxed oversized fit.',
    short_description: 'Grey cotton with cow print panel. Relaxed oversized fit.',
    price: 9500000,
    compare_at_price: null,
    category_id: 'cat-002',
    collection_id: 'col-002',
    images: [
      '/mock/cow-print-front.png',
    ],
    sizes: [
      { size: 'S', stock: 5 },
      { size: 'M', stock: 12 },
      { size: 'L', stock: 14 },
      { size: 'XL', stock: 10 },
      { size: 'XXL', stock: 4 },
    ],
    colors: [
      { name: 'Grey/Cow', hex: '#808080' },
    ],
    tags: ['cow-print', 'button-up', 'oversized'],
    badge: null,
    video_url: null,
    is_featured: true,
    is_active: true,
    show_inventory: false,
    total_inventory: null,
    preorder_deadline: null,
    sku: 'BT-CPB-001',
    created_at: '2026-02-20T00:00:00Z',
    updated_at: '2026-02-20T00:00:00Z',
  },
  {
    id: 'prod-004',
    name: 'Varsity Jacket — White',
    slug: 'varsity-jacket-white',
    description: 'Classic varsity silhouette in white wool body with white leather sleeves. BlackTribe script, "Limited Edition" embroidery, custom patches throughout. Striped ribbed collar, cuffs, and hem. Snap button closure.',
    short_description: 'White wool and leather varsity with custom patches.',
    price: 21000000,
    compare_at_price: null,
    category_id: 'cat-001',
    collection_id: 'col-003',
    images: [
      '/mock/varsity-front.png',
    ],
    sizes: [
      { size: 'M', stock: 5 },
      { size: 'L', stock: 5 },
      { size: 'XL', stock: 3 },
    ],
    colors: [{ name: 'White', hex: '#F5F3F0' }],
    tags: ['varsity', 'patches', 'limited'],
    badge: 'LIMITED',
    video_url: null,
    is_featured: true,
    is_active: true,
    show_inventory: true,
    total_inventory: 50,
    preorder_deadline: null,
    sku: 'BT-VJW-001',
    created_at: '2026-02-15T00:00:00Z',
    updated_at: '2026-02-15T00:00:00Z',
  },
  {
    id: 'prod-005',
    name: 'Rhinestone Denim Jacket',
    slug: 'rhinestone-denim-jacket',
    description: 'Black denim trucker jacket with scattered rhinestone detailing across back panel. Silver snap buttons. Crystal accents at lower pockets. Clean minimal front.',
    short_description: 'Black denim trucker with scattered rhinestone back panel.',
    price: 16500000,
    compare_at_price: null,
    category_id: 'cat-001',
    collection_id: 'col-001',
    images: [
      '/mock/rhinestone-denim-back.png',
    ],
    sizes: [
      { size: 'S', stock: 6 },
      { size: 'M', stock: 10 },
      { size: 'L', stock: 10 },
      { size: 'XL', stock: 7 },
    ],
    colors: [{ name: 'Black', hex: '#1a1a1a' }],
    tags: ['rhinestone', 'denim', 'trucker'],
    badge: 'NEW',
    video_url: null,
    is_featured: true,
    is_active: true,
    show_inventory: false,
    total_inventory: null,
    preorder_deadline: null,
    sku: 'BT-RDJ-001',
    created_at: '2026-03-08T00:00:00Z',
    updated_at: '2026-03-08T00:00:00Z',
  },
  {
    id: 'prod-006',
    name: 'Obsidian Oversized Tee',
    slug: 'obsidian-oversized-tee',
    description: 'Heavyweight 280gsm cotton. Tonal "Black Tribe" script embroidery on chest. Oversized drop-shoulder cut. Ribbed crew neck.',
    short_description: 'Heavyweight 280gsm cotton with tonal script embroidery.',
    price: 4500000,
    compare_at_price: null,
    category_id: 'cat-003',
    collection_id: 'col-002',
    images: [],
    sizes: [
      { size: 'S', stock: 20 },
      { size: 'M', stock: 30 },
      { size: 'L', stock: 25 },
      { size: 'XL', stock: 15 },
      { size: 'XXL', stock: 10 },
    ],
    colors: [
      { name: 'Obsidian', hex: '#0C0C0C' },
      { name: 'Bone', hex: '#F5F3F0' },
    ],
    tags: ['tee', 'heavyweight', 'oversized', 'essential'],
    badge: null,
    video_url: null,
    is_featured: true,
    is_active: true,
    show_inventory: false,
    total_inventory: null,
    preorder_deadline: null,
    sku: 'BT-OOT-001',
    created_at: '2026-01-15T00:00:00Z',
    updated_at: '2026-01-15T00:00:00Z',
  },
];

// Helper: get products by collection
export function getProductsByCollection(collectionSlug) {
  const collection = collections.find((c) => c.slug === collectionSlug);
  if (!collection) return [];
  return products.filter((p) => p.collection_id === collection.id && p.is_active);
}

// Helper: get products by category
export function getProductsByCategory(categorySlug) {
  const category = categories.find((c) => c.slug === categorySlug);
  if (!category) return [];
  return products.filter((p) => p.category_id === category.id && p.is_active);
}

// Helper: get single product by slug
export function getProductBySlug(slug) {
  return products.find((p) => p.slug === slug && p.is_active) || null;
}

// Helper: get related products (same category, different product)
export function getRelatedProducts(productId, limit = 4) {
  const product = products.find((p) => p.id === productId);
  if (!product) return [];
  return products
    .filter((p) => p.category_id === product.category_id && p.id !== productId && p.is_active)
    .slice(0, limit);
}

// Helper: get featured products
export function getFeaturedProducts(limit = 6) {
  return products.filter((p) => p.is_featured && p.is_active).slice(0, limit);
}

// Helper: search products
export function searchProducts(query) {
  const q = query.toLowerCase().trim();
  if (q.length < 2) return [];
  return products.filter(
    (p) =>
      p.is_active &&
      (p.name.toLowerCase().includes(q) ||
        p.short_description?.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)))
  );
}

// Helper: get collection by slug
export function getCollectionBySlug(slug) {
  return collections.find((c) => c.slug === slug && c.is_active) || null;
}

// Helper: get category by slug
export function getCategoryBySlug(slug) {
  return categories.find((c) => c.slug === slug && c.is_active) || null;
}
