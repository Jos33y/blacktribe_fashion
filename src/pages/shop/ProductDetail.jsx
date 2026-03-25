/*
 * BLACKTRIBE FASHION — PRODUCT DETAIL PAGE (Phase 5)
 *
 * Wired to real API:
 *   GET /api/products/:slug          — single product
 *   GET /api/products/:slug/related  — related products
 *

 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router';
import ImageGallery from '../../components/product/ImageGallery';
import SizeSelector from '../../components/product/SizeSelector';
import ColorSelector from '../../components/product/ColorSelector';
import ScarcityIndicator from '../../components/product/ScarcityIndicator';
import QuantitySelector from '../../components/product/QuantitySelector';
import Badge from '../../components/ui/Badge';
import ExpandableSection from '../../components/ui/ExpandableSection';
import ProductCard from '../../components/product/ProductCard';
import WishlistHeart from '../../components/product/WishlistHeart';
import Skeleton from '../../components/ui/Skeleton';
import { useToast } from '../../components/ui/Toast';
import useCartStore from '../../store/cartStore';
import useUIStore from '../../store/uiStore';
import { formatPrice } from '../../utils/formatPrice';
import { trackProductView } from '../../utils/tracker';
import { setPageMeta, clearPageMeta } from '../../utils/pageMeta';
import JsonLd, { buildProductSchema, buildBreadcrumbSchema } from '../../components/seo/JsonLd';
import '../../styles/pages/ProductDetail.css';
import '../../styles/product/WishlistHeart.css';


/* ═══ TRUST BAR ═══ */

function TrustBar() {
  return (
    <div className="pd-trust">
      <div className="pd-trust-item">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="M20 12V22H4V12" /><path d="M22 7H2v5h20V7z" /><path d="M12 22V7" /><path d="M12 7H7.5a2.5 2.5 0 1 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
        </svg>
        <span>Nationwide and worldwide delivery</span>
      </div>
      <div className="pd-trust-item">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path d="M12 6v6l4 2" />
        </svg>
        <span>Returns within 14 days</span>
      </div>
      <div className="pd-trust-item">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <span>Secure checkout via Paystack</span>
      </div>
    </div>
  );
}


/* ═══ SHARE BUTTON ═══ */

function ShareButton({ product }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareData = {
      title: product.name,
      text: `${product.name} — ${formatPrice(product.price)} on BlackTribe Fashion`,
      url: window.location.href,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch {}
    } else {
      try {
        await navigator.clipboard?.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {}
    }
  };

  return (
    <button className="pd-share" onClick={handleShare} type="button" aria-label="Share this piece">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
      </svg>
      {copied ? 'Link copied' : 'Share'}
    </button>
  );
}


/* ═══ MOBILE STICKY CTA ═══ */

function MobileStickyBar({ product, onAddToBag, visible, isSoldOut }) {
  if (!visible) return null;

  return (
    <div className="pd-sticky" aria-hidden="true">
      <div className="pd-sticky__inner">
        <div className="pd-sticky__info">
          <span className="pd-sticky__name">{product.name}</span>
          <span className="pd-sticky__price">{formatPrice(product.price)}</span>
        </div>
        <button
          className="pd-sticky__btn"
          onClick={onAddToBag}
          disabled={isSoldOut}
          type="button"
        >
          {isSoldOut ? 'Sold Out' : product.badge === 'PRE-ORDER' ? 'Pre-Order' : 'Add to Bag'}
        </button>
      </div>
    </div>
  );
}


/* ═══ PRODUCT DETAIL PAGE ═══ */

