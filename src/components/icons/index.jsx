/* 
 * BLACKTRIBE FASHION — SVG ICONS
 * Stroke-based, 1.5px stroke, 24px viewbox, currentColor.
 * Never filled. Stroke only.
 */

const defaults = {
  xmlns: 'http://www.w3.org/2000/svg',
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export function SearchIcon({ size = 24, ...props }) {
  return (
    <svg {...defaults} width={size} height={size} {...props}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export function BagIcon({ size = 24, ...props }) {
  return (
    <svg {...defaults} width={size} height={size} {...props}>
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  );
}

export function MenuIcon({ size = 24, ...props }) {
  return (
    <svg {...defaults} width={size} height={size} {...props}>
      <line x1="4" y1="8" x2="20" y2="8" />
      <line x1="4" y1="16" x2="20" y2="16" />
    </svg>
  );
}

export function CloseIcon({ size = 24, ...props }) {
  return (
    <svg {...defaults} width={size} height={size} {...props}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function ChevronRightIcon({ size = 24, ...props }) {
  return (
    <svg {...defaults} width={size} height={size} {...props}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export function ChevronLeftIcon({ size = 24, ...props }) {
  return (
    <svg {...defaults} width={size} height={size} {...props}>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

export function ChevronDownIcon({ size = 24, ...props }) {
  return (
    <svg {...defaults} width={size} height={size} {...props}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function HeartIcon({ size = 24, ...props }) {
  return (
    <svg {...defaults} width={size} height={size} {...props}>
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  );
}

export function UserIcon({ size = 24, ...props }) {
  return (
    <svg {...defaults} width={size} height={size} {...props}>
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function FilterIcon({ size = 24, ...props }) {
  return (
    <svg {...defaults} width={size} height={size} {...props}>
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="6" y1="12" x2="18" y2="12" />
      <line x1="8" y1="18" x2="16" y2="18" />
    </svg>
  );
}

export function ShareIcon({ size = 24, ...props }) {
  return (
    <svg {...defaults} width={size} height={size} {...props}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

export function ArrowRightIcon({ size = 24, ...props }) {
  return (
    <svg {...defaults} width={size} height={size} {...props}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

export function MinusIcon({ size = 24, ...props }) {
  return (
    <svg {...defaults} width={size} height={size} {...props}>
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export function PlusIcon({ size = 24, ...props }) {
  return (
    <svg {...defaults} width={size} height={size} {...props}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export function TrashIcon({ size = 24, ...props }) {
  return (
    <svg {...defaults} width={size} height={size} {...props}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  );
}
