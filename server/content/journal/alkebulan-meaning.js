import { ed } from './media.js';

export default { 
  slug: 'alkebulan-meaning-original-name-of-africa',
  status: 'published',
  kicker: 'Culture',
  title: 'Alkebulan: the name, the story, the debate',
  accent: 'Alkebulan',
  seoTitle: 'Alkebulan Meaning: Is It the Original Name of Africa?',
  description: 'What Alkebulan means, where the name comes from, why historians debate it, and how Africa got its name. Plus why we named a collection after it.',
  dek: 'You have seen the word on T-shirts and timelines. Here is where it comes from, what we can prove, and why it still matters.',
  published: '2026-11-26',
  updated: '2026-11-26',
  author: 'BlackTribe Journal',
  readMins: 6,
  hero: {
    src: '/images/hero/alkebulan.jpg',
    alt: 'The Alkebulan collection by BlackTribe: hieroglyph and heritage prints in gold on navy',
    caption: 'The Alkebulan collection.',
    focus: '50% 45%',
  },
  summary: [
    'Alkebulan is a name many people use for Africa, usually translated as "mother of mankind" or "garden of Eden".',
    'It was popularised in the 20th century by the historian Yosef Ben-Jochannan. No ancient text with the word has been found, so historians debate it.',
    'The word Africa comes from the Romans, who named their province around Carthage after the Afri people.',
    'Proven or not, Alkebulan has become a symbol of Africans naming themselves. That is why our collection carries it.',
  ],
  blocks: [
    { type: 'lede', text: 'Say *Alkebulan* in a room in Lagos and someone will tell you it is the real name of Africa. Say it in a university history department and someone will ask for the source. Both reactions are worth hearing.' },

    { type: 'h2', id: 'meaning', text: 'What does Alkebulan mean?' },
    { type: 'p', text: 'Alkebulan is most often translated as **"mother of mankind"** or **"garden of Eden"**. People who use it describe it as the oldest name for the continent, used by its own people before Europeans arrived, and say it was used by the Moors, Nubians and Ethiopians.' },
    { type: 'facts', items: [
      ['Spelling', 'Alkebulan, also Alkebu-lan'],
      ['Said as', 'al-keh-BOO-lan'],
      ['Usual meaning', 'Mother of mankind, or garden of Eden'],
      ['Popularised by', 'Yosef Ben-Jochannan, 20th century'],
    ] },

    { type: 'h2', id: 'origin', text: 'Where does the name come from?' },
    { type: 'p', text: 'The name spread through the work of Yosef Ben-Jochannan, the New York historian known as "Dr. Ben", who wrote 49 books on the Nile Valley. In the 1980s he ran popular study trips to Egypt called "Dr. Ben\'s Alkebu-Lan Educational Tours", calling Alkebu-Lan an ancient name for Africa.' },
    { type: 'p', text: 'Here is the honest part. No ancient inscription, manuscript or map with the word has been found, and linguists have not traced it to a known language. Ben-Jochannan\'s wider work was criticised by academics for historical errors. So when someone says Alkebulan is *the* original name of Africa, the fair answer is: it is a belief, not a record.' },
    { type: 'quote', text: 'A name does not need a stone tablet to carry weight. It needs people who answer to it.' },

    { type: 'h2', id: 'africa', text: 'So where does the word "Africa" come from?' },
    { type: 'p', text: 'From Rome. After Rome destroyed Carthage in 146 BCE, it created a province called Africa, in what is now northern Tunisia. The name means "land of the Afri", a people who lived near Carthage and are likely ancestors of today\'s Berber peoples.' },
    { type: 'p', text: 'Over centuries the name stretched south until it covered the whole continent. Nobody is certain what "Afri" itself meant. The leading guesses are the Berber word *ifri*, cave, and the Phoenician *afar*, dust. The popular Latin *aprica*, sunny, has little support.' },
    { type: 'timeline', items: [
      ['146 BCE', 'Rome destroys Carthage and creates the province of Africa'],
      ['c. 150 CE', 'Ptolemy\'s Geography puts the name on maps of North Africa'],
      ['Middle Ages', 'Arab writers call the region Ifriqiya, and lands south of the Sahara Bilad al-Sudan'],
      ['20th century', 'Ben-Jochannan popularises Alkebu-Lan'],
    ] },

    { type: 'h2', id: 'other-names', text: 'Other names the continent has carried' },
    { type: 'list', items: [
      '**Libya.** The ancient Greek name for North Africa, from the Libu people west of the Nile.',
      '**Aethiopia.** Greek and Roman name for the lands south of Egypt, mainly Nubia.',
      '**Ifriqiya.** The Arabic form of Africa, used for the Tunisian region.',
      '**Bilad al-Sudan.** Arabic for "land of the Black people", the belt between the Sahara and the forests.',
    ] },
    { type: 'p', text: 'Notice the pattern. Almost every name we can document was given from outside. That is exactly why Alkebulan travels so well.' },

    { type: 'h2', id: 'why-it-matters', text: 'Why the name still matters' },
    { type: 'p', text: 'Names are power. The person who names a place decides how it is remembered. For many Africans and people across the diaspora, saying Alkebulan is a way of taking that power back, a reminder that the continent had its own languages, kingdoms and stories long before Rome drew a border.' },
    { type: 'p', text: 'You can hold both truths at once. The history is debated. The feeling is real.' },

    { type: 'image', src: ed('issue-01/cover-back-mask.jpg'), alt: 'The back of a white BlackTribe tee printed with the tribal mask, worn against a dark textured wall', caption: 'The mask. Our first symbol, before any collection had a name.', size: 'wide', focus: '50% 40%' },

    { type: 'h2', id: 'the-collection', text: 'Why we named a collection Alkebulan' },
    { type: 'p', text: 'BlackTribe started in Lagos in 2017 with art shows and parties, a tribe of creatives before it was a label. When we built a collection about where we come from, the name chose itself. Alkebulan is hieroglyphs, heritage prints and gold on navy. Pieces that carry a story you can wear to the function and explain at the afterparty.' },
    { type: 'products', title: 'The Alkebulan collection', collection: 'alkebulan', link: { label: 'See the full collection', href: '/collections/alkebulan' } },

    { type: 'callout', title: 'See it in person', text: 'The full Alkebulan collection is in the BlackTribe store at Admiralty Mall, Lekki Phase 1.', cta: { label: 'Get directions', href: 'https://maps.app.goo.gl/CXbfzP5LnLXqbEtD8' }, secondary: { label: 'Shop Alkebulan', href: '/collections/alkebulan' } },
  ],
  faq: [
    { q: 'What does Alkebulan mean?', a: 'Alkebulan is usually translated as "mother of mankind" or "garden of Eden". It is used as an indigenous name for Africa.' },
    { q: 'Is Alkebulan the original name of Africa?', a: 'Many people believe so, but there is no ancient written record of the word. It was popularised in the 20th century by the historian Yosef Ben-Jochannan, and historians still debate it.' },
    { q: 'How do you pronounce Alkebulan?', a: 'Most people say al-keh-BOO-lan.' },
    { q: 'Who named Africa?', a: 'The Romans. After destroying Carthage in 146 BCE they named their new province Africa, the land of the Afri people. The name later spread to the whole continent.' },
    { q: 'What is the Alkebulan collection?', a: 'A BlackTribe collection of hieroglyph and heritage prints in gold on navy, designed in Lagos. It is available online and at the BlackTribe store in Admiralty Mall, Lekki Phase 1.' },
  ],
  sources: [
    { title: 'Who named Africa, and what is the original name of Africa? (Altezza Travel)', url: 'https://altezzatravel.com/articles/the-original-name-of-africa' },
    { title: 'What was the original name of Africa? (WorldAtlas)', url: 'https://worldatlas.com/articles/what-was-the-original-name-of-africa.html' },
    { title: 'What is Africa\'s original name? (Guardian Life)', url: 'https://guardian.ng/life/what-is-africas-original-name/' },
    { title: 'Yosef Ben-Jochannan (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Yosef_Ben-Jochannan' },
  ],
  related: ['lagos-streetwear-brands-to-know', 'what-to-wear-detty-december-lagos'],
};
