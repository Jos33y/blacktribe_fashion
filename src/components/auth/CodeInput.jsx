import { useRef, useState, useEffect } from 'react';

/**
 * CodeInput — 6-digit OTP input.
 * Auto-advances on digit entry. Backspace returns to previous.
 * Paste support: pasting "123456" fills all fields.
 * Calls onChange(code) with the current string on every change.
 * Calls onComplete(code) when all 6 digits are filled.
 */
export default function CodeInput({ onChange, onComplete, disabled = false, error = false }) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);

  useEffect(() => {
    // Auto-focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  const updateDigits = (newDigits) => {
    setDigits(newDigits);
    const code = newDigits.join('');
    onChange?.(code);
    if (code.length === 6 && newDigits.every((d) => d !== '')) {
      onComplete?.(code);
    }
  };

  const handleChange = (index, value) => {
    // Only allow single digit
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    updateDigits(next);

    // Auto-advance to next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Backspace: clear current or go back
    if (e.key === 'Backspace') {
      if (digits[index]) {
        const next = [...digits];
        next[index] = '';
        updateDigits(next);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
        const next = [...digits];
        next[index - 1] = '';
        updateDigits(next);
      }
      e.preventDefault();
    }

    // Arrow keys
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
      e.preventDefault();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
      e.preventDefault();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const next = [...digits];
    for (let i = 0; i < 6; i++) {
      next[i] = pasted[i] || '';
    }
    updateDigits(next);

    // Focus the next empty field, or the last field
    const nextEmpty = next.findIndex((d) => d === '');
    inputRefs.current[nextEmpty >= 0 ? nextEmpty : 5]?.focus();
  };

  const handleFocus = (e) => {
    e.target.select();
  };

  return (
    <div className="code-input" role="group" aria-label="Verification code">
      <div className="code-input__fields">
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => (inputRefs.current[i] = el)}
            type="text"
            inputMode="numeric"
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={i === 0 ? handlePaste : undefined}
            onFocus={handleFocus}
            disabled={disabled}
            className={`code-input__digit ${error ? 'code-input__digit--error' : ''}`}
            aria-label={`Digit ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
