/*
 * BLACKTRIBE FASHION — EDITORIAL PAGE TEMPLATES
 *
 * Single source of truth for page templates. Used by:
 *   - EditorialPage (renderer: web, print, admin preview)
 *   - AdminEditorialEdit (builds the form for each page)
 *
 * Field types: text | textarea | lines | image | side | fit | choice | products
 * accent: true  → field supports *word* for a Cormorant italic accent
 * Keep keys in sync with FIELD_LIMITS in server/routes/admin/editorial.js
 *
 * Page shape: { id, template, tone, contact, fields }
 *   contact: true → contact strip (site, email, Instagram + QR) at the bottom.
 *   The brand template always shows it.
 */

/* Contact details printed in the contact strip. Brand constants. */
export const CONTACT = {
  site: 'blacktribefashion.com',
  siteUrl: 'https://blacktribefashion.com',
  email: 'support@blacktribefashion.com',
  instagram: '@blacktribe_fashion',
};

export const TEMPLATES = {
  brand: {
    label: 'Brand page',
    hint: 'Introduces BlackTribe to someone who has never heard of it. Logo, promise, photo, reasons, and how to reach you.',
    tone: true,
    contactAlways: true,
    fields: [
      { key: 'mantra', type: 'text', label: 'Mantra line', placeholder: 'Designed in Lagos. Worn worldwide.', max: 120 },
      { key: 'image', type: 'image', label: 'Hero photo (landscape works best)' },
      { key: 'fit', type: 'fit', label: 'Photo style' },
      { key: 'heading', type: 'text', label: 'Headline', placeholder: 'Redefining *luxury* since 2017', max: 120, accent: true },
      { key: 'intro', type: 'textarea', label: 'Intro', placeholder: 'Two or three lines about the brand.', max: 600, rows: 3 },
      { key: 'points', type: 'lines', label: 'Why BlackTribe (one per line, up to 5)', placeholder: 'Made in Lagos since 2017\nLimited drops, never restocked\nWorldwide shipping', max: 600, rows: 5 },
      { key: 'cta', type: 'text', label: 'Call to action', placeholder: 'Shop the new drop', max: 120, accent: true },
    ],
  },

  cover: {
    label: 'Cover',
    hint: 'The masthead over one image. Product shots sit on the soft grey canvas; campaign photos fill the page.',
    tone: false,
    fields: [
      { key: 'image', type: 'image', label: 'Cover image' },
      { key: 'fit', type: 'fit', label: 'Photo style' },
      { key: 'cutout', type: 'image', label: 'Cut-out of the subject, PNG with a clear background (optional: puts their head in front of the masthead)' },
      { key: 'mast', type: 'choice', label: 'Masthead position', options: [{ value: '', label: 'Top of the page' }, { value: 'upper', label: 'Slightly lower (head near the top of the photo)' }, { value: 'middle', label: 'Lower (head further down the photo)' }] },
      { key: 'treatment', type: 'choice', label: 'Photo finish', options: [{ value: '', label: 'Natural' }, { value: 'mono', label: 'Black and white, rich contrast' }, { value: 'night', label: 'Night: deep blacks, colour lifted' }, { value: 'grain', label: 'Film grain' }, { value: 'mono-grain', label: 'Black and white with film grain' }] },
      { key: 'focus', type: 'choice', label: 'Keep in frame', options: [{ value: '', label: 'Centre' }, { value: 'left', label: 'Left side' }, { value: 'right', label: 'Right side' }, { value: 'top', label: 'Top' }] },
      { key: 'kicker', type: 'text', label: 'Kicker', placeholder: 'Issue 01', max: 60 },
      { key: 'title', type: 'text', label: 'Headline', placeholder: 'The *Crystal* Drop', max: 120, accent: true },
      { key: 'dek', type: 'textarea', label: 'Subtitle', placeholder: 'One or two lines under the headline.', max: 300, rows: 2 },
      { key: 'lines', type: 'lines', label: 'Cover lines, one per line (up to 4): what is inside', placeholder: 'Alkebulan: the new drop\nOne tribe, many flags', max: 300, rows: 4 },
    ],
  },

  image: {
    label: 'Full-bleed image',
    hint: 'One photo. Product shots sit centred on the canvas; campaign photos run edge to edge.',
    tone: false,
    fields: [
      { key: 'image', type: 'image', label: 'Image' },
      { key: 'fit', type: 'fit', label: 'Photo style' },
      { key: 'treatment', type: 'choice', label: 'Photo finish', options: [{ value: '', label: 'Natural' }, { value: 'mono', label: 'Black and white, rich contrast' }, { value: 'night', label: 'Night: deep blacks, colour lifted' }, { value: 'grain', label: 'Film grain' }, { value: 'mono-grain', label: 'Black and white with film grain' }] },
      { key: 'focus', type: 'choice', label: 'Keep in frame', options: [{ value: '', label: 'Centre' }, { value: 'left', label: 'Left side' }, { value: 'right', label: 'Right side' }, { value: 'top', label: 'Top' }] },
      { key: 'headline', type: 'text', label: 'Headline over the photo (optional)', placeholder: 'One mask. *Many faces.*', max: 120, accent: true },
      { key: 'ink', type: 'choice', label: 'Text on the photo', options: [{ value: '', label: 'Light text (dark photos)' }, { value: 'dark', label: 'Dark text (light photos)' }] },
      { key: 'marks', type: 'choice', label: 'Print marks', options: [{ value: '', label: 'None' }, { value: 'marks', label: 'Crop marks and figure number, like a proof' }] },
      { key: 'caption', type: 'textarea', label: 'Caption', placeholder: 'Crystal Trucker Jacket, worn in Lekki.', max: 300, rows: 2 },
      { key: 'credit', type: 'text', label: 'Photo credit', placeholder: 'Photography by ...', max: 120 },
    ],
  },

  split: {
    label: 'Split',
    hint: 'Image on one half, story on the other.',
    tone: true,
    fields: [
      { key: 'image', type: 'image', label: 'Image' },
      { key: 'fit', type: 'fit', label: 'Photo style' },
      { key: 'treatment', type: 'choice', label: 'Photo finish', options: [{ value: '', label: 'Natural' }, { value: 'mono', label: 'Black and white, rich contrast' }, { value: 'night', label: 'Night: deep blacks, colour lifted' }, { value: 'grain', label: 'Film grain' }, { value: 'mono-grain', label: 'Black and white with film grain' }] },
      { key: 'focus', type: 'choice', label: 'Keep in frame', options: [{ value: '', label: 'Centre' }, { value: 'left', label: 'Left side' }, { value: 'right', label: 'Right side' }, { value: 'top', label: 'Top' }] },
      { key: 'side', type: 'side', label: 'Image side' },
      { key: 'kicker', type: 'text', label: 'Kicker', placeholder: 'The Process', max: 60 },
      { key: 'heading', type: 'text', label: 'Heading', placeholder: 'Made in *Lagos*', max: 120, accent: true },
      { key: 'body', type: 'textarea', label: 'Text', placeholder: 'Leave a blank line between paragraphs.', max: 6000, rows: 8 },
    ],
  },

  products: {
    label: 'Product spread',
    hint: 'Two to four pieces. Names and prices come from the shop and stay current.',
    tone: true,
    fields: [
      { key: 'heading', type: 'text', label: 'Heading', placeholder: 'The *Pieces*', max: 120, accent: true },
      { key: 'intro', type: 'textarea', label: 'Intro', placeholder: 'A short line about this edit.', max: 600, rows: 3 },
      { key: 'products', type: 'products', label: 'Pieces', max: 4 },
    ],
  },

  statement: {
    label: 'Statement',
    hint: 'One big quote. Short lines work best.',
    tone: true,
    fields: [
      { key: 'art', type: 'choice', label: 'Artwork', options: [{ value: '', label: 'None' }, { value: 'mask', label: 'Line-drawn mask above the quote' }] },
      { key: 'quote', type: 'textarea', label: 'Quote', placeholder: 'Not just clothing. A statement.', max: 400, rows: 3 },
      { key: 'attribution', type: 'text', label: 'Attribution', placeholder: 'Redefining Luxury Since 2017', max: 120 },
    ],
  },

  world: {
    label: 'World',
    hint: 'Where the tribe is: a photo, a few lines, and a departures board with flags.',
    tone: true,
    fields: [
      { key: 'image', type: 'image', label: 'Photo' },
      { key: 'fit', type: 'fit', label: 'Photo style' },
      { key: 'treatment', type: 'choice', label: 'Photo finish', options: [{ value: '', label: 'Natural' }, { value: 'mono', label: 'Black and white, rich contrast' }, { value: 'night', label: 'Night: deep blacks, colour lifted' }, { value: 'grain', label: 'Film grain' }, { value: 'mono-grain', label: 'Black and white with film grain' }] },
      { key: 'focus', type: 'choice', label: 'Keep in frame', options: [{ value: '', label: 'Centre' }, { value: 'left', label: 'Left side' }, { value: 'right', label: 'Right side' }, { value: 'top', label: 'Top' }] },
      { key: 'kicker', type: 'text', label: 'Kicker', placeholder: 'Worldwide', max: 60 },
      { key: 'heading', type: 'text', label: 'Heading', placeholder: 'One tribe, many *flags*', max: 120, accent: true },
      { key: 'intro', type: 'textarea', label: 'Intro', max: 600, rows: 3 },
      { key: 'places', type: 'lines', label: 'Places, one per line as "Name | country code" (first line is home). Flags: NG PT DE GB TR FR US GH ZA, and WW for a globe', placeholder: 'Lagos | NG\nPortugal | PT\nWorldwide | WW', max: 600, rows: 8 },
    ],
  },

  opener: {
    label: 'Section opener',
    hint: 'Opens a section: the mask, huge and cropped, with the section title.',
    tone: true,
    fields: [
      { key: 'kicker', type: 'text', label: 'Kicker', placeholder: 'Section 02', max: 60 },
      { key: 'title', type: 'text', label: 'Title', placeholder: 'After *dark*', max: 120, accent: true },
      { key: 'dek', type: 'textarea', label: 'Line under the title', max: 300, rows: 2 },
    ],
  },

  story: {
    label: 'Story',
    hint: 'Long text in two columns, with an optional image at the top. Ends with the small mask.',
    tone: true,
    fields: [
      { key: 'border', type: 'choice', label: 'Border', options: [{ value: '', label: 'None' }, { value: 'triangles', label: 'Mask pattern band across the top' }] },
      { key: 'kicker', type: 'text', label: 'Kicker', placeholder: 'Feature', max: 60 },
      { key: 'heading', type: 'text', label: 'Heading', placeholder: 'From warehouse parties to the *runway*', max: 120, accent: true },
      { key: 'image', type: 'image', label: 'Image (optional)' },
      { key: 'fit', type: 'fit', label: 'Photo style' },
      { key: 'treatment', type: 'choice', label: 'Photo finish', options: [{ value: '', label: 'Natural' }, { value: 'mono', label: 'Black and white, rich contrast' }, { value: 'night', label: 'Night: deep blacks, colour lifted' }, { value: 'grain', label: 'Film grain' }, { value: 'mono-grain', label: 'Black and white with film grain' }] },

      { key: 'body', type: 'textarea', label: 'Text', placeholder: 'Leave a blank line between paragraphs.', max: 6000, rows: 12 },
    ],
  },
};

export const TEMPLATE_KEYS = Object.keys(TEMPLATES);

export const TONES = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
];

export const MAX_PAGES = 24;

function makeId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `p-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

export function newPage(template) {
  return {
    id: makeId(),
    template,
    tone: 'dark',
    contact: template === 'brand',
    fields: template === 'products' ? { products: [] }
      : template === 'split' ? { side: 'left', fit: 'canvas' }
      : ['cover', 'image', 'story', 'brand', 'world'].includes(template) ? { fit: 'canvas' }
      : {},
  };
}

/* Remove *accent* markers, for titles, meta tags and plain text */
export function plainText(text) {
  return (text || '').replace(/\*([^*]+)\*/g, '$1');
}

/* "One per line" fields → array of non-empty lines */
export function lines(text, max = 5) {
  return (text || '').split('\n').map((l) => l.trim()).filter(Boolean).slice(0, max);
}

/* Kobo integer → "₦185,000" */
export function formatNaira(kobo) {
  if (typeof kobo !== 'number') return '';
  return `₦${Math.round(kobo / 100).toLocaleString('en-NG')}`;
}

/* Split body text into paragraphs on blank lines */
export function paragraphs(text) {
  if (!text) return [];
  return text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
}
