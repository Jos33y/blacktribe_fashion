/*
 * BLACKTRIBE FASHION — MOCK DATA (FINAL)
 * 27 products, 5 categories, 3 collections.
 * Matches real Supabase schema. Prices in kobo.
 * All image paths match public/mock/ filenames exactly.
 * Replace with API calls in Phase 5.
 */

export const categories = [
  { id: 'cat-001', name: 'Jackets', slug: 'jackets', description: 'Outerwear crafted for presence.', image_url: null, sort_order: 1, is_active: true },
  { id: 'cat-002', name: 'Shirts', slug: 'shirts', description: 'Pieces that speak without shouting.', image_url: null, sort_order: 2, is_active: true },
  { id: 'cat-003', name: 'Tees', slug: 'tees', description: 'Essentials with weight.', image_url: null, sort_order: 3, is_active: true },
  { id: 'cat-004', name: 'Bottoms', slug: 'bottoms', description: 'Built from the ground up.', image_url: null, sort_order: 4, is_active: true },
  { id: 'cat-005', name: 'Accessories', slug: 'accessories', description: 'The finishing touch.', image_url: null, sort_order: 5, is_active: true },
];

export const collections = [
  {
    id: 'col-001', name: 'Shadow Collection', slug: 'shadow-collection',
    description: 'Sixteen pieces. Obsidian textures. Crystal details.',
    image_url: '/mock/crystal-velvet-trucker-front.PNG', season: 'SS26',
    is_active: true, start_date: '2026-03-01', end_date: null,
    created_at: '2026-03-01T00:00:00Z', product_count: 8,
  },
  {
    id: 'col-002', name: 'Noir Essentials', slug: 'noir-essentials',
    description: 'The foundation. Every wardrobe starts here.',
    image_url: '/mock/washed-denim-logo-shirt-front.PNG', season: 'AW25',
    is_active: true, start_date: '2025-09-01', end_date: null,
    created_at: '2025-09-01T00:00:00Z', product_count: 13,
  },
  {
    id: 'col-003', name: 'Urban Ritual', slug: 'urban-ritual',
    description: 'Street-level ceremony. Culture meets craft.',
    image_url: '/mock/varsity-jacket-white-front.PNG', season: 'SS26',
    is_active: true, start_date: '2026-02-01', end_date: null,
    created_at: '2026-02-01T00:00:00Z', product_count: 6,
  },
];

// Helper to build product objects concisely
function p(id, name, slug, desc, shortDesc, price, catId, colId, images, sizes, colors, tags, badge, opts = {}) {
  return {
    id, name, slug, description: desc, short_description: shortDesc,
    price, compare_at_price: null, category_id: catId, collection_id: colId,
    images, sizes, colors, tags, badge,
    video_url: opts.video || null,
    is_featured: opts.featured ?? false,
    is_active: true,
    show_inventory: opts.showInventory ?? false,
    total_inventory: opts.totalInventory ?? null,
    preorder_deadline: opts.preorderDeadline ?? null,
    sku: opts.sku || null,
    created_at: opts.created || '2026-03-01T00:00:00Z',
    updated_at: opts.created || '2026-03-01T00:00:00Z',
  };
}

// Standard size sets
const szSMLXL = [{ size: 'S', stock: 8 }, { size: 'M', stock: 15 }, { size: 'L', stock: 12 }, { size: 'XL', stock: 6 }, { size: 'XXL', stock: 3 }];
const szMLXL = [{ size: 'M', stock: 10 }, { size: 'L', stock: 10 }, { size: 'XL', stock: 8 }];
const szMLXLsm = [{ size: 'M', stock: 5 }, { size: 'L', stock: 5 }, { size: 'XL', stock: 3 }];
const szWaist = [{ size: '28', stock: 5 }, { size: '30', stock: 10 }, { size: '32', stock: 12 }, { size: '34', stock: 8 }, { size: '36', stock: 4 }];
const szOne = [{ size: 'One Size', stock: 25 }];

