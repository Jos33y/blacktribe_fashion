/*
 * The BlackTribe store: one source of truth for the address.
 * Used by the footer, the contact page and (mirrored) the server SEO schema.
 * mapsUrl and reviewUrl come from the verified Google Business Profile.
 */
export const STORE = {
  name: 'BlackTribe Fashion',
  place: 'Admiralty Mall',
  unit: 'Shop 31, 2nd Floor',
  street: '1 Olawale Cole Onitiri Avenue',
  landmark: 'Off Admiralty Road',
  area: 'Lekki Phase 1',
  city: 'Lagos',
  postalCode: '106104',
  lga: 'Eti-Osa',
  country: 'Nigeria',
  hours: null, // e.g. [['Mon to Sat', '10am to 8pm'], ['Sun', '1pm to 6pm']]
  mapsUrl: 'https://maps.app.goo.gl/CXbfzP5LnLXqbEtD8',
  reviewUrl: 'https://g.page/r/CdnYYTJ6p1GNEBM/review',
};

export const storeLines = [
  `${STORE.unit}, ${STORE.place}`,
  `${STORE.street}, ${STORE.landmark}`,
  `${STORE.area}, ${STORE.city} ${STORE.postalCode}`,
];
