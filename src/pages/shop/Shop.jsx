/*
 * BLACKTRIBE FASHION — SHOP PAGE (Phase 5)
 *
 * Wired to real API:
 *   GET /api/products   — filtered, sorted, paginated
 *   GET /api/categories — for filter sidebar
 *
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useParams } from 'react-router';
import ProductGrid from '../../components/product/ProductGrid';
import QuickView from '../../components/product/QuickView';
import FilterDrawer from '../../components/shop/FilterDrawer';
import SortDropdown from '../../components/shop/SortDropdown';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import Skeleton from '../../components/ui/Skeleton';
import '../../styles/pages/Shop.css';

const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', 'ONE SIZE'];
const PRODUCTS_PER_PAGE = 12;

// Grid density icons
function GridIcon({ cols, isActive }) {
  const bars = Array.from({ length: cols });
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      {bars.map((_, i) => {
        const gap = 2;
        const totalGaps = (cols - 1) * gap;
        const barW = (16 - totalGaps) / cols;
        const x = 1 + i * (barW + gap);
        return (
          <rect
            key={i}
            x={x}
            y="1"
            width={barW}
            height="16"
            fill={isActive ? '#EDEBE8' : '#6A6662'}
            rx="0.5"
          />
        );
      })}
    </svg>
  );
}

export default function Shop() {
  const { category: categoryParam } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filterOpen, setFilterOpen] = useState(false);
  const [density, setDensity] = useState(4);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  /* ─── Data state ─── */
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);

  /* ─── Read filters from URL ─── */
  const activeFilters = useMemo(() => ({
    category: categoryParam
      ? [categoryParam]
      : searchParams.get('category')?.split(',').filter(Boolean) || [],
    size: searchParams.get('size')?.split(',').filter(Boolean) || [],
    price: searchParams.get('price')?.split(',').filter(Boolean) || [],
  }), [searchParams, categoryParam]);

  const sortValue = searchParams.get('sort') || 'newest';

  /* ─── Fetch categories on mount ─── */
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch('/api/categories');
        const json = await res.json();
        if (json.success) setCategories(json.data || []);
      } catch (err) {
        console.error('[Shop] categories fetch error:', err);
      }
    }
    loadCategories();
  }, []);

  /* ─── Fetch products when filters/sort change ─── */
  useEffect(() => {
    setPage(1);
    fetchProducts(1, true);
  }, [activeFilters.category.join(','), activeFilters.size.join(','), activeFilters.price.join(','), sortValue]);

  async function fetchProducts(pageNum = 1, replace = false) {
    if (replace) setLoading(true);
    else setLoadingMore(true);

    try {
      const params = new URLSearchParams();
      params.set('sort', sortValue);
      params.set('page', String(pageNum));
      params.set('limit', String(PRODUCTS_PER_PAGE));

      /* Category filter */
      const catFilter = activeFilters.category[0];
      if (catFilter) params.set('category', catFilter);

      /* Size filter — API supports single size, pick first */
      if (activeFilters.size.length > 0) {
        params.set('size', activeFilters.size[0]);
      }

      /* Price filter — convert range strings to min/max kobo */
      if (activeFilters.price.length > 0) {
        const range = activeFilters.price[0];
        const [min, max] = range.split('-');
        if (min) params.set('price_min', String(Number(min) * 100));
        if (max && max !== 'up') params.set('price_max', String(Number(max) * 100));
      }

      const res = await fetch(`/api/products?${params}`);
      const json = await res.json();

      if (json.success) {
        if (replace) {
          setProducts(json.data || []);
        } else {
          setProducts((prev) => [...prev, ...(json.data || [])]);
        }
        setTotalProducts(json.total || 0);
      }
    } catch (err) {
      console.error('[Shop] products fetch error:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  /* ─── Load more ─── */
  const handleLoadMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchProducts(nextPage, false);
  }, [page]);

  const hasMore = products.length < totalProducts;

  /* ─── Filter handlers ─── */
  const handleFilterChange = useCallback((type, values) => {
    const newParams = new URLSearchParams(searchParams);
    if (values.length > 0) newParams.set(type, values.join(','));
    else newParams.delete(type);
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleSortChange = useCallback((value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === 'newest') newParams.delete('sort');
    else newParams.set('sort', value);
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleClearAll = useCallback(() => {
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  const removeFilter = useCallback((type, value) => {
    const current = activeFilters[type] || [];
    handleFilterChange(type, current.filter((v) => v !== value));
  }, [activeFilters, handleFilterChange]);

  /* ─── Quick View ─── */
  const openQuickView = useCallback((product) => {
    setQuickViewProduct(product);
    setQuickViewOpen(true);
  }, []);

  const closeQuickView = useCallback(() => {
    setQuickViewOpen(false);
  }, []);

  /* ─── Category options for filter drawer ─── */
  const categoryOptions = useMemo(() => {
    return categories.map((cat) => ({
      ...cat,
      count: cat.product_count || 0,
    }));
  }, [categories]);

  /* ─── Filter chips ─── */
  const filterChips = useMemo(() => {
    const chips = [];
    if (!categoryParam) {
      activeFilters.category.forEach((slug) => {
        const cat = categories.find((c) => c.slug === slug);
        if (cat) chips.push({ type: 'category', value: slug, label: cat.name });
      });
    }
    activeFilters.size.forEach((size) => chips.push({ type: 'size', value: size, label: size }));
    activeFilters.price.forEach((range) => {
      const labels = { '0-25000': 'Under ₦25,000', '25000-50000': '₦25,000 — ₦50,000', '50000-100000': '₦50,000 — ₦100,000', '100000-up': 'Over ₦100,000' };
      chips.push({ type: 'price', value: range, label: labels[range] || range });
    });
    return chips;
  }, [activeFilters, categoryParam, categories]);

  /* ─── Page title ─── */
  const pageTitle = categoryParam
    ? categories.find((c) => c.slug === categoryParam)?.name || categoryParam.charAt(0).toUpperCase() + categoryParam.slice(1)
    : 'Shop';

  useEffect(() => {
    document.title = `${pageTitle}. BlackTribe Fashion.`;
  }, [pageTitle]);

  const breadcrumbItems = categoryParam
    ? [{ label: 'Home', to: '/' }, { label: 'Shop', to: '/shop' }, { label: pageTitle }]
    : [{ label: 'Home', to: '/' }, { label: 'Shop' }];

  return (
    <article className="shop">

      {/* ═══ HERO ═══ */}
      <section className="shop-hero">
        <div className="shop-hero-inner">
          <Breadcrumbs items={breadcrumbItems} />
          <h1 className="shop-title">{pageTitle}</h1>
        </div>
      </section>

      {/* ═══ STICKY TOOLBAR ═══ */}
      <div className="shop-toolbar-wrapper">
        <div className="shop-toolbar">
          <div className="shop-toolbar-inner">
            <div className="shop-toolbar-left">
              <button className="shop-filter-btn" onClick={() => setFilterOpen(true)} type="button">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path d="M3 6h18M7 12h10M10 18h4" />
                </svg>
                Filter
              </button>
              <span className="shop-count">
                {totalProducts} {totalProducts === 1 ? 'piece' : 'pieces'}
              </span>
            </div>

            <div className="shop-toolbar-right">
              {/* Grid density toggle */}
              <div className="shop-density" role="radiogroup" aria-label="Grid density">
                {[2, 3, 4].map((cols) => (
                  <button
                    key={cols}
                    className={`shop-density-btn ${density === cols ? 'shop-density-btn--active' : ''}`}
                    onClick={() => setDensity(cols)}
                    role="radio"
                    aria-checked={density === cols}
                    aria-label={`${cols} columns`}
                    type="button"
                  >
                    <GridIcon cols={cols} isActive={density === cols} />
                  </button>
                ))}
              </div>

              <div className="shop-toolbar-divider" />

              <SortDropdown value={sortValue} onChange={handleSortChange} />
            </div>
          </div>
        </div>
      </div>

      {/* ═══ FILTER CHIPS ═══ */}
      {filterChips.length > 0 && (
        <div className="shop-chips">
          <div className="shop-chips-inner">
            {filterChips.map((chip) => (
              <button
                key={`${chip.type}-${chip.value}`}
                className="shop-chip"
                onClick={() => removeFilter(chip.type, chip.value)}
                type="button"
                aria-label={`Remove ${chip.label} filter`}
              >
                {chip.label}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            ))}
            <button className="shop-chip shop-chip--clear" onClick={handleClearAll} type="button">
              Clear All
            </button>
          </div>
        </div>
      )}

      {/* ═══ PRODUCT GRID ═══ */}
      <section className="shop-grid-section">
        <div className="shop-grid-inner">
          {loading ? (
            <ProductGrid products={[]} density={density} loading={true} />
          ) : products.length === 0 ? (
            <div className="shop-empty">
              <p className="shop-empty-text">No pieces match your filters.</p>
              <button className="shop-empty-clear" onClick={handleClearAll} type="button">
                Clear All
              </button>
            </div>
          ) : (
            <>
              <ProductGrid
                products={products}
                density={density}
                onQuickView={openQuickView}
              />

              {hasMore && (
                <div className="shop-load-more">
                  <button
                    className="shop-load-more-btn"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    type="button"
                  >
                    {loadingMore ? 'Loading...' : 'Load More'}
                  </button>
                  <span className="shop-load-more-count">
                    Showing {products.length} of {totalProducts}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* ═══ FILTER DRAWER ═══ */}
      <FilterDrawer
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        categories={categoryOptions}
        sizes={ALL_SIZES}
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
        onClearAll={handleClearAll}
      />

      {/* ═══ QUICK VIEW ═══ */}
      <QuickView
        product={quickViewProduct}
        isOpen={quickViewOpen}
        onClose={closeQuickView}
      />
    </article>
  );
}
