/*
 * BLACKTRIBE FASHION — WALK-IN ORDER (POS MODE) v2
 *
 * Redesigned as a proper point-of-sale register layout.
 *
 * Desktop: 2-column split.
 *   Left  — product search + quick catalog grid
 *   Right — persistent order ticket (items, discount, payment, complete)
 *
 * Mobile: single column, sticky order bar at bottom.
 *   Tapping the bar expands the full order panel.
 *
 * Build + Payment merged into one screen (no "Proceed to Payment" step).
 * Receipt remains a separate view.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { useToast } from '../../components/ui/Toast';
import useAuthStore from '../../store/authStore';
import WalkInReceiptImage from '../../components/admin/WalkInReceiptImage';
import { offlineQueue } from '../../utils/offlineQueue';
import '../../styles/admin/admin-walkin.css';

/* ═══ HELPERS ═══ */

function formatPrice(kobo) {
  if (!kobo && kobo !== 0) return '₦0';
  return '₦' + Math.floor(kobo / 100).toLocaleString('en-NG');
}

function koboToNaira(kobo) {
  return Math.floor(kobo / 100);
}

/* Formats kobo to comma-separated naira string (no ₦ symbol) for placeholders */
function formatNairaPlain(kobo) {
  return Math.floor(kobo / 100).toLocaleString('en-NG');
}

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'pos_terminal', label: 'POS Terminal' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
];

/* ═══ ICONS (inline, no library) ═══ */

const PosIcons = {
  search: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  plus: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  minus: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  trash: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6" /><path d="M14 11v6" />
    </svg>
  ),
  tag: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
      <circle cx="7" cy="7" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  receipt: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2-3-2z" />
      <line x1="8" y1="8" x2="16" y2="8" /><line x1="8" y1="12" x2="16" y2="12" />
      <line x1="8" y1="16" x2="12" y2="16" />
    </svg>
  ),
  chevDown: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  chevUp: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  ),
  printer: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6 9V2h12v7" /><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  ),
  bag: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  ),
};


/* ═══ COMPONENT ═══ */