export const products = [

  // ═══════════════════════════════════════════════════════════
  // JACKETS
  // ═══════════════════════════════════════════════════════════

  p('prod-001', 'Crystal Velvet Trucker', 'crystal-velvet-trucker',
    'Black velvet trucker silhouette with hand-set crystal detailing on pockets and back panel. Crystal tribal mask emblem on back. BlackTribe script embroidery on chest. Silver snap buttons throughout.',
    'Black velvet trucker with hand-set crystal details.',
    18500000, 'cat-001', 'col-001',
    ['/mock/crystal-velvet-trucker-front.PNG', '/mock/crystal-velvet-trucker-back.PNG'],
    szSMLXL, [{ name: 'Obsidian', hex: '#0C0C0C' }],
    ['crystal', 'trucker', 'velvet'], 'PRE-ORDER',
    { featured: true, showInventory: true, totalInventory: 200, preorderDeadline: '2026-03-30T23:59:59Z', sku: 'BT-CVT-001' }),

  p('prod-002', 'Full Crystal Trucker', 'full-crystal-trucker',
    'Classic trucker silhouette completely encrusted with hand-set crystals. Every surface catches light. BlackTribe label at collar. Button closure.',
    'Full crystal-encrusted trucker. Every surface catches light.',
    25000000, 'cat-001', 'col-001',
    ['/mock/full-crystal-trucker-front.PNG', '/mock/full-crystal-trucker-back.PNG'],
    [{ size: 'S', stock: 3 }, { size: 'M', stock: 5 }, { size: 'L', stock: 5 }, { size: 'XL', stock: 3 }],
    [{ name: 'Silver', hex: '#C0C0C0' }],
    ['crystal', 'trucker', 'encrusted'], 'LIMITED',
    { featured: true, showInventory: true, totalInventory: 50, sku: 'BT-FCT-001', created: '2026-03-06T00:00:00Z' }),

  p('prod-003', 'Rhinestone Denim Jacket', 'rhinestone-denim-jacket',
    'Black denim trucker jacket with scattered rhinestone detailing across back panel. Silver snap buttons. Crystal accents at lower pockets. Clean minimal front.',
    'Black denim trucker with scattered rhinestone back panel.',
    16500000, 'cat-001', 'col-001',
    ['/mock/rhinestone-denim-jacket-front.PNG', '/mock/rhinestone-denim-jacket-back.PNG'],
    szSMLXL, [{ name: 'Black', hex: '#1a1a1a' }],
    ['rhinestone', 'denim', 'trucker'], 'NEW',
    { featured: true, sku: 'BT-RDJ-001', created: '2026-03-08T00:00:00Z' }),

  p('prod-004', 'Varsity Jacket — White', 'varsity-jacket-white',
    'Classic varsity silhouette in white wool body with white leather sleeves. BlackTribe script, "Limited Edition" embroidery, custom patches throughout. Striped ribbed collar, cuffs, and hem. Snap button closure.',
    'White wool and leather varsity with custom patches.',
    21000000, 'cat-001', 'col-003',
    ['/mock/varsity-jacket-white-front.PNG', '/mock/varsity-jacket-white-back.PNG'],
    szMLXLsm, [{ name: 'White', hex: '#F5F3F0' }],
    ['varsity', 'patches', 'limited'], 'LIMITED',
    { featured: true, showInventory: true, totalInventory: 50, sku: 'BT-VJW-001', created: '2026-02-15T00:00:00Z' }),

  p('prod-005', 'Varsity Jacket — Ash', 'varsity-jacket-ash',
    'Classic varsity silhouette in ash grey wool body with leather sleeves. BlackTribe script, "Limited Edition" embroidery, custom patches throughout. Striped ribbed collar, cuffs, and hem. Snap button closure.',
    'Ash grey wool and leather varsity with custom patches.',
    21000000, 'cat-001', 'col-003',
    ['/mock/varsity-jacket-ash-front.PNG', '/mock/varsity-jacket-ash-back.PNG'],
    szMLXLsm, [{ name: 'Ash', hex: '#808080' }],
    ['varsity', 'patches', 'limited'], 'LIMITED',
    { showInventory: true, totalInventory: 50, sku: 'BT-VJA-001', created: '2026-02-15T00:00:00Z' }),

  p('prod-006', 'Varsity Jacket — Black', 'varsity-jacket-black',
    'Classic varsity silhouette in black wool body with black leather sleeves. BlackTribe script, "Limited Edition" embroidery, custom patches throughout. Striped ribbed collar, cuffs, and hem. Snap button closure.',
    'Black wool and leather varsity with custom patches.',
    21000000, 'cat-001', 'col-003',
    ['/mock/varsity-jacket-black-front.PNG', '/mock/varsity-jacket-black-back.PNG'],
    szMLXLsm, [{ name: 'Black', hex: '#0C0C0C' }],
    ['varsity', 'patches', 'limited'], 'LIMITED',
    { showInventory: true, totalInventory: 50, sku: 'BT-VJB-001', created: '2026-02-15T00:00:00Z' }),

  // ═══════════════════════════════════════════════════════════
  // SHIRTS
  // ═══════════════════════════════════════════════════════════

  p('prod-007', 'Sequin Script Zip Shirt', 'sequin-script-zip-shirt',
    'Oversized short-sleeve shirt with full sequin body and large BlackTribe script applique. Center zip closure. All-over crystal sparkle finish.',
    'Oversized sequin shirt with large BlackTribe script applique.',
    14500000, 'cat-002', 'col-001',
    ['/mock/sequin-script-zip-shirt-front.PNG', '/mock/sequin-script-zip-shirt-back.PNG'],
    szMLXL, [{ name: 'Obsidian', hex: '#0C0C0C' }],
    ['sequin', 'zip', 'sparkle'], 'NEW',
    { featured: true, sku: 'BT-SSZ-001', created: '2026-03-05T00:00:00Z' }),

  p('prod-008', 'Crystal Star Crop Shirt', 'crystal-star-crop-shirt',
    'Grey cropped zip shirt with all-over crystal rhinestone detailing. Black star patches on sleeves. Tribal mask badge on chest. Paint splatter effect at hem. BlackTribe label at collar.',
    'Grey cropped zip shirt with all-over crystals and star patches.',
    16000000, 'cat-002', 'col-001',
    ['/mock/crystal-star-crop-shirt-front.PNG', '/mock/crystal-star-crop-shirt-back.PNG'],
    szSMLXL, [{ name: 'Grey', hex: '#808080' }],
    ['crystal', 'crop', 'star', 'rhinestone'], 'NEW',
    { featured: true, sku: 'BT-CSC-001', created: '2026-03-07T00:00:00Z' }),

  p('prod-009', 'Cow Print Panel Shirt — Black', 'cow-print-panel-shirt-black',
    'Black cotton upper with black and white cow print lower panel. BlackTribe script embroidery on chest. Contrast black cuffs. Relaxed oversized fit.',
    'Black cotton with cow print panel. Relaxed oversized fit.',
    9500000, 'cat-002', 'col-002',
    ['/mock/cow-print-panel-shirt-black.PNG'],
    szSMLXL, [{ name: 'Black', hex: '#0C0C0C' }],
    ['cow-print', 'panel', 'oversized'], null,
    { sku: 'BT-CPB-001', created: '2026-02-20T00:00:00Z' }),

  p('prod-010', 'Cow Print Panel Shirt — Grey', 'cow-print-panel-shirt-grey',
    'Grey washed cotton upper with black and white cow print lower panel. BlackTribe script embroidery on chest. Contrast black cuffs. Relaxed oversized fit.',
    'Grey cotton with cow print panel. Relaxed oversized fit.',
    9500000, 'cat-002', 'col-002',
    ['/mock/cow-print-panel-shirt-grey.PNG'],
    szSMLXL, [{ name: 'Grey', hex: '#808080' }],
    ['cow-print', 'panel', 'oversized'], null,
    { sku: 'BT-CPG-001', created: '2026-02-20T00:00:00Z' }),

  p('prod-011', 'Cow Print Panel Shirt — White', 'cow-print-panel-shirt-white',
    'White cotton upper with black and white cow print lower panel. BlackTribe script embroidery on chest. Contrast black cuffs. Relaxed oversized fit.',
    'White cotton with cow print panel. Relaxed oversized fit.',
    9500000, 'cat-002', 'col-002',
    ['/mock/cow-print-panel-shirt-white.PNG'],
    szSMLXL, [{ name: 'White', hex: '#F5F3F0' }],
    ['cow-print', 'panel', 'oversized'], null,
    { sku: 'BT-CPW-001', created: '2026-02-20T00:00:00Z' }),

  p('prod-012', 'Washed Denim Logo Shirt', 'washed-denim-logo-shirt',
    'Light wash denim short-sleeve button-up. BlackTribe logo pattern embroidered on chest pocket. Relaxed boxy fit. Button-down collar.',
    'Light wash denim with logo pattern pocket detail.',
    8500000, 'cat-002', 'col-002',
    ['/mock/washed-denim-logo-shirt-front.PNG', '/mock/washed-denim-logo-shirt-back.PNG'],
    szSMLXL, [{ name: 'Light Wash', hex: '#B8D4E3' }],
    ['denim', 'logo', 'washed'], null,
    { sku: 'BT-WDL-001', created: '2026-02-10T00:00:00Z' }),

  p('prod-013', 'Chain Denim Jean Shirt', 'chain-denim-jean-shirt',
    'Black washed denim short-sleeve shirt with paint splatter detail throughout. BlackTribe logo pattern pocket. Silver snap buttons. Relaxed fit.',
    'Black washed denim with paint splatter detail.',
    10500000, 'cat-002', 'col-002',
    ['/mock/chain-denim-jean-shirt.PNG'],
    szSMLXL, [{ name: 'Black Wash', hex: '#2a2a2a' }],
    ['denim', 'splatter', 'chain'], null,
    { sku: 'BT-CDJ-001', created: '2026-02-25T00:00:00Z' }),

  p('prod-014', 'Chain Denim Shirt — Black', 'chain-denim-shirt-black',
    'Black washed denim short-sleeve shirt with chain detail at collar. BlackTribe logo pattern pocket. Silver snap buttons. Clean minimal design.',
    'Black washed denim with chain collar detail.',
    10500000, 'cat-002', 'col-002',
    ['/mock/chain-denim-shirt-black.PNG'],
    szSMLXL, [{ name: 'Black', hex: '#1a1a1a' }],
    ['denim', 'chain', 'collar'], null,
    { sku: 'BT-CDB-001', created: '2026-02-25T00:00:00Z' }),

  p('prod-015', 'Chain Denim Shirt — White', 'chain-denim-shirt-white',
    'White denim short-sleeve shirt with chain detail at collar. BlackTribe logo pattern pocket. Silver snap buttons. Clean minimal design.',
    'White denim with chain collar detail.',
    10500000, 'cat-002', 'col-002',
    ['/mock/chain-denim-shirt-white.PNG'],
    szSMLXL, [{ name: 'White', hex: '#F5F3F0' }],
    ['denim', 'chain', 'collar'], null,
    { sku: 'BT-CDW-001', created: '2026-02-25T00:00:00Z' }),

  p('prod-016', 'Script Button-Up — White', 'script-button-up-white',
    'White oversized button-up shirt with BlackTribe script embroidery on chest. Clean minimal design. Relaxed fit. Contrast black buttons.',
    'White oversized button-up with script embroidery.',
    8500000, 'cat-002', 'col-002',
    ['/mock/script-button-up-white.PNG'],
    szSMLXL, [{ name: 'White', hex: '#F5F3F0' }],
    ['script', 'button-up', 'oversized'], null,
    { sku: 'BT-SBW-001', created: '2026-02-18T00:00:00Z' }),

  p('prod-017', 'Script Button-Up — Black', 'script-button-up-black',
    'Black oversized button-up shirt with BlackTribe script embroidery on chest. Clean minimal design. Relaxed fit.',
    'Black oversized button-up with script embroidery.',
    8500000, 'cat-002', 'col-002',
    ['/mock/script-button-up-black.PNG'],
    szSMLXL, [{ name: 'Black', hex: '#0C0C0C' }],
    ['script', 'button-up', 'oversized'], null,
    { sku: 'BT-SBB-001', created: '2026-02-18T00:00:00Z' }),

  // ═══════════════════════════════════════════════════════════
  // TEES
  // ═══════════════════════════════════════════════════════════

  p('prod-018', 'Ribbed Knit Crop Tee — White', 'ribbed-knit-crop-tee-white',
    'White ribbed knit crop tee with mock neck. Tribal mask badge on chest. Ribbed hem band. Fitted cropped silhouette.',
    'White ribbed knit crop tee with tribal mask badge.',
    6500000, 'cat-003', 'col-003',
    ['/mock/ribbed-knit-crop-tee-white-front.PNG', '/mock/ribbed-knit-crop-tee-white-back.PNG'],
    szSMLXL, [{ name: 'White', hex: '#F5F3F0' }],
    ['ribbed', 'knit', 'crop', 'tee'], null,
    { sku: 'BT-RKW-001', created: '2026-02-12T00:00:00Z' }),

  p('prod-019', 'Ribbed Knit Crop Tee — Black', 'ribbed-knit-crop-tee-black',
    'Black ribbed knit crop tee with mock neck. Tribal mask badge on chest. Ribbed hem band. Fitted cropped silhouette.',
    'Black ribbed knit crop tee with tribal mask badge.',
    6500000, 'cat-003', 'col-003',
    ['/mock/ribbed-knit-crop-tee-black-front.PNG', '/mock/ribbed-knit-crop-tee-black-back.PNG'],
    szSMLXL, [{ name: 'Black', hex: '#0C0C0C' }],
    ['ribbed', 'knit', 'crop', 'tee'], null,
    { sku: 'BT-RKB-001', created: '2026-02-12T00:00:00Z' }),

  p('prod-020', 'Ribbed Knit Crop Tee — Grey', 'ribbed-knit-crop-tee-grey',
    'Grey ribbed knit crop tee with mock neck. Tribal mask badge on chest. Ribbed hem band. Fitted cropped silhouette.',
    'Grey ribbed knit crop tee with tribal mask badge.',
    6500000, 'cat-003', 'col-003',
    ['/mock/ribbed-knit-crop-tee-grey-front.PNG', '/mock/ribbed-knit-crop-tee-grey-back.PNG'],
    szSMLXL, [{ name: 'Grey', hex: '#808080' }],
    ['ribbed', 'knit', 'crop', 'tee'], null,
    { sku: 'BT-RKG-001', created: '2026-02-12T00:00:00Z' }),

  p('prod-021', 'Obsidian Oversized Tee — Black', 'obsidian-oversized-tee-black',
    'Heavyweight 280gsm cotton. Geometric "BLACK TRIBE" print with triangular A on back. Oversized drop-shoulder cut. Ribbed crew neck. BlackTribe label at collar.',
    'Heavyweight 280gsm cotton with geometric Black Tribe print.',
    4500000, 'cat-003', 'col-001',
    ['/mock/obsidian-oversized-tee-black-front.PNG', '/mock/obsidian-oversized-tee-black-back.PNG'],
    szSMLXL, [{ name: 'Black', hex: '#0C0C0C' }],
    ['tee', 'heavyweight', 'oversized', 'essential'], null,
    { sku: 'BT-OOB-001', created: '2026-01-15T00:00:00Z' }),

  p('prod-022', 'Obsidian Oversized Tee — White', 'obsidian-oversized-tee-white',
    'Heavyweight 280gsm cotton. Geometric "BLACK TRIBE" print with triangular A on back. Oversized drop-shoulder cut. Ribbed crew neck. BlackTribe label at collar.',
    'Heavyweight 280gsm cotton with geometric Black Tribe print.',
    4500000, 'cat-003', 'col-001',
    ['/mock/obsidian-oversized-tee-white-front.PNG', '/mock/obsidian-oversized-tee-white-back.PNG'],
    szSMLXL, [{ name: 'White', hex: '#F5F3F0' }],
    ['tee', 'heavyweight', 'oversized', 'essential'], null,
    { sku: 'BT-OOW-001', created: '2026-01-15T00:00:00Z' }),

  // ═══════════════════════════════════════════════════════════
  // BOTTOMS
  // ═══════════════════════════════════════════════════════════

  p('prod-023', 'Rhinestone Wide-Leg Jeans', 'rhinestone-wide-leg-jeans',
    'Black wide-leg jeans with rhinestone detailing at front pockets. D-ring hardware at waist. Crystal accents scattered down legs. Star embroidery at hem. Relaxed street fit.',
    'Black wide-leg jeans with rhinestone pocket details and D-ring hardware.',
    12500000, 'cat-004', 'col-001',
    ['/mock/rhinestone-wide-leg-jeans-front.PNG', '/mock/rhinestone-wide-leg-jeans-back.PNG'],
    szWaist, [{ name: 'Black', hex: '#0C0C0C' }],
    ['rhinestone', 'wide-leg', 'jeans', 'denim'], 'NEW',
    { sku: 'BT-RWJ-001', created: '2026-03-04T00:00:00Z' }),

  p('prod-024', 'Embossed Denim Jean Short', 'embossed-denim-jean-short',
    'Black denim shorts with embossed tribal mask pattern throughout. Crystal rhinestone detailing at hem. BlackTribe hardware. Relaxed fit.',
    'Black denim shorts with embossed tribal mask and crystal hem.',
    7500000, 'cat-004', 'col-001',
    ['/mock/embossed-denim-jean-short.PNG'],
    szWaist, [{ name: 'Black', hex: '#0C0C0C' }],
    ['embossed', 'denim', 'shorts', 'crystal'], 'NEW',
    { sku: 'BT-EDJ-001', created: '2026-03-02T00:00:00Z' }),

  p('prod-025', 'Embossed Denim Shorts — Black', 'embossed-denim-shorts-black',
    'Black denim shorts with embossed tribal mask pattern throughout. Clean minimal hardware. Relaxed fit.',
    'Black denim shorts with embossed tribal mask pattern.',
    6500000, 'cat-004', 'col-002',
    ['/mock/embossed-denim-shorts-black.PNG'],
    szWaist, [{ name: 'Black', hex: '#0C0C0C' }],
    ['embossed', 'denim', 'shorts'], null,
    { sku: 'BT-EDB-001', created: '2026-02-22T00:00:00Z' }),

  p('prod-026', 'Embossed Denim Shorts — White', 'embossed-denim-shorts-white',
    'White denim shorts with embossed tribal mask pattern throughout. Clean minimal hardware. Relaxed fit.',
    'White denim shorts with embossed tribal mask pattern.',
    6500000, 'cat-004', 'col-002',
    ['/mock/embossed-denim-shorts-white.PNG'],
    szWaist, [{ name: 'White', hex: '#F5F3F0' }],
    ['embossed', 'denim', 'shorts'], null,
    { sku: 'BT-EDW-001', created: '2026-02-22T00:00:00Z' }),

  // ═══════════════════════════════════════════════════════════
  // ACCESSORIES
  // ═══════════════════════════════════════════════════════════

  p('prod-027', 'Tribal Mask Snapback — Grey', 'tribal-mask-snapback-grey',
    'Structured snapback cap in grey twill with black suede brim. Embossed tribal mask emblem on front panel. Adjustable snap closure.',
    'Grey twill snapback with embossed tribal mask emblem.',
    3500000, 'cat-005', 'col-003',
    ['/mock/tribal-mask-snapback-grey-front.PNG', '/mock/tribal-mask-snapback-grey-side.PNG', '/mock/tribal-mask-snapback-grey-back.PNG'],
    szOne, [{ name: 'Grey', hex: '#808080' }],
    ['snapback', 'cap', 'tribal-mask'], null,
    { video: '/mock/tribal-mask-snapback-grey-video.mp4', sku: 'BT-TMS-001', created: '2026-02-01T00:00:00Z' }),
];


