import { ed } from './media.js';

export default {
  slug: 'what-to-wear-detty-december-lagos',
  status: 'published',
  kicker: 'Style guide',
  title: 'What to wear for Detty December in Lagos',
  accent: 'Detty December',
  seoTitle: 'What to Wear for Detty December in Lagos (2026 Outfit Guide)',
  description: 'Detty December outfits for every Lagos plan: festivals, concerts, beach parties, owambe and church. Unisex looks, what to skip, and the 2026 dates.',
  dek: 'Seven plans, seven looks. Dressed for the heat, the harmattan, the traffic and the six-hour standing set.',
  published: '2026-11-26',
  updated: '2026-11-26',
  author: 'BlackTribe Journal',
  readMins: 7,
  hero: {
    src: ed('issue-02/bag-dreads.jpg'),
    alt: 'A BlackTribe Lifestyle night in Lagos: the crowd packed in, one guest holding up a black BlackTribe bag',
    caption: 'BlackTribe Lifestyle, Lagos.',
    focus: '50% 40%',
  },
  summary: [
    'Detty December is Lagos at full volume: concerts, beach parties, owambe, day parties and homecomings, from mid-December to New Year.',
    'It is hot, not cold. Dress light, breathable and loose, and plan for harmattan dust and long hours on your feet.',
    'Match the outfit to the venue: open-air festival, air-conditioned arena, sand, aso-ebi, or a late club on the Island.',
    'For 2026, Detty December Fest runs 18 to 30 December at Ilubirin, with Wizkid on opening night.',
  ],
  blocks: [
    { type: 'lede', text: 'December in Lagos is not a month. It is a marathon. Flights land full, shortlets fill up, the group chat turns into a planning committee, and every night has a *plan*. The question is not whether you are going out. It is what you are wearing to all of it.' },
    { type: 'p', text: 'This guide is built for how December actually runs here. Some nights you stand for six hours at an open-air festival. Some nights you are in an air-conditioned hall that feels like Jos. Some afternoons end with sand in your shoes. Every look below is unisex, works in the heat, and survives the traffic.' },

    { type: 'h2', id: 'the-rules', text: 'Three Lagos rules before you pack' },
    { type: 'rules', items: [
      ['It is hot.', 'December here sits in the low 30s °C. Choose cotton, denim and loose cuts. Save the heavy layers for the AC.'],
      ['Harmattan is real.', 'The haze brings dust. White sneakers will not stay white. Pick shoes you can wipe, and carry a small cloth.'],
      ['You will walk.', 'Traffic means you get dropped far from the gate and walk the rest. Comfort first, then shine.'],
    ] },

    { type: 'h2', id: 'the-looks', text: 'The looks, plan by plan' },

    { type: 'look', n: '01', name: 'The festival night', for: 'Detty December Fest, open-air stages, long sets', image: { src: ed('issue-02/under-the-moon.jpg'), alt: 'A guest in a white tee holds a black BlackTribe bag under the night sky at an outdoor event', focus: '50% 35%' },
      wear: ['A short-sleeve shirt or polo with room to breathe', 'Wide or barrel-leg pants that do not cling in the heat', 'A cap for the walk in and the lights', 'A crossbody bag that stays in front of you', 'Sneakers you have already broken in'],
      avoid: ['Brand-new shoes', 'Anything you cannot stand in for six hours'],
      tip: 'Phone, power bank, card. If it does not fit the crossbody, it stays home.',
      products: ['washed-denim-polo', 'barrel-pants', 'script-cap'] },

    { type: 'look', n: '02', name: 'The arena concert', for: 'Indoor shows at Eko Convention Centre and similar halls', image: { src: ed('issue-02/the-sound.jpg'), alt: 'A DJ at the decks with the crowd close around him at a BlackTribe Lifestyle event', focus: '50% 40%' },
      wear: ['A tee as your base layer', 'One statement jacket for the cold hall and the photos', 'Dark denim or tailored pants', 'Clean sneakers or loafers'],
      avoid: ['Heavy knits on the walk in', 'A jacket you cannot tie or carry'],
      tip: 'Outside is hot, inside is cold. The jacket goes on at the door and comes off in the car.',
      collection: 'alkebulan' },

    { type: 'quote', text: 'Dress for the venue, not the flyer. The flyer does not know about the AC.' },

    { type: 'look', n: '03', name: 'The beach party', for: 'Elegushi, Landmark and the beach raves along Lekki', image: { src: ed('issue-02/off-duty-wagon.jpg'), alt: 'Daniel Blaq in a black tee, light denim shorts and sneakers beside a silver G-Wagon in daylight', focus: '50% 30%' },
      wear: ['An open short-sleeve shirt over a vest or tee', 'Shorts in denim or cotton', 'Slides or sandals you can rinse', 'Sunglasses that can handle a sea breeze'],
      avoid: ['Suede and white canvas', 'Long hems that drag in wet sand'],
      tip: 'Bring a second tee. Sea air, sweat and smoke all meet on the beach.' },

    { type: 'look', n: '04', name: 'The owambe', for: 'Weddings, birthdays and December parties with aso-ebi', image: { src: ed('issue-02/tribe-green.jpg'), alt: 'Guests at a busy BlackTribe Lifestyle party, one in a white tee with a crossbody strap', focus: '50% 40%' },
      wear: ['The aso-ebi, if the family has picked one. That is the rule', 'For the after-party, change into a clean shirt and tailored pants', 'One accessory that carries your style: a cap, a chain, a bag'],
      avoid: ['Turning up in streetwear when the invite says traditional', 'Upstaging the celebrant'],
      tip: 'Pack the after-party fit in the car. The reception ends. The night does not.' },

    { type: 'look', n: '05', name: 'The day party', for: 'Brunch, pool parties and rooftop afternoons', image: { src: ed('issue-02/off-duty-lounge.jpg'), alt: 'Daniel Blaq relaxed in a lounge chair in a black tee, denim shorts and white socks', focus: '50% 35%' },
      wear: ['A light graphic tee', 'Shorts or relaxed pants', 'A bucket hat or cap', 'Clean socks and sneakers, or slides'],
      avoid: ['Dark heavy fabrics in the afternoon sun'],
      tip: 'Daytime is for colour and print. Night is for black and shine.' },

    { type: 'look', n: '06', name: 'The late club night', for: 'Island lounges and after-parties past 2am', image: { src: ed('issue-01/neon-mask-tee.jpg'), alt: 'A guest in a black BlackTribe tee with a colourful mask print, standing in front of neon signs', focus: '50% 30%' },
      wear: ['All black, or black with one bright piece', 'Something with shine: crystals, sequins, a metal detail', 'Fitted or straight pants', 'Shoes that look good under low light'],
      avoid: ['Pale colours that pick up every stain'],
      tip: 'This is the night for the statement piece. The light is low. Let the detail catch it.' },

    { type: 'look', n: '07', name: 'Church and family Christmas', for: 'Carol services, Christmas Day, the family lunch', image: { src: ed('issue-02/daniel-profile.jpg'), alt: 'Portrait of Daniel Blaq in a black hooded jacket against a grey backdrop', focus: '50% 30%' },
      wear: ['A clean button-up or a quiet tee under a jacket', 'Tailored pants', 'Polished shoes or clean sneakers'],
      avoid: ['Loud graphics at the 7am service', 'Anything Grandma will comment on'],
      tip: 'Still you, at a lower volume.' },

    { type: 'h2', id: 'cheat-sheet', text: 'Cheat sheet: what to wear where' },
    { type: 'table', head: ['Plan', 'Wear', 'Skip'], rows: [
      ['Festival night', 'Polo, wide pants, cap, crossbody', 'New shoes'],
      ['Arena concert', 'Tee plus statement jacket', 'Heavy knits'],
      ['Beach party', 'Open shirt, shorts, slides', 'Suede, white canvas'],
      ['Owambe', 'The aso-ebi, then a clean change', 'Streetwear at the ceremony'],
      ['Day party', 'Graphic tee, shorts, bucket hat', 'Dark heavy fabric'],
      ['Late club', 'Black with shine', 'Pale colours'],
      ['Church', 'Button-up, tailored pants', 'Loud graphics'],
    ] },

    { type: 'h2', id: 'calendar', text: 'The 2026 calendar, so you can plan the fits' },
    { type: 'p', text: 'Dates below were announced by organisers and reported in the press as of late November 2026. Line-ups move, so confirm with the organiser before you buy.' },
    { type: 'timeline', items: [
      ['13 Dec', 'ÀLÓ: Once Upon a Song, Shell Hall, MUSON Centre, Onikan'],
      ['18 to 30 Dec', 'Detty December Fest, Ilubirin. Wizkid opens on 18 December'],
      ['19 to 23 Dec', 'ICONIQ Fest, Lekki'],
      ['21 Dec', 'Coca-Cola Rhythm Unplugged, Eko Convention Centre'],
      ['Christmas week', 'Flytime Fest. Check final dates with Flytime'],
    ] },

    { type: 'callout', title: 'Try it on before the night', text: 'The BlackTribe store is in Admiralty Mall, Lekki Phase 1. Come through, try the pieces, leave dressed.', cta: { label: 'Get directions', href: 'https://maps.app.goo.gl/CXbfzP5LnLXqbEtD8' }, secondary: { label: 'Shop online', href: '/shop' } },
  ],
  faq: [
    { q: 'What do people wear to Detty December?', a: 'Light, loose, statement pieces. Short-sleeve shirts, wide pants, shorts, graphic tees and one standout piece for the night. The weather is hot, so breathable fabric matters more than layers.' },
    { q: 'Is Lagos cold in December?', a: 'No. Lagos is hot in December, usually in the low 30s °C. The harmattan brings haze and dust, not cold. The only cold you meet is the AC inside concert halls.' },
    { q: 'What should men wear for Detty December?', a: 'A polo or short-sleeve shirt, wide or barrel pants, a cap and comfortable sneakers for festivals. A tee with a statement jacket for indoor concerts. All black with one detail that shines for late nights.' },
    { q: 'Can I wear streetwear to a Lagos wedding?', a: 'Wear the aso-ebi if the family chose one. Streetwear belongs at the after-party. Keep a clean change of clothes in the car.' },
    { q: 'When is Detty December 2026?', a: 'Roughly mid-December to New Year. Detty December Fest runs 18 to 30 December 2026 at Ilubirin, Lagos, with Wizkid on opening night.' },
  ],
  sources: [
    { title: 'Detty December: meaning, origin and why it has gone global (WithinNigeria, Nov 2026)', url: 'https://www.withinnigeria.com/2026/11/18/detty-december-meaning-origin-and-why-nigerias-festive-season-has-gone-global/' },
    { title: 'Concerts to attend in Lagos for Detty December 2026 (notJustOk)', url: 'https://notjustok.com/article/concerts-to-attend-in-lagos-for-detty-december-2026/' },
    { title: 'Wizkid to headline opening night of Detty December Fest 2026 (Legit.ng)', url: 'https://www.legit.ng/entertainment/celebrities/1724992-wizkid-headline-opening-night-detty-december-fest-2026-lagos/' },
  ],
  related: ['alkebulan-meaning-original-name-of-africa', 'lagos-streetwear-brands-to-know'],
};