export default function WalkInOrder() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const searchRef = useRef(null);

  /* ─── State ─── */
  const [step, setStep] = useState('pos'); // 'pos' | 'receipt'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [catalog, setCatalog] = useState([]); // Quick browse products
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [discountCode, setDiscountCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountError, setDiscountError] = useState('');
  const [validatingDiscount, setValidatingDiscount] = useState(false);
  const [appliedCode, setAppliedCode] = useState('');
  const [cashReceived, setCashReceived] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [completing, setCompleting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [mobileOrderOpen, setMobileOrderOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(offlineQueue.isOnline());
  const [pendingCount, setPendingCount] = useState(offlineQueue.getPendingOrders().length);

  useEffect(() => {
    document.title = 'New Walk-in Order. BlackTribe Admin.';
    if (window.innerWidth >= 768) searchRef.current?.focus();
    loadCatalog();

    /* Listen for online/offline changes */
    const unsub = offlineQueue.onStatusChange((online) => {
      setIsOnline(online);
      if (online) {
        /* Auto-sync queued orders when back online */
        syncPendingOrders();
      }
    });

    return unsub;
  }, []);

  async function getToken() {
    return useAuthStore.getState().getAccessToken();
  }

  /* ─── Sync pending orders ─── */
  async function syncPendingOrders() {
    const result = await offlineQueue.syncPendingOrders(getToken);
    setPendingCount(offlineQueue.getPendingOrders().length);
    if (result.synced > 0) {
      addToast(`${result.synced} queued ${result.synced === 1 ? 'order' : 'orders'} synced.`, 'success');
    }
    if (result.failed > 0) {
      addToast(`${result.failed} ${result.failed === 1 ? 'order' : 'orders'} failed to sync.`, 'error');
    }
  }

  /* ─── Load catalog (cache for offline use) ─── */
  async function loadCatalog() {
    setCatalogLoading(true);

    /* If offline, use cached products */
    if (!navigator.onLine) {
      const cached = offlineQueue.getCachedProducts();
      if (cached.length > 0) {
        setCatalog(cached);
        setCatalogLoading(false);
        return;
      }
    }

    try {
      const token = await getToken();
      const res = await fetch('/api/admin/products?status=active&limit=24&sort=newest', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setCatalog(json.data || []);
        /* Cache for offline use */
        offlineQueue.cacheProducts(json.data || []);
      }
    } catch {
      /* Network failed — try cache */
      const cached = offlineQueue.getCachedProducts();
      if (cached.length > 0) setCatalog(cached);
    }
    finally { setCatalogLoading(false); }
  }

  /* ─── Product Search ─── */
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => searchProducts(), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  async function searchProducts() {
    setSearching(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/products?search=${encodeURIComponent(searchQuery)}&status=active&limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setSearchResults(json.data || []);
    } catch { /* silent */ }
    finally { setSearching(false); }
  }

  /* ─── Item management ─── */
  function addItem(product, size) {
    const existing = items.find((i) => i.product.id === product.id && i.size === size);
    if (existing) {
      setItems(items.map((i) =>
        i.product.id === product.id && i.size === size
          ? { ...i, quantity: i.quantity + 1 }
          : i
      ));
    } else {
      setItems([...items, {
        product,
        size,
        quantity: 1,
        price: product.price,
        overridePrice: null,
      }]);
    }
    setSearchQuery('');
    setSearchResults([]);
if (window.innerWidth >= 768) searchRef.current?.focus();
    // Flash the order panel on mobile
    if (window.innerWidth < 768) {
      setMobileOrderOpen(true);
      setTimeout(() => setMobileOrderOpen(false), 1500);
    }
  }

  function removeItem(index) {
    setItems(items.filter((_, i) => i !== index));
  }

  function updateQuantity(index, qty) {
    if (qty < 1) return;
    setItems(items.map((item, i) => i === index ? { ...item, quantity: qty } : item));
  }

  function setOverridePrice(index, nairaStr) {
    const kobo = nairaStr ? Math.round(parseFloat(nairaStr) * 100) : null;
    setItems(items.map((item, i) => i === index ? { ...item, overridePrice: kobo } : item));
  }

  /* ─── Totals ─── */
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => {
    const unitPrice = i.overridePrice !== null ? i.overridePrice : i.price;
    return sum + unitPrice * i.quantity;
  }, 0);
  const total = Math.max(0, subtotal - discountAmount);
  const changeAmount = paymentMethod === 'cash' && cashReceived
    ? Math.round(parseFloat(cashReceived) * 100) - total
    : 0;

  /* ─── Validate Discount ─── */
  async function validateDiscount() {
    if (!discountCode.trim()) return;
    setValidatingDiscount(true);
    setDiscountError('');
    try {
      const token = await getToken();
      const res = await fetch('/api/admin/validate-discount', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: discountCode.trim(), subtotal }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setDiscountAmount(json.data.discount_amount);
        setAppliedCode(json.data.code);
        setDiscountError('');
        addToast(`Code applied. You save ${formatPrice(json.data.discount_amount)}.`, 'info');
      } else {
        setDiscountError(json.error || 'Invalid code.');
        setDiscountAmount(0);
        setAppliedCode('');
      }
    } catch {
      setDiscountError('Failed to validate code.');
    } finally {
      setValidatingDiscount(false);
    }
  }

  function removeDiscount() {
    setDiscountCode('');
    setDiscountAmount(0);
    setAppliedCode('');
    setDiscountError('');
  }

  /* ─── Complete Order ─── */
  async function handleComplete() {
    if (items.length === 0) { addToast('Add items to the order.', 'error'); return; }

    const payload = {
      items: items.map((i) => ({
        product_id: i.product.id,
        name: i.product.name,
        price: i.overridePrice !== null ? i.overridePrice : i.price,
        quantity: i.quantity,
        size: i.size,
        image_url: i.product.images?.[0] || null,
      })),
      payment_method: paymentMethod,
      subtotal,
      total,
      discount_amount: discountAmount,
      discount_code: discountCode || null,
      guest_email: customerEmail || null,
    };

    setCompleting(true);

    /* Offline: queue the order for later sync */
    if (!navigator.onLine) {
      const queued = offlineQueue.queueOrder(payload);
      if (queued) {
        setPendingCount(offlineQueue.getPendingOrders().length);
        setCompletedOrder({
          order_number: `QUEUED-${queued._queue_id}`,
          created_at: queued._queued_at,
          subtotal: payload.subtotal,
          discount_amount: payload.discount_amount,
          total: payload.total,
          payment_method: payload.payment_method,
          items: payload.items,
          _offline: true,
        });
        setStep('receipt');
        addToast('Order queued. Will sync when online.', 'info');
      } else {
        addToast('Failed to queue order.', 'error');
      }
      setCompleting(false);
      return;
    }

    /* Online: send to server */
    try {
      const token = await getToken();

      const res = await fetch('/api/admin/orders/walk-in', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        setCompletedOrder(json.data);
        setStep('receipt');
        addToast('Order completed.', 'success');
      } else {
        addToast(json.error || 'Failed to create order.', 'error');
      }
    } catch {
      /* Network error — queue offline */
      const queued = offlineQueue.queueOrder(payload);
      if (queued) {
        setPendingCount(offlineQueue.getPendingOrders().length);
        setCompletedOrder({
          order_number: `QUEUED-${queued._queue_id}`,
          created_at: queued._queued_at,
          subtotal: payload.subtotal,
          discount_amount: payload.discount_amount,
          total: payload.total,
          payment_method: payload.payment_method,
          items: payload.items,
          _offline: true,
        });
        setStep('receipt');
        addToast('Connection lost. Order queued for sync.', 'info');
      } else {
        addToast('Something went wrong.', 'error');
      }
    } finally {
      setCompleting(false);
    }
  }

  /* ─── Reset for new order ─── */
  function handleNewOrder() {
    setItems([]);
    setPaymentMethod('cash');
    setDiscountCode('');
    setDiscountAmount(0);
    setAppliedCode('');
    setDiscountError('');
    setCashReceived('');
    setCustomerEmail('');
    setCompletedOrder(null);
    setStep('pos');
    if (window.innerWidth >= 768) searchRef.current?.focus();
  }

  function handlePrint() {
    window.print();
  }


  /* ═══ RECEIPT VIEW ═══ */

  if (step === 'receipt' && completedOrder) {
    return (
      <div className="admin-page pos">
        <div className="pos-receipt-wrap">
          <div className="pos-receipt" id="walkin-receipt">
            <div className="pos-receipt__header">
              <span className="pos-receipt__brand">BLACKTRIBE</span>
              <span className="pos-receipt__sub">FASHION</span>
            </div>

            <hr className="pos-receipt__hr" />

            <div className="pos-receipt__meta">
              <span>Order: {completedOrder.order_number}</span>
              <span>{new Date(completedOrder.created_at).toLocaleString('en-GB', {
                day: 'numeric', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}</span>
            </div>

            <hr className="pos-receipt__hr" />

            <div className="pos-receipt__items">
              {(completedOrder.items || items).map((item, i) => (
                <div key={i} className="pos-receipt__item">
                  <div className="pos-receipt__item-info">
                    <span>{item.name}</span>
                    <span className="pos-receipt__item-detail">
                      Size {item.size} x{item.quantity}
                    </span>
                  </div>
                  <span className="pos-receipt__item-price">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <hr className="pos-receipt__hr" />

            <div className="pos-receipt__totals">
              <div className="pos-receipt__row">
                <span>Subtotal</span>
                <span>{formatPrice(completedOrder.subtotal)}</span>
              </div>
              {completedOrder.discount_amount > 0 && (
                <div className="pos-receipt__row">
                  <span>Discount</span>
                  <span>-{formatPrice(completedOrder.discount_amount)}</span>
                </div>
              )}
              <div className="pos-receipt__row pos-receipt__row--total">
                <span>Total</span>
                <span>{formatPrice(completedOrder.total)}</span>
              </div>
              <div className="pos-receipt__row">
                <span>Payment</span>
                <span style={{ textTransform: 'capitalize' }}>
                  {completedOrder.payment_method?.replace('_', ' ')}
                </span>
              </div>
            </div>

            <hr className="pos-receipt__hr" />

            <div className="pos-receipt__footer">
              <p>Thank you for shopping with BlackTribe.</p>
              <p className="pos-receipt__url">blacktribefashion.com</p>
            </div>
          </div>

          <div className="pos-receipt__actions">
            <Button variant="secondary" onClick={handlePrint}>
              {PosIcons.printer} Print Receipt
            </Button>
            <Button variant="primary" onClick={handleNewOrder}>
              {PosIcons.plus} New Order
            </Button>
          </div>

          {/* Shareable receipt image (WhatsApp / Save) */}
          <WalkInReceiptImage
            order={completedOrder}
            items={completedOrder.items || items}
          />
        </div>
      </div>
    );
  }


  /* ═══ MAIN POS VIEW ═══ */

  return (
    <div className="admin-page pos">

      {/* Offline indicator */}
      {!isOnline && (
        <div className="pos-offline-bar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0119 12.55"/><path d="M5 12.55a10.94 10.94 0 015.17-2.39"/><path d="M10.71 5.05A16 16 0 0122.56 9"/><path d="M1.42 9a15.91 15.91 0 014.7-2.88"/><path d="M8.53 16.11a6 6 0 016.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>
          <span>You are offline. Orders will be queued and synced when connection returns.</span>
        </div>
      )}

      {/* Pending sync bar */}
      {pendingCount > 0 && isOnline && (
        <div className="pos-pending-bar">
          <span>{pendingCount} queued {pendingCount === 1 ? 'order' : 'orders'} waiting to sync.</span>
          <button className="pos-pending-bar__sync" onClick={syncPendingOrders}>Sync Now</button>
        </div>
      )}

      <div className="pos-register">

        {/* ─── LEFT: Product Catalog ─── */}
        <div className="pos-catalog">

          {/* Search bar */}
          <div className="pos-search">
            <div className="pos-search__icon">{PosIcons.search}</div>
            <input
              ref={searchRef}
              className="pos-search__input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products by name..."
              autoComplete="off"
            />
            {searchQuery && (
              <button
                className="pos-search__clear"
                onClick={() => { setSearchQuery(''); setSearchResults([]); searchRef.current?.focus(); }}
                aria-label="Clear search"
              >
                ×
              </button>
            )}

            {/* Search results dropdown */}
            {searchResults.length > 0 && (
              <div className="pos-search__dropdown">
                {searchResults.map((product) => (
                  <div key={product.id} className="pos-search__result">
                    <div className="pos-search__result-info">
                      {product.images?.[0] && (
                        <img src={product.images[0]} alt="" className="pos-search__result-img" />
                      )}
                      <div>
                        <span className="pos-search__result-name">{product.name}</span>
                        <span className="pos-search__result-price">{formatPrice(product.price)}</span>
                      </div>
                    </div>
                    <div className="pos-search__result-sizes">
                      {(product.sizes || []).map((s) => (
                        <button
                          key={s.size}
                          className="pos-size-btn"
                          onClick={() => addItem(product, s.size)}
                          disabled={s.stock <= 0}
                          title={s.stock <= 0 ? 'Out of stock' : `${s.stock} in stock`}
                        >
                          {s.size}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {searching && <div className="pos-search__dropdown"><div className="pos-search__loading">Searching...</div></div>}
          </div>

          {/* Quick catalog grid */}
          <div className="pos-catalog__header">
            <span className="pos-catalog__label">Quick Add</span>
            <span className="pos-catalog__count">{catalog.length} products</span>
          </div>

          {catalogLoading ? (
            <div className="pos-catalog__grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="pos-product-tile pos-product-tile--skeleton">
                  <div className="pos-product-tile__img skeleton" />
                  <div className="pos-product-tile__name skeleton" style={{ width: '80%', height: 12 }} />
                  <div className="pos-product-tile__price skeleton" style={{ width: '50%', height: 10 }} />
                </div>
              ))}
            </div>
          ) : (
            <div className="pos-catalog__grid">
              {catalog.map((product) => (
                <CatalogTile key={product.id} product={product} onAdd={addItem} />
              ))}
              {catalog.length === 0 && (
                <div className="pos-catalog__empty">No active products found.</div>
              )}
            </div>
          )}
        </div>

        {/* ─── RIGHT: Order Ticket (desktop) ─── */}
        <div className="pos-ticket">
          <OrderTicket
            items={items}
            itemCount={itemCount}
            subtotal={subtotal}
            total={total}
            discountAmount={discountAmount}
            appliedCode={appliedCode}
            discountCode={discountCode}
            discountError={discountError}
            validatingDiscount={validatingDiscount}
            paymentMethod={paymentMethod}
            cashReceived={cashReceived}
            changeAmount={changeAmount}
            customerEmail={customerEmail}
            completing={completing}
            onDiscountCodeChange={(v) => { setDiscountCode(v.toUpperCase()); setDiscountError(''); }}
            onValidateDiscount={validateDiscount}
            onRemoveDiscount={removeDiscount}
            onPaymentMethodChange={setPaymentMethod}
            onCashReceivedChange={setCashReceived}
            onCustomerEmailChange={setCustomerEmail}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeItem}
            onOverridePrice={setOverridePrice}
            onComplete={handleComplete}
          />
        </div>

        {/* ─── MOBILE: Sticky order bar + expandable panel ─── */}
        <div className={`pos-mobile-bar ${items.length > 0 ? 'pos-mobile-bar--visible' : ''}`}>
          <button
            className="pos-mobile-bar__toggle"
            onClick={() => setMobileOrderOpen(!mobileOrderOpen)}
          >
            <div className="pos-mobile-bar__left">
              {PosIcons.bag}
              <span className="pos-mobile-bar__count">{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
            </div>
            <div className="pos-mobile-bar__right">
              <span className="pos-mobile-bar__total">{formatPrice(total)}</span>
              {mobileOrderOpen ? PosIcons.chevDown : PosIcons.chevUp}
            </div>
          </button>
        </div>

        {/* Mobile order panel (slides up) */}
        {mobileOrderOpen && items.length > 0 && (
          <>
            <div className="pos-mobile-backdrop" onClick={() => setMobileOrderOpen(false)} />
            <div className="pos-mobile-panel">
              <div className="pos-mobile-panel__handle" />
              <OrderTicket
                items={items}
                itemCount={itemCount}
                subtotal={subtotal}
                total={total}
                discountAmount={discountAmount}
                appliedCode={appliedCode}
                discountCode={discountCode}
                discountError={discountError}
                validatingDiscount={validatingDiscount}
                paymentMethod={paymentMethod}
                cashReceived={cashReceived}
                changeAmount={changeAmount}
                customerEmail={customerEmail}
                completing={completing}
                onDiscountCodeChange={(v) => { setDiscountCode(v.toUpperCase()); setDiscountError(''); }}
                onValidateDiscount={validateDiscount}
                onRemoveDiscount={removeDiscount}
                onPaymentMethodChange={setPaymentMethod}
                onCashReceivedChange={setCashReceived}
                onCustomerEmailChange={setCustomerEmail}
                onUpdateQuantity={updateQuantity}
                onRemoveItem={removeItem}
                onOverridePrice={setOverridePrice}
                onComplete={handleComplete}
                onClose={() => setMobileOrderOpen(false)}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}


/* ═══ CATALOG TILE ═══ */

function CatalogTile({ product, onAdd }) {
  const [showSizes, setShowSizes] = useState(false);

  return (
    <div
      className={`pos-product-tile ${showSizes ? 'pos-product-tile--expanded' : ''}`}
      onClick={() => {
        // If product has only one size with stock, add directly
        const available = (product.sizes || []).filter((s) => s.stock > 0);
        if (available.length === 1) {
          onAdd(product, available[0].size);
        } else {
          setShowSizes(!showSizes);
        }
      }}
    >
      <div className="pos-product-tile__img-wrap">
        {product.images?.[0] ? (
          <img src={product.images[0]} alt="" className="pos-product-tile__img" loading="lazy" />
        ) : (
          <div className="pos-product-tile__img pos-product-tile__img--placeholder" />
        )}
        {product.badge && (
          <span className="pos-product-tile__badge">{product.badge}</span>
        )}
      </div>
      <span className="pos-product-tile__name">{product.name}</span>
      <span className="pos-product-tile__price">{formatPrice(product.price)}</span>

      {/* Size selector overlay */}
      {showSizes && (
        <div className="pos-product-tile__sizes" onClick={(e) => e.stopPropagation()}>
          <span className="pos-product-tile__sizes-label">Select size</span>
          <div className="pos-product-tile__sizes-row">
            {(product.sizes || []).map((s) => (
              <button
                key={s.size}
                className="pos-size-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onAdd(product, s.size);
                  setShowSizes(false);
                }}
                disabled={s.stock <= 0}
              >
                {s.size}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


/* ═══ ORDER TICKET (shared between desktop sidebar + mobile panel) ═══ */

function OrderTicket({
  items, itemCount, subtotal, total,
  discountAmount, appliedCode, discountCode, discountError, validatingDiscount,
  paymentMethod, cashReceived, changeAmount, customerEmail, completing,
  onDiscountCodeChange, onValidateDiscount, onRemoveDiscount,
  onPaymentMethodChange, onCashReceivedChange, onCustomerEmailChange,
  onUpdateQuantity, onRemoveItem, onOverridePrice,
  onComplete, onClose,
}) {
  return (
    <div className="pos-ticket__inner">
      {/* Header */}
      <div className="pos-ticket__header">
        <div className="pos-ticket__header-left">
          {PosIcons.receipt}
          <span className="pos-ticket__title">Order</span>
          {itemCount > 0 && <span className="pos-ticket__badge">{itemCount}</span>}
        </div>
        {onClose && (
          <button className="pos-ticket__close" onClick={onClose} aria-label="Close">×</button>
        )}
      </div>

      {/* Items */}
      <div className="pos-ticket__items">
        {items.length === 0 ? (
          <div className="pos-ticket__empty">
            <span className="pos-ticket__empty-icon">{PosIcons.bag}</span>
            <p>No items yet.</p>
            <p className="pos-ticket__empty-hint">Search or tap a product to add it.</p>
          </div>
        ) : (
          items.map((item, i) => (
            <div key={`${item.product.id}-${item.size}`} className="pos-ticket__item">
              <div className="pos-ticket__item-top">
                {item.product.images?.[0] && (
                  <img src={item.product.images[0]} alt="" className="pos-ticket__item-img" />
                )}
                <div className="pos-ticket__item-info">
                  <span className="pos-ticket__item-name">{item.product.name}</span>
                  <span className="pos-ticket__item-meta">Size {item.size}</span>
                </div>
                <button
                  className="pos-ticket__item-remove"
                  onClick={() => onRemoveItem(i)}
                  aria-label="Remove item"
                >
                  {PosIcons.trash}
                </button>
              </div>
              <div className="pos-ticket__item-bottom">
                <div className="pos-ticket__item-qty">
                  <button onClick={() => onUpdateQuantity(i, item.quantity - 1)} disabled={item.quantity <= 1}>
                    {PosIcons.minus}
                  </button>
                  <span>{item.quantity}</span>
                  <button onClick={() => onUpdateQuantity(i, item.quantity + 1)}>
                    {PosIcons.plus}
                  </button>
                </div>
                <div className="pos-ticket__item-pricing">
                  <span className="pos-ticket__item-total">
                    {formatPrice((item.overridePrice ?? item.price) * item.quantity)}
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="pos-ticket__item-override"
                    placeholder={formatNairaPlain(item.price)}
                    value={item.overridePrice !== null ? koboToNaira(item.overridePrice) : ''}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, '');
                      onOverridePrice(i, raw || '');
                    }}
                    title="Override price (₦)"
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Discount, payment, complete — only show when items exist */}
      {items.length > 0 && (
        <div className="pos-ticket__footer">
          {/* Discount */}
          <div className="pos-ticket__discount">
            {appliedCode ? (
              <div className="pos-ticket__discount-applied">
                <div className="pos-ticket__discount-left">
                  {PosIcons.tag}
                  <span className="pos-ticket__discount-code">{appliedCode}</span>
                </div>
                <span className="pos-ticket__discount-savings">-{formatPrice(discountAmount)}</span>
                <button className="pos-ticket__discount-remove" onClick={onRemoveDiscount}>×</button>
              </div>
            ) : (
              <div className="pos-ticket__discount-form">
                <input
                  type="text"
                  className="pos-ticket__discount-input"
                  value={discountCode}
                  onChange={(e) => onDiscountCodeChange(e.target.value)}
                  placeholder="Discount code"
                />
                <button
                  className="pos-ticket__discount-apply"
                  onClick={onValidateDiscount}
                  disabled={!discountCode.trim() || validatingDiscount}
                >
                  {validatingDiscount ? '...' : 'Apply'}
                </button>
              </div>
            )}
            {discountError && <span className="pos-ticket__discount-error">{discountError}</span>}
          </div>

          {/* Totals */}
          <div className="pos-ticket__totals">
            <div className="pos-ticket__totals-row">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="pos-ticket__totals-row pos-ticket__totals-row--discount">
                <span>Discount</span>
                <span>-{formatPrice(discountAmount)}</span>
              </div>
            )}
            <div className="pos-ticket__totals-row pos-ticket__totals-row--total">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>

          {/* Payment */}
          <div className="pos-ticket__payment">
            <div className="pos-ticket__payment-methods">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.value}
                  className={`pos-ticket__payment-btn ${paymentMethod === m.value ? 'pos-ticket__payment-btn--active' : ''}`}
                  onClick={() => onPaymentMethodChange(m.value)}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {paymentMethod === 'cash' && (
              <div className="pos-ticket__cash">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="pos-ticket__cash-input"
                  value={cashReceived}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, '');
                    onCashReceivedChange(raw);
                  }}
                  placeholder={`Cash received (${formatNairaPlain(total)})`}
                  min="0"
                />
                {cashReceived && changeAmount >= 0 && (
                  <div className="pos-ticket__change">
                    Change: {formatPrice(changeAmount)}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Customer email */}
          <input
            type="email"
            className="pos-ticket__email"
            value={customerEmail}
            onChange={(e) => onCustomerEmailChange(e.target.value)}
            placeholder="Customer email (optional)"
          />

          {/* Complete button */}
          <button
            className="pos-ticket__complete"
            onClick={onComplete}
            disabled={completing || items.length === 0}
          >
            {completing ? (
              <span className="pos-ticket__complete-loading">Processing...</span>
            ) : (
              <>
                <span>Complete Order</span>
                <span className="pos-ticket__complete-amount">{formatPrice(total)}</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
