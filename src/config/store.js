/*
 * The BlackTribe store: one source of truth for the address.
 * Used by the footer, the contact page and (mirrored) the server SEO schema.
 * When the Google Business Profile is live, paste its share link into
 * mapsUrl so "Get directions" opens the exact pin.
 */
export const STORE = {
  name: 'BlackTribe Fashion',
  place: 'Admiralty Mall',
  unit: 'Shop 31, 2nd Floor',
  street: '1 Olawale Cole-Onitiri Avenue',
  landmark: 'Off Admiralty Road',
  area: 'Lekki Phase 1',
  city: 'Lagos',
  country: 'Nigeria',
  hours: null, // e.g. [['Mon to Sat', '10am to 8pm'], ['Sun', '1pm to 6pm']]
  mapsUrl:
    'https://www.google.com/maps/search/?api=1&query=' +
    encodeURIComponent('Admiralty Mall, Admiralty Road, Lekki Phase 1, Lagos'),
};

export const storeLines = [
  `${STORE.unit}, ${STORE.place}`,
  `${STORE.street}, ${STORE.landmark}`,
  `${STORE.area}, ${STORE.city}`,
];
