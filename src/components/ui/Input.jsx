import '../../styles/ui/Input.css';

/**
 * Input component.
 * Visible label above. Error state. Supports text, email, tel, password.
 */
export default function Input({
  label,
  id,
  type = 'text',
  error,
  required = false,
  className = '',
  ...props
}) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={`input-group ${error ? 'input-group--error' : ''} ${className}`}>
      {label && (
        <label htmlFor={inputId} className="input-group__label">
          {label}
          {required && <span className="input-group__required"> (required)</span>}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        className="input-group__input"
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="input-group__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
