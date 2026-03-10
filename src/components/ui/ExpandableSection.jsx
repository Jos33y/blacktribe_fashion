import { useState } from 'react';
import { ChevronDownIcon } from '../icons';
import '../../styles/ui/ExpandableSection.css';

export default function ExpandableSection({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`expandable ${open ? 'expandable--open' : ''}`}>
      <button
        className="expandable__trigger"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="expandable__title">{title}</span>
        <ChevronDownIcon size={18} className="expandable__icon" />
      </button>
      <div className="expandable__content" role="region" hidden={!open}>
        <div className="expandable__inner">
          {children}
        </div>
      </div>
    </div>
  );
}
