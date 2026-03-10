import { Link } from 'react-router';
import '../../styles/ui/Button.css';

/**
 * Button component.
 * variant: 'primary' (filled) | 'secondary' (outline) | 'link' (underlined)
 * size: 'default' | 'small' | 'large'
 * as: 'button' | 'a' | 'link' (react-router Link)
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'default',
  to,
  href,
  disabled = false,
  loading = false,
  fullWidth = false,
  className = '',
  ...props
}) {
  const classes = [
    'btn',
    `btn--${variant}`,
    `btn--${size}`,
    fullWidth && 'btn--full',
    loading && 'btn--loading',
    disabled && 'btn--disabled',
    className,
  ].filter(Boolean).join(' ');

  const content = (
    <>
      {loading && <span className="btn__spinner" aria-hidden="true" />}
      <span className={loading ? 'btn__text--hidden' : ''}>{children}</span>
    </>
  );

  // React Router link
  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {content}
      </Link>
    );
  }

  // External link
  if (href) {
    return (
      <a href={href} className={classes} target="_blank" rel="noopener noreferrer" {...props}>
        {content}
      </a>
    );
  }

  // Button
  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {content}
    </button>
  );
}
