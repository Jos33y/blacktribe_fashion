/*
 * BLACKTRIBE FASHION — ADMIN PRODUCTS LIST
 *
 * Desktop: sortable table with thumbnail, name, price, category, status, stock.
 * Mobile: compact card list with thumbnail + name + price + status.
 * Filters: search, category, status. Sort: newest, price, name.
 * Pagination: 20 per page.
 */

import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Skeleton from '../../components/ui/Skeleton';
import { useToast } from '../../components/ui/Toast';
import '../../styles/admin/admin-products.css';

const LIMIT = 20;

function formatPrice(kobo) {
  if (!kobo && kobo !== 0) return '₦0';
  return '₦' + Math.floor(kobo / 100).toLocaleString('en-NG');
}

function getTotalStock(sizes) {
  if (!sizes || !Array.isArray(sizes)) return 0;
  return sizes.reduce((sum, s) => sum + (s.stock || 0), 0);
}

export default function AdminProducts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const { addToast } = useToast();

  const page = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const status = searchParams.get('status') || '';
  const sort = searchParams.get('sort') || 'newest';

  useEffect(() => {
    document.title = 'Products. BlackTribe Admin.';
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [page, search, category, status, sort]);

  async function getToken() {
    const store = (await import('../../store/authStore')).default.getState();
    return store.getAccessToken();
  }

  async function fetchCategories() {
    try {
      const token = await getToken();
      const res = await fetch('/api/admin/categories', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setCategories(json.data || []);
    } catch { /* silent */ }
  }

  async function fetchProducts() {
    setLoading(true);
    try {
      const token = await getToken();
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
        sort,
        ...(search && { search }),
        ...(category && { category }),
        ...(status && { status }),
      });
      const res = await fetch(`/api/admin/products?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setProducts(json.data || []);
        setTotal(json.total || 0);
      } else {
        addToast('Failed to load products.', 'error');
      }
    } catch (err) {
      console.error('[products] fetch error:', err);
      addToast('Unable to connect.', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleActive(product) {
    try {
      const token = await getToken();
      const endpoint = product.is_active
        ? `/api/admin/products/${product.id}`
        : `/api/admin/products/${product.id}`;
      const method = product.is_active ? 'DELETE' : 'PUT';
      const body = product.is_active ? undefined : JSON.stringify({ is_active: true });
      const res = await fetch(endpoint, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(body && { 'Content-Type': 'application/json' }),
        },
        ...(body && { body }),
      });
      const json = await res.json();
      if (json.success) {
        addToast(product.is_active ? 'Product deactivated.' : 'Product activated.', 'info');
        fetchProducts();
      }
    } catch {
      addToast('Something went wrong.', 'error');
    }
  }

  function updateFilter(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.set('page', '1');
    setSearchParams(next);
  }

  const totalPages = Math.ceil(total / LIMIT);
  const categoryOptions = [
    { value: '', label: 'All Categories' },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ];
  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];
  const sortOptions = [
    { value: 'newest', label: 'Newest' },
    { value: 'name', label: 'Name' },
    { value: 'price_asc', label: 'Price: Low' },
    { value: 'price_desc', label: 'Price: High' },
  ];

  return (
    <div className="admin-page">

      {/* Header */}
      <div className="admin-page-header">
        <div className="admin-page-header__info">
          <h2 className="admin-page-header__title">Products</h2>
          <p className="admin-page-header__desc">
            {total} {total === 1 ? 'product' : 'products'} total
            {' · '}
            <Link to="/admin/categories" style={{ color: 'var(--bt-text-secondary)', textDecoration: 'underline', textUnderlineOffset: 3 }}>
              Manage Categories
            </Link>
          </p>
        </div>
        <div className="admin-page-header__actions">
          <Button to="/admin/products/new" variant="primary" size="small">
            + Add Product
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="admin-toolbar">
        <div className="admin-toolbar__search">
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => updateFilter('search', e.target.value)}
          />
        </div>
        <div className="admin-toolbar__filters">
          <Select
            options={categoryOptions}
            value={category}
            onChange={(e) => updateFilter('category', e.target.value)}
            placeholder={null}
          />
          <Select
            options={statusOptions}
            value={status}
            onChange={(e) => updateFilter('status', e.target.value)}
            placeholder={null}
          />
          <Select
            options={sortOptions}
            value={sort}
            onChange={(e) => updateFilter('sort', e.target.value)}
            placeholder={null}
          />
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <ProductsSkeleton />
      ) : products.length === 0 ? (
        <div className="admin-empty">
          <div className="admin-empty__title">
            {search || category || status ? 'No products match your filters.' : 'No products yet.'}
          </div>
          <div className="admin-empty__desc">
            {!search && !category && !status && 'Add your first product to get started.'}
          </div>
          {!search && !category && !status && (
            <Button to="/admin/products/new" variant="primary" size="small" style={{ marginTop: 16 }}>
              + Add Product
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="products-table-wrap">
            <div className="admin-card admin-card--flush">
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: 56 }}></th>
                      <th>Product</th>
                      <th>Price</th>
                      <th>Category</th>
                      <th>Stock</th>
                      <th>Status</th>
                      <th style={{ width: 120 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id}>
                        <td>
                          {p.images?.[0] ? (
                            <img src={p.images[0]} alt="" className="admin-table__thumb" />
                          ) : (
                            <div className="admin-table__thumb admin-table__thumb--empty" />
                          )}
                        </td>
                        <td>
                          <Link to={`/admin/products/${p.id}/edit`} className="admin-table__primary">
                            {p.name}
                          </Link>
                          {p.badge && (
                            <span className={`admin-status admin-status--${p.badge === 'NEW' ? 'confirmed' : 'processing'}`} style={{ marginLeft: 8 }}>
                              {p.badge}
                            </span>
                          )}
                        </td>
                        <td className="admin-table__mono">{formatPrice(p.price)}</td>
                        <td>{p.categories?.name || '—'}</td>
                        <td className="admin-table__mono">{getTotalStock(p.sizes)}</td>
                        <td>
                          <span className={`admin-status ${p.is_active ? 'admin-status--confirmed' : 'admin-status--cancelled'}`}>
                            {p.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <div className="admin-table__actions">
                            <Link to={`/admin/products/${p.id}/edit`} className="admin-table__action">Edit</Link>
                            <button
                              className={`admin-table__action ${p.is_active ? 'admin-table__action--danger' : ''}`}
                              onClick={() => handleToggleActive(p)}
                            >
                              {p.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Mobile Card List */}
          <div className="products-card-wrap">
            <div className="admin-card-list">
              {products.map((p) => (
                <Link key={p.id} to={`/admin/products/${p.id}/edit`} className="admin-card-list__item">
                  {p.images?.[0] ? (
                    <img src={p.images[0]} alt="" className="admin-card-list__thumb" />
                  ) : (
                    <div className="admin-card-list__thumb" />
                  )}
                  <div className="admin-card-list__info">
                    <span className="admin-card-list__title">{p.name}</span>
                    <div className="admin-card-list__meta">
                      <span className={`admin-status ${p.is_active ? 'admin-status--confirmed' : 'admin-status--cancelled'}`}>
                        {p.is_active ? 'Active' : 'Inactive'}
                      </span>
                      {p.badge && (
                        <span className={`admin-status admin-status--processing`}>{p.badge}</span>
                      )}
                      <span>Stock: {getTotalStock(p.sizes)}</span>
                    </div>
                  </div>
                  <span className="admin-card-list__price">{formatPrice(p.price)}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="admin-pagination">
              <button
                className="admin-pagination__btn"
                disabled={page <= 1}
                onClick={() => updateFilter('page', String(page - 1))}
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={`admin-pagination__btn ${p === page ? 'admin-pagination__btn--active' : ''}`}
                  onClick={() => updateFilter('page', String(p))}
                >
                  {p}
                </button>
              ))}
              <button
                className="admin-pagination__btn"
                disabled={page >= totalPages}
                onClick={() => updateFilter('page', String(page + 1))}
              >
                ›
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ProductsSkeleton() {
  return (
    <div className="admin-card-list">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="admin-card-list__item" style={{ pointerEvents: 'none' }}>
          <Skeleton type="image" style={{ width: 48, height: 48, borderRadius: 2 }} />
          <div style={{ flex: 1 }}>
            <Skeleton type="text" style={{ width: '70%', height: 14, marginBottom: 6 }} />
            <Skeleton type="text" style={{ width: '40%', height: 12 }} />
          </div>
        </div>
      ))}
    </div>
  );
}
