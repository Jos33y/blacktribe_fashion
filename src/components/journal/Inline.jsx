/*
 * BLACKTRIBE JOURNAL — INLINE TEXT
 *
 * Article text supports three marks, nothing more:
 *   **bold**        strong
 *   *accent*        Cormorant italic, the brand's accent word
 *   [label](href)   link. Internal links (starting with /) stay in the app.
 */

import { Link } from 'react-router';

const TOKEN = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;

export default function Inline({ text }) {
  if (!text) return null;
  return String(text).split(TOKEN).map((part, i) => {
    if (!part) return null;
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <em key={i} className="jr-accent">{part.slice(1, -1)}</em>;
    }
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      const [, label, href] = link;
      return href.startsWith('/')
        ? <Link key={i} to={href} className="jr-link">{label}</Link>
        : <a key={i} href={href} className="jr-link" target="_blank" rel="noopener noreferrer">{label}</a>;
    }
    return part;
  });
}

/* Title with its accent word set in the serif */
export function AccentTitle({ title, accent }) {
  if (!accent || !title.includes(accent)) return title;
  const [before, ...rest] = title.split(accent);
  return (
    <>
      {before}
      <em className="jr-accent">{accent}</em>
      {rest.join(accent)}
    </>
  );
}
