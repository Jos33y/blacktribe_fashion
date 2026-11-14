/*
 * BLACKTRIBE FASHION — ACCENT TEXT
 *
 * Headlines support one or more *accent* words:
 *   "Redefining *luxury* since 2017"
 * The starred words render in Cormorant Garamond italic (.ed-accent),
 * the black-and-white brand's answer to a coloured highlight word.
 */

export default function Accent({ text }) {
  if (!text) return null;
  const parts = text.split(/(\*[^*]+\*)/g);
  return parts.map((part, i) => (
    part.length > 2 && part.startsWith('*') && part.endsWith('*')
      ? <em key={i} className="ed-accent">{part.slice(1, -1)}</em>
      : part
  ));
}
