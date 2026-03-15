import '../../styles/ui/Select.css';

export default function Select({
  label,
  options = [],
  value,
  onChange,
  placeholder = 'Select',
  error,
  id,
  name,
  disabled = false,
  className = '',
  ...props
}) {
  const selectId = id || name || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={`select-group ${error ? 'select-group--error' : ''} ${className}`}>
      {label && (
        <label className="select-label" htmlFor={selectId}>
          {label}
        </label>
      )}
      <div className="select-wrapper">
        <select
          id={selectId}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className="select-field"
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${selectId}-error` : undefined}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => {
            const optValue = typeof opt === 'string' ? opt : opt.value;
            const optLabel = typeof opt === 'string' ? opt : opt.label;
            return (
              <option key={optValue} value={optValue}>
                {optLabel}
              </option>
            );
          })}
        </select>
        <svg
          className="select-chevron"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
      {error && (
        <p className="select-error" id={`${selectId}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
