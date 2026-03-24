import { useState } from 'react';

/**
 * DiscountInput — single-line code input.
 * Validates against POST /api/admin/validate-discount via parent's onApply.
 */
export default function DiscountInput({ onApply, onRemove, appliedCode, discountDisplay }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleApply = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setError('Enter a code.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const result = await onApply(trimmed);
      if (result?.error) {
        setError(result.error);
      } else {
        setCode('');
      }
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    onRemove();
    setCode('');
    setError('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleApply();
    }
  };

  if (appliedCode) {
    return (
      <div className="checkout-discount checkout-discount--applied">
        <div className="checkout-discount__info">
          <span className="checkout-discount__code">{appliedCode}</span>
          <span className="checkout-discount__savings">{discountDisplay}</span>
        </div>
        <button
          className="checkout-discount__remove"
          onClick={handleRemove}
          type="button"
        >
          Remove
        </button>
      </div>
    );
  }

  return (
    <div className="checkout-discount">
      <div className="checkout-discount__input-row">
        <input
          type="text"
          className={`checkout-discount__input ${error ? 'checkout-discount__input--error' : ''}`}
          value={code}
          onChange={(e) => { setCode(e.target.value); setError(''); }}
          onKeyDown={handleKeyDown}
          placeholder="Enter code"
          aria-label="Discount code"
          autoComplete="off"
        />
        <button
          className="checkout-discount__apply"
          onClick={handleApply}
          disabled={loading}
          type="button"
        >
          {loading ? '...' : 'Apply'}
        </button>
      </div>
      {error && (
        <p className="checkout-discount__error" role="alert">{error}</p>
      )}
    </div>
  );
}
