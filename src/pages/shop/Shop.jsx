import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useParams } from 'react-router';
import ProductGrid from '../../components/product/ProductGrid';
import QuickView from '../../components/product/QuickView';
import FilterDrawer from '../../components/shop/FilterDrawer';
import SortDropdown from '../../components/shop/SortDropdown';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import {
  getAllProducts,
  sortProducts,
  categories as allCategories,
} from '../../utils/mockData';
import '../../styles/pages/Shop.css';

const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36'];
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
  const { category } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filterOpen, setFilterOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PRODUCTS_PER_PAGE);
  const [density, setDensity] = useState(4);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  // Read filters from URL
  const activeFilters = useMemo(() => ({
    category: category
      ? [category]
      : searchParams.get('category')?.split(',').filter(Boolean) || [],
    size: searchParams.get('size')?.split(',').filter(Boolean) || [],
    price: searchParams.get('price')?.split(',').filter(Boolean) || [],
  }), [searchParams, category]);

  const sortValue = searchParams.get('sort') || 'newest';

  const handleFilterChange = useCallback((type, values) => {
    const newParams = new URLSearchParams(searchParams);
    if (values.length > 0) newParams.set(type, values.join(','));
    else newParams.delete(type);
    setSearchParams(newParams, { replace: true });
    setVisibleCount(PRODUCTS_PER_PAGE);
  }, [searchParams, setSearchParams]);

  const handleSortChange = useCallback((value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === 'newest') newParams.delete('sort');
    else newParams.set('sort', value);
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleClearAll = useCallback(() => {
    setSearchParams({}, { replace: true });
    setVisibleCount(PRODUCTS_PER_PAGE);
  }, [setSearchParams]);

  const removeFilter = useCallback((type, value) => {
    const current = activeFilters[type] || [];
    handleFilterChange(type, current.filter((v) => v !== value));
  }, [activeFilters, handleFilterChange]);

  // Quick View
  const openQuickView = useCallback((product) => {
    setQuickViewProduct(product);
    setQuickViewOpen(true);
  }, []);

  const closeQuickView = useCallback(() => {
    setQuickViewOpen(false);
  }, []);

  // Filter and sort
  const allProducts = useMemo(() => getAllProducts(), []);

  const filteredProducts = useMemo(() => {
    let products = [...allProducts];
    if (activeFilters.category.length > 0) {
      products = products.filter((p) => {
        const cat = allCategories.find((c) => c.id === p.category_id);
        return cat && activeFilters.category.includes(cat.slug);
      });
    }
    if (activeFilters.size.length > 0) {
      products = products.filter((p) => p.sizes?.some((s) => activeFilters.size.includes(s.size || s.name)));
    }
    if (activeFilters.price.length > 0) {
      products = products.filter((p) => {
        const priceNaira = p.price / 100;
        return activeFilters.price.some((range) => {
          const [min, max] = range.split('-');
          if (max === 'up') return priceNaira >= Number(min);
          return priceNaira >= Number(min) && priceNaira <= Number(max);
        });
      });
    }
    return sortProducts(products, sortValue);
  }, [allProducts, activeFilters, sortValue]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;

  const categoryOptions = useMemo(() => {
    return allCategories.map((cat) => ({
      ...cat,
      count: allProducts.filter((p) => p.category_id === cat.id).length,
    }));
  }, [allProducts]);

  const filterChips = useMemo(() => {
    const chips = [];
    if (!category) {
      activeFilters.category.forEach((slug) => {
        const cat = allCategories.find((c) => c.slug === slug);
        if (cat) chips.push({ type: 'category', value: slug, label: cat.name });
      });
    }
    activeFilters.size.forEach((size) => chips.push({ type: 'size', value: size, label: size }));
    activeFilters.price.forEach((range) => {
      const labels = { '0-25000': 'Under ₦25,000', '25000-50000': '₦25,000 — ₦50,000', '50000-100000': '₦50,000 — ₦100,000', '100000-up': 'Over ₦100,000' };
      chips.push({ type: 'price', value: range, label: labels[range] || range });
    });
    return chips;
  }, [activeFilters, category]);

  useEffect(() => {
    const catName = category ? allCategories.find((c) => c.slug === category)?.name || 'Shop' : 'Shop';
    document.title = `${catName}. BlackTribe Fashion.`;
  }, [category]);

  const pageTitle = category ? allCategories.find((c) => c.slug === category)?.name || 'Shop' : 'Shop';

  const breadcrumbItems = category
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
                {filteredProducts.length} {filteredProducts.length === 1 ? 'piece' : 'pieces'}
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
          {filteredProducts.length === 0 ? (
            <div className="shop-empty">
              <p className="shop-empty-text">No pieces match your filters.</p>
              <button className="shop-empty-clear" onClick={handleClearAll} type="button">
                Clear All
              </button>
            </div>
          ) : (
            <>
              <ProductGrid
                products={visibleProducts}
                density={density}
                onQuickView={openQuickView}
              />

              {hasMore && (
                <div className="shop-load-more">
                  <button
                    className="shop-load-more-btn"
                    onClick={() => setVisibleCount((prev) => prev + PRODUCTS_PER_PAGE)}
                    type="button"
                  >
                    Load More
                  </button>
                  <span className="shop-load-more-count">
                    Showing {Math.min(visibleCount, filteredProducts.length)} of {filteredProducts.length}
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
