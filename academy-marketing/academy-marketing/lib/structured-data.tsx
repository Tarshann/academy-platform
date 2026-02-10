// ============================================
// Structured Data (JSON-LD) — Corrected for 2026
// No AggregateRating (self-serving), no FAQPage (deprecated for non-auth sites)
// ============================================

import { SITE_CONFIG, PROGRAMS, type Program } from "./config";

/**
 * LocalBusiness schema — include on every page
 */
export function getLocalBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SportsActivityLocation",
    "@id": `${SITE_CONFIG.url}/#business`,
    name: SITE_CONFIG.name,
    description: SITE_CONFIG.description,
    url: SITE_CONFIG.url,
    telephone: SITE_CONFIG.phone,
    email: SITE_CONFIG.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE_CONFIG.address.street,
      addressLocality: SITE_CONFIG.address.city,
      addressRegion: SITE_CONFIG.address.state,
      postalCode: SITE_CONFIG.address.zip,
      addressCountry: SITE_CONFIG.address.country,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: SITE_CONFIG.geo.latitude,
      longitude: SITE_CONFIG.geo.longitude,
    },
    sameAs: [SITE_CONFIG.social.facebook, SITE_CONFIG.social.instagram],
    priceRange: "$10–$280",
    currenciesAccepted: "USD",
    paymentAccepted: "Credit Card",
  };
}

/**
 * Organization schema — include on homepage
 */
export function getOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_CONFIG.url}/#organization`,
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    logo: `${SITE_CONFIG.url}/images/logo.png`,
    description: SITE_CONFIG.description,
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE_CONFIG.address.street,
      addressLocality: SITE_CONFIG.address.city,
      addressRegion: SITE_CONFIG.address.state,
      postalCode: SITE_CONFIG.address.zip,
      addressCountry: SITE_CONFIG.address.country,
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: SITE_CONFIG.phone,
      contactType: "customer service",
      availableLanguage: "English",
    },
    sameAs: [SITE_CONFIG.social.facebook, SITE_CONFIG.social.instagram],
  };
}

/**
 * Service schema — include on each program page
 */
export function getServiceSchema(program: Program) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: program.name,
    description: program.description,
    provider: {
      "@type": "SportsActivityLocation",
      "@id": `${SITE_CONFIG.url}/#business`,
      name: SITE_CONFIG.name,
    },
    areaServed: {
      "@type": "City",
      name: "Gallatin",
      containedInPlace: {
        "@type": "State",
        name: "Tennessee",
      },
    },
    offers: {
      "@type": "Offer",
      price: program.price.replace("$", ""),
      priceCurrency: "USD",
      description: program.priceNote,
    },
    url: `${SITE_CONFIG.url}/programs/${program.slug}`,
  };
}

/**
 * Event schema — use ONLY on individual event pages with unique URLs
 */
export function getEventSchema(event: {
  name: string;
  description: string;
  startDate: string; // ISO 8601
  endDate: string;
  url: string;
  locationName?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: event.name,
    description: event.description,
    startDate: event.startDate,
    endDate: event.endDate,
    url: event.url,
    location: {
      "@type": "Place",
      name: event.locationName || SITE_CONFIG.name,
      address: {
        "@type": "PostalAddress",
        streetAddress: SITE_CONFIG.address.street,
        addressLocality: SITE_CONFIG.address.city,
        addressRegion: SITE_CONFIG.address.state,
        postalCode: SITE_CONFIG.address.zip,
      },
    },
    organizer: {
      "@type": "Organization",
      "@id": `${SITE_CONFIG.url}/#organization`,
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url,
    },
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
  };
}

/**
 * BreadcrumbList schema
 */
export function getBreadcrumbSchema(
  items: { name: string; url: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Render JSON-LD script tag
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