export default function ProductDetail() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [sizeError, setSizeError] = useState('');
  const [showSticky, setShowSticky] = useState(false);
  const addBtnRef = useRef(null);

  const { addToast } = useToast();
  const addItem = useCartStore((s) => s.addItem);
  const openCartDrawer = useUIStore((s) => s.openCartDrawer);

  /* ─── Load product from API ─── */
  useEffect(() => {
    setLoading(true);
    setProduct(null);
    setRelatedProducts([]);
    setSelectedSize('');
    setSelectedColor('');
    setQuantity(1);
    setSizeError('');
    window.scrollTo(0, 0);

    async function loadProduct() {
      try {
        const res = await fetch(`/api/products/${slug}`);
        const json = await res.json();

        if (json.success && json.data) {
          const p = json.data;
          setProduct(p);
          trackProductView(p.id, p.name);
          if (p.colors?.length > 0) {
            setSelectedColor(p.colors[0].name || p.colors[0]);
          }

          /* Fetch related products */
          try {
            const relRes = await fetch(`/api/products/${slug}/related`);
            const relJson = await relRes.json();
            if (relJson.success) setRelatedProducts(relJson.data || []);
          } catch {
            /* Silent — related products are supplementary */
          }
        } else {
          setProduct(null);
        }
      } catch (err) {
        console.error('[ProductDetail] fetch error:', err);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [slug]);

  /* ─── Page meta (title, OG, description, canonical) ─── */
  useEffect(() => {
    if (product) {
      setPageMeta({
        title: `${product.name}. BlackTribe Fashion.`,
        description: product.short_description
          ? `${product.short_description} ${formatPrice(product.price)}. Shop at BlackTribe Fashion.`
          : `${product.name}. ${formatPrice(product.price)}. Shop at BlackTribe Fashion.`,
        path: `/product/${product.slug}`,
        image: product.images?.[0],
        type: 'product',
      });
    }
    return () => clearPageMeta();
  }, [product]);

  /* ─── Scroll reveals ─── */
  useEffect(() => {
    const els = document.querySelectorAll('.pd-reveal');
    if (!els.length) return;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('pd-reveal--visible'); obs.unobserve(e.target); }
      }),
      { threshold: 0.08 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [loading, relatedProducts]);

  /* ─── Mobile sticky CTA ─── */
  useEffect(() => {
    const btn = addBtnRef.current;
    if (!btn) return;
    const obs = new IntersectionObserver(
      ([entry]) => setShowSticky(!entry.isIntersecting),
      { threshold: 0 }
    );
    obs.observe(btn);
    return () => obs.disconnect();
  }, [loading, product]);

  /* ─── Stock for selected size ─── */
  const selectedSizeStock = useMemo(() => {
    if (!product?.sizes?.length) return null;
    if (!selectedSize) return null;
    const sizeObj = product.sizes.find((s) => (s.size || s.name) === selectedSize);
    return sizeObj ? sizeObj.stock : null;
  }, [product, selectedSize]);

  /* ─── Is entire product sold out? ─── */
  const isSoldOut = useMemo(() => {
    if (!product?.sizes?.length) return false;
    return product.sizes.every((s) => s.stock === 0);
  }, [product]);

  /* ─── Reset quantity when size changes ─── */
  useEffect(() => {
    setQuantity(1);
  }, [selectedSize]);

  /* ─── Remaining inventory ─── */
  const getRemainingInventory = (p) => {
    if (!p?.sizes || !p.show_inventory) return undefined;
    return p.remaining_inventory || p.sizes.reduce((sum, s) => sum + (s.stock || 0), 0);
  };

  /* ─── Add to bag ─── */
  const handleAddToBag = useCallback(() => {
    if (isSoldOut) return;

    if (product?.sizes?.length > 0 && !selectedSize) {
      setSizeError('Select a size');
      const el = document.querySelector('.size-selector');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setSizeError('');

    const added = addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      size: selectedSize,
      color: selectedColor,
      image: product.images?.[0] || '',
      badge: product.badge || null,
      quantity,
      maxStock: selectedSizeStock,
    });

    if (added) {
      addToast('Added to bag.', 'success');
      openCartDrawer();
    } else {
      addToast('Maximum stock reached for this size.', 'info');
    }
  }, [product, selectedSize, selectedColor, quantity, selectedSizeStock, isSoldOut, addItem, addToast, openCartDrawer]);


  /* ═══ LOADING ═══ */
  if (loading) {
    return (
      <article className="pd">
        <div className="pd-layout">
          <div className="pd-gallery-col">
            <Skeleton type="image" style={{ aspectRatio: '3/4', width: '100%' }} />
          </div>
          <div className="pd-info-col">
            <div className="pd-info-inner">
              <Skeleton type="text" style={{ width: 80, height: 12, marginBottom: 20 }} />
              <Skeleton type="text" style={{ width: '70%', height: 28, marginBottom: 14 }} />
              <Skeleton type="text" style={{ width: '35%', height: 20, marginBottom: 28 }} />
              <Skeleton type="text" style={{ width: '100%', height: 14, marginBottom: 8 }} />
              <Skeleton type="text" style={{ width: '85%', height: 14, marginBottom: 40 }} />
              <Skeleton type="text" style={{ width: '100%', height: 54 }} />
            </div>
          </div>
        </div>
      </article>
    );
  }


  /* ═══ NOT FOUND ═══ */
  if (!product) {
    return (
      <article className="pd-empty">
        <h1 className="pd-empty-title">Piece not found</h1>
        <p className="pd-empty-sub">The piece you are looking for does not exist.</p>
        <Link to="/shop" className="pd-empty-link">
          Back to Shop
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </article>
    );
  }


  /* ═══ RENDER ═══ */
  const categoryObj = product.categories || null;
  const remainingInventory = getRemainingInventory(product);

  /* ─── Structured data ─── */
  const breadcrumbItems = [
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/shop' },
    ...(categoryObj ? [{ name: categoryObj.name, path: `/shop/${categoryObj.slug}` }] : []),
    { name: product.name },
  ];

  /* ─── Button label ─── */
  let addBtnLabel = 'Add to Bag';
  if (isSoldOut) addBtnLabel = 'Sold Out';
  else if (product.badge === 'PRE-ORDER') addBtnLabel = 'Pre-Order Now';

  return (
    <article className="pd">

      {/* ─── Structured Data (JSON-LD) ─── */}
      <JsonLd data={buildProductSchema(product)} />
      <JsonLd data={buildBreadcrumbSchema(breadcrumbItems)} />

      {/* ─── Breadcrumbs (desktop) ─── */}
      <nav className="pd-breadcrumbs" aria-label="Breadcrumb">
        <Link to="/" className="pd-crumb">Home</Link>
        <span className="pd-crumb-sep" aria-hidden="true">/</span>
        <Link to="/shop" className="pd-crumb">Shop</Link>
        {categoryObj && (
          <>
            <span className="pd-crumb-sep" aria-hidden="true">/</span>
            <Link to={`/shop/${categoryObj.slug}`} className="pd-crumb">{categoryObj.name}</Link>
          </>
        )}
        <span className="pd-crumb-sep" aria-hidden="true">/</span>
        <span className="pd-crumb pd-crumb--current">{product.name}</span>
      </nav>


      {/* ═══ MAIN LAYOUT ═══ */}
      <div className="pd-layout">

        {/* LEFT: Gallery */}
        <div className="pd-gallery-col">
          <ImageGallery
            images={product.images}
            videoUrl={product.video_url || null}
            productName={product.name}
          />
        </div>

        {/* RIGHT: Product info (sticky on desktop) */}
        <div className="pd-info-col">
          <div className="pd-info-inner">

            {/* BLOCK 1: Identity */}
            <div className="pd-identity">
              {product.badge && (
                <div className="pd-badge"><Badge type={product.badge} /></div>
              )}
              <div className="pd-name-row">
                <h1 className="pd-name">{product.name}</h1>
                <WishlistHeart productId={product.id} />
              </div>
              <p className="pd-price">{formatPrice(product.price)}</p>
            </div>

            {/* Description */}
            {product.short_description && (
              <p className="pd-description">
                {product.short_description}
              </p>
            )}

            {/* Scarcity */}
            <ScarcityIndicator
              showInventory={product.show_inventory}
              totalInventory={product.total_inventory}
              remainingInventory={remainingInventory}
              preOrderDeadline={product.preorder_deadline}
            />

            {/* BLOCK 2: Selection */}
            <div className="pd-selection">
              {product.colors?.length > 0 && (
                <ColorSelector
                  colors={product.colors}
                  selectedColor={selectedColor}
                  onSelect={setSelectedColor}
                />
              )}
              {product.sizes?.length > 0 && (
                <>
                  <SizeSelector
                    sizes={product.sizes}
                    selectedSize={selectedSize}
                    onSelect={(s) => { setSelectedSize(s); setSizeError(''); }}
                  />
                  {sizeError && <p className="pd-size-error" role="alert">{sizeError}</p>}
                </>
              )}

              {/* Quantity — only show when a size is selected (or no sizes exist) */}
              {(!product.sizes?.length || selectedSize) && !isSoldOut && (
                <div className="pd-quantity">
                  <QuantitySelector
                    quantity={quantity}
                    maxStock={selectedSizeStock}
                    onQuantityChange={setQuantity}
                  />
                </div>
              )}
            </div>

            {/* BLOCK 3: Action */}
            <div className="pd-action">
              <button
                ref={addBtnRef}
                className={`pd-add-btn ${isSoldOut ? 'pd-add-btn--disabled' : ''}`}
                onClick={handleAddToBag}
                disabled={isSoldOut}
                type="button"
              >
                {addBtnLabel}
              </button>
              <TrustBar />
            </div>

            {/* BLOCK 4: Details */}
            <div className="pd-details">
              <ExpandableSection title="Materials and Care" defaultOpen={false}>
                <div className="pd-expand-content">
                  <p>100% heavyweight cotton, 280gsm. Oversized fit. Machine wash cold. Hang dry. Do not bleach.</p>
                </div>
              </ExpandableSection>
              <ExpandableSection title="Size Guide" defaultOpen={false}>
                <div className="pd-expand-content">
                  <p>Every piece runs true to size. When in doubt, size up.</p>
                  <table className="pd-size-table">
                    <thead><tr><th></th><th>S</th><th>M</th><th>L</th><th>XL</th><th>XXL</th></tr></thead>
                    <tbody>
                      <tr><td>Chest</td><td>96</td><td>102</td><td>108</td><td>114</td><td>120</td></tr>
                      <tr><td>Length</td><td>70</td><td>72</td><td>74</td><td>76</td><td>78</td></tr>
                    </tbody>
                  </table>
                  <p className="pd-size-note">All measurements in centimeters.</p>
                </div>
              </ExpandableSection>
              <ExpandableSection title="Shipping and Returns" defaultOpen={false}>
                <div className="pd-expand-content">
                  <p>Nigeria: 1-7 business days. Rates calculated at checkout.</p>
                  <p>International: 7-14 business days. Calculated at checkout.</p>
                  <p>Returns accepted within 14 days of delivery. Unworn with tags attached.</p>
                </div>
              </ExpandableSection>
            </div>

            <ShareButton product={product} />

          </div>
        </div>
      </div>


      {/* ═══ RELATED PRODUCTS ═══ */}
      {relatedProducts.length > 0 && (
        <section className="pd-related pd-reveal">
          <div className="pd-related-inner">
            <div className="pd-related-header">
              <span className="pd-related-eyebrow">Curated</span>
              <h2 className="pd-related-title">You might also like</h2>
            </div>
            <div className="pd-related-grid">
              {relatedProducts.slice(0, 4).map((rp) => (
                <ProductCard key={rp.id} product={rp} />
              ))}
            </div>
          </div>
        </section>
      )}


      {/* ═══ MOBILE STICKY CTA ═══ */}
      <MobileStickyBar
        product={product}
        onAddToBag={handleAddToBag}
        visible={showSticky}
        isSoldOut={isSoldOut}
      />

    </article>
  );
}
