/*
 * BLACKTRIBE FASHION — JSON-LD STRUCTURED DATA
 *
 * Injects JSON-LD script tag into <head> for Google rich results.
 *
 * Usage:
 *   <JsonLd data={productSchema} />
 *
 * Helpers:
 *   import { buildProductSchema, buildOrganizationSchema, buildBreadcrumbSchema } from './JsonLd';
 */

import { useEffect, useRef } from 'react';

const BASE_URL = 'https://blacktribefashion.com';


/* ═══ COMPONENT ═══ */

export default function JsonLd({ data }) {
  const scriptRef = useRef(null);

  useEffect(() => {
    if (!data) return;

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
    scriptRef.current = script;

    return () => {
      if (scriptRef.current && scriptRef.current.parentNode) {
        scriptRef.current.parentNode.removeChild(scriptRef.current);
      }
    };
  }, [data]);

  return null;
}


/* ═══ SCHEMA BUILDERS ═══ */

/**
 * Product schema for product detail pages.
 * @see https://schema.org/Product
 */
export function buildProductSchema(product) {
  if (!product) return null;

  const priceInNaira = product.price / 100;
  const images = (product.images || []).map((img) =>
    img.startsWith('http') ? img : `${BASE_URL}${img}`
  );

  /* Determine availability */
  let availability = 'https://schema.org/InStock';
  const totalStock = (product.sizes || []).reduce((sum, s) => sum + (s.stock || 0), 0);
  if (totalStock === 0) {
    availability = 'https://schema.org/OutOfStock';
  } else if (product.badge === 'PRE-ORDER') {
    availability = 'https://schema.org/PreOrder';
  }

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: images,
    description: product.short_description || product.description || '',
    sku: product.sku || product.slug,
    brand: {
      '@type': 'Brand',
      name: 'BlackTribe Fashion',
    },
    offers: {
      '@type': 'Offer',
      url: `${BASE_URL}/product/${product.slug}`,
      priceCurrency: 'NGN',
      price: priceInNaira.toFixed(2),
      availability: availability,
      seller: {
        '@type': 'Organization',
        name: 'BlackTribe Fashion',
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'NG',
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          businessDays: {
            '@type': 'QuantitativeValue',
            minValue: 3,
            maxValue: 5,
          },
        },
      },
    },
  };

  /* Category */
  if (product.categories?.name) {
    schema.category = product.categories.name;
  }

  /* Color variants */
  if (product.colors?.length > 0) {
    schema.color = product.colors.map((c) => c.name || c).join(', ');
  }

  /* Size variants */
  if (product.sizes?.length > 0) {
    schema.size = product.sizes.map((s) => s.size || s.name).join(', ');
  }

  return schema;
}


/**
 * Organization schema for the homepage.
 * @see https://schema.org/Organization
 */
export function buildOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'BlackTribe Fashion',
    url: BASE_URL,
    logo: `${BASE_URL}/logo512.png`,
    description: 'Premium streetwear and luxury fashion. Born from culture, refined by craft.',
    foundingDate: '2017',
    foundingLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Lagos',
        addressCountry: 'NG',
      },
    },
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'support@blacktribefashion.com',
      contactType: 'customer service',
      availableLanguage: 'English',
    },
    sameAs: [
      'https://instagram.com/blacktribe_fashion',
    ],
  };
}


/**
 * Breadcrumb schema for product and collection pages.
 * @see https://schema.org/BreadcrumbList
 *
 * @param {Array} items — [{name: 'Home', path: '/'}, {name: 'Shop', path: '/shop'}, ...]
 */
export function buildBreadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.path ? `${BASE_URL}${item.path}` : undefined,
    })),
  };
}


/**
 * FAQ schema for the FAQ page.
 * @see https://schema.org/FAQPage
 *
 * @param {Array} faqs — [{question: '...', answer: '...'}, ...]
 */
export function buildFAQSchema(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}