// ═══════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════

export function getProductsByCollection(collectionSlug) {
  const col = collections.find((c) => c.slug === collectionSlug);
  if (!col) return [];
  return products.filter((p) => p.collection_id === col.id && p.is_active);
}

export function getProductsByCategory(categorySlug) {
  const cat = categories.find((c) => c.slug === categorySlug);
  if (!cat) return [];
  return products.filter((p) => p.category_id === cat.id && p.is_active);
}

export function getProductBySlug(slug) {
  return products.find((p) => p.slug === slug && p.is_active) || null;
}

export function getRelatedProducts(productId, limit = 4) {
  const product = products.find((p) => p.id === productId);
  if (!product) return [];
  return products
    .filter((p) => p.category_id === product.category_id && p.id !== productId && p.is_active)
    .slice(0, limit);
}

export function getFeaturedProducts(limit = 6) {
  return products.filter((p) => p.is_featured && p.is_active).slice(0, limit);
}

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

export function getCollectionBySlug(slug) {
  return collections.find((c) => c.slug === slug && c.is_active) || null;
}

export function getCategoryBySlug(slug) {
  return categories.find((c) => c.slug === slug && c.is_active) || null;
}

export function getAllProducts() {
  return products.filter((p) => p.is_active);
}

export function sortProducts(productList, sortBy = 'newest') {
  const sorted = [...productList];
  switch (sortBy) {
    case 'price_asc': return sorted.sort((a, b) => a.price - b.price);
    case 'price_desc': return sorted.sort((a, b) => b.price - a.price);
    case 'newest':
    default: return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }
}

export function filterProducts(productList, filters = {}) {
  let result = [...productList];
  if (filters.category) {
    const cat = categories.find((c) => c.slug === filters.category);
    if (cat) result = result.filter((p) => p.category_id === cat.id);
  }
  if (filters.collection) {
    const col = collections.find((c) => c.slug === filters.collection);
    if (col) result = result.filter((p) => p.collection_id === col.id);
  }
  if (filters.size) {
    result = result.filter((p) => p.sizes.some((s) => s.size === filters.size && s.stock > 0));
  }
  if (filters.minPrice) {
    result = result.filter((p) => p.price >= filters.minPrice);
  }
  if (filters.maxPrice) {
    result = result.filter((p) => p.price <= filters.maxPrice);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      p.short_description?.toLowerCase().includes(q) ||
      p.tags.some((t) => t.includes(q))
    );
  }
  return result;
}
