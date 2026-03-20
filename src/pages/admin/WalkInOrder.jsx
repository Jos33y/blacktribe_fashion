/*
 * BLACKTRIBE FASHION — WALK-IN ORDER (POS MODE)
 *
 * Fast order creation for in-store purchases.
 * Flow: search products → add to order → payment method → complete → receipt.
 *
 * Supports: discount codes, manual price override, cash/POS/transfer.
 * Stock deducted on completion. Order type = 'walk_in'.
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { useToast } from '../../components/ui/Toast';
import useAuthStore from '../../store/authStore';
import '../../styles/admin/admin-walkin.css';

/* ═══ HELPERS ═══ */

function formatPrice(kobo) {
  if (!kobo && kobo !== 0) return '₦0';
  return '₦' + Math.floor(kobo / 100).toLocaleString('en-NG');
}

function koboToNaira(kobo) {
  return Math.floor(kobo / 100);
}

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'pos_terminal', label: 'POS Terminal' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
];

/* ═══ COMPONENT ═══ */

export default function WalkInOrder() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const searchRef = useRef(null);

  /* ─── State ─── */
  const [step, setStep] = useState('build'); // 'build' | 'payment' | 'receipt'
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [items, setItems] = useState([]); // { product, size, quantity, price (kobo), overridePrice }
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

  useEffect(() => {
    document.title = 'New Walk-in Order. BlackTribe Admin.';
    searchRef.current?.focus();
  }, []);

  async function getToken() {
    return useAuthStore.getState().getAccessToken();
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

  /* ─── Add item ─── */
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
    searchRef.current?.focus();
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

    setCompleting(true);
    try {
      const token = await getToken();
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
      addToast('Something went wrong.', 'error');
    } finally {
      setCompleting(false);
    }
  }

  /* ─── Print receipt ─── */
  function handlePrint() {
    window.print();
  }

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
    setStep('build');
    searchRef.current?.focus();
  }

  /* ═══ RECEIPT VIEW ═══ */
  if (step === 'receipt' && completedOrder) {
    return (
      <div className="admin-page walkin">
        <div className="walkin-receipt" id="walkin-receipt">
          <div className="walkin-receipt__header">
            <span className="walkin-receipt__brand">BLACKTRIBE</span>
            <span className="walkin-receipt__sub">FASHION</span>
          </div>

          <div className="walkin-receipt__divider" />

          <div className="walkin-receipt__meta">
            <span>Order: {completedOrder.order_number}</span>
            <span>{new Date(completedOrder.created_at).toLocaleString('en-GB', {
              day: 'numeric', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}</span>
          </div>

          <div className="walkin-receipt__divider" />

          <div className="walkin-receipt__items">
            {(completedOrder.items || items).map((item, i) => (
              <div key={i} className="walkin-receipt__item">
                <div className="walkin-receipt__item-info">
                  <span>{item.name}</span>
                  <span className="walkin-receipt__item-size">
                    Size {item.size} x{item.quantity}
                  </span>
                </div>
                <span>{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="walkin-receipt__divider" />

          <div className="walkin-receipt__totals">
            <div className="walkin-receipt__total-row">
              <span>Subtotal</span>
              <span>{formatPrice(completedOrder.subtotal)}</span>
            </div>
            {completedOrder.discount_amount > 0 && (
              <div className="walkin-receipt__total-row">
                <span>Discount</span>
                <span>-{formatPrice(completedOrder.discount_amount)}</span>
              </div>
            )}
            <div className="walkin-receipt__total-row walkin-receipt__total-row--final">
              <span>Total</span>
              <span>{formatPrice(completedOrder.total)}</span>
            </div>
            <div className="walkin-receipt__total-row">
              <span>Payment</span>
              <span style={{ textTransform: 'capitalize' }}>
                {completedOrder.payment_method?.replace('_', ' ')}
              </span>
            </div>
          </div>

          <div className="walkin-receipt__divider" />

          <div className="walkin-receipt__footer">
            <p>Thank you for shopping with BlackTribe.</p>
            <p className="walkin-receipt__url">blacktribefashion.com</p>
          </div>
        </div>

        {/* Actions (hidden when printing) */}
        <div className="walkin-receipt-actions">
          <Button variant="secondary" onClick={handlePrint}>
            Print Receipt
          </Button>
          <Button variant="primary" onClick={handleNewOrder}>
            New Order
          </Button>
        </div>
      </div>
    );
  }

  /* ═══ PAYMENT VIEW ═══ */
  if (step === 'payment') {
    return (
      <div className="admin-page walkin">
        <div className="walkin-payment">
          <h2 className="walkin-payment__title">Complete Payment</h2>

          {/* Order summary */}
          <div className="admin-card walkin-payment__summary">
            <div className="walkin-payment__items">
              {items.map((item, i) => (
                <div key={i} className="walkin-payment__item">
                  <span>{item.product.name} ({item.size}) x{item.quantity}</span>
                  <span className="walkin-payment__item-price">
                    {formatPrice((item.overridePrice ?? item.price) * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className="walkin-payment__total">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>

          {/* Payment method */}
          <div className="admin-card">
            <Select
              label="Payment Method"
              options={PAYMENT_METHODS}
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              placeholder={null}
            />

            {paymentMethod === 'cash' && (
              <div style={{ marginTop: 16 }}>
                <Input
                  label="Cash Received (₦)"
                  type="number"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  placeholder={String(koboToNaira(total))}
                  min="0"
                />
                {cashReceived && changeAmount >= 0 && (
                  <div className="walkin-payment__change">
                    Change: {formatPrice(changeAmount)}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Customer email (optional) */}
          <div className="admin-card">
            <Input
              label="Customer Email (optional)"
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="For receipt and order linking"
            />
          </div>

          {/* Actions */}
          <div className="walkin-payment__actions">
            <Button variant="secondary" onClick={() => setStep('build')}>
              Back
            </Button>
            <Button variant="primary" onClick={handleComplete} loading={completing}>
              Complete Order — {formatPrice(total)}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  /* ═══ BUILD ORDER VIEW ═══ */
  return (
    <div className="admin-page walkin">
      <div className="walkin-build">

        {/* Search */}
        <div className="walkin-search">
          <Input
            ref={searchRef}
            label="Search Products"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type product name..."
          />

          {/* Search results dropdown */}
          {searchResults.length > 0 && (
            <div className="walkin-search__results">
              {searchResults.map((product) => (
                <div key={product.id} className="walkin-search__product">
                  <div className="walkin-search__product-info">
                    {product.images?.[0] && (
                      <img src={product.images[0]} alt="" className="walkin-search__thumb" />
                    )}
                    <div>
                      <span className="walkin-search__name">{product.name}</span>
                      <span className="walkin-search__price">{formatPrice(product.price)}</span>
                    </div>
                  </div>
                  <div className="walkin-search__sizes">
                    {(product.sizes || []).map((s) => (
                      <button
                        key={s.size}
                        className="walkin-search__size-btn"
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

          {searching && (
            <div className="walkin-search__loading">Searching...</div>
          )}
        </div>

        {/* Order items */}
        <div className="walkin-items">
          {items.length === 0 ? (
            <div className="walkin-items__empty">
              <p>Search and add products above.</p>
            </div>
          ) : (
            <>
              {items.map((item, i) => (
                <div key={`${item.product.id}-${item.size}`} className="walkin-item">
                  <div className="walkin-item__info">
                    {item.product.images?.[0] && (
                      <img src={item.product.images[0]} alt="" className="walkin-item__thumb" />
                    )}
                    <div className="walkin-item__details">
                      <span className="walkin-item__name">{item.product.name}</span>
                      <span className="walkin-item__size">Size {item.size}</span>
                    </div>
                  </div>
                  <div className="walkin-item__controls">
                    <div className="walkin-item__qty">
                      <button onClick={() => updateQuantity(i, item.quantity - 1)} disabled={item.quantity <= 1}>−</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(i, item.quantity + 1)}>+</button>
                    </div>
                    <div className="walkin-item__price-col">
                      <span className="walkin-item__price">
                        {formatPrice((item.overridePrice ?? item.price) * item.quantity)}
                      </span>
                      <input
                        type="number"
                        className="walkin-item__override"
                        placeholder={`₦${koboToNaira(item.price)}`}
                        value={item.overridePrice !== null ? koboToNaira(item.overridePrice) : ''}
                        onChange={(e) => setOverridePrice(i, e.target.value)}
                        title="Override price (₦)"
                      />
                    </div>
                    <button className="walkin-item__remove" onClick={() => removeItem(i)} aria-label="Remove">
                      ×
                    </button>
                  </div>
                </div>
              ))}

              {/* Discount */}
              <div className="walkin-discount">
                {appliedCode ? (
                  <div className="walkin-discount__applied">
                    <span className="walkin-discount__code">{appliedCode}</span>
                    <span className="walkin-discount__savings">-{formatPrice(discountAmount)}</span>
                    <button className="walkin-discount__remove" onClick={removeDiscount} type="button">Remove</button>
                  </div>
                ) : (
                  <div className="walkin-discount__form">
                    <Input
                      label="Discount Code"
                      value={discountCode}
                      onChange={(e) => { setDiscountCode(e.target.value.toUpperCase()); setDiscountError(''); }}
                      placeholder="Enter code"
                      error={discountError}
                    />
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={validateDiscount}
                      loading={validatingDiscount}
                      disabled={!discountCode.trim()}
                      style={{ marginTop: 8 }}
                    >
                      Apply
                    </Button>
                  </div>
                )}
              </div>

              {/* Subtotal */}
              <div className="walkin-subtotal">
                <div className="walkin-subtotal__row">
                  <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="walkin-subtotal__row">
                    <span>Discount</span>
                    <span style={{ color: 'var(--bt-success)' }}>-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="walkin-subtotal__row walkin-subtotal__row--total">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              {/* Proceed to payment */}
              <Button variant="primary" fullWidth onClick={() => setStep('payment')}>
                Proceed to Payment — {formatPrice(total)}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
