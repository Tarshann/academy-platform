import {
  SITE,
  CONTACT,
  ADDRESS,
  SOCIAL_URLS,
  OPENING_HOURS,
  PROGRAMS,
  TESTIMONIALS,
} from "./config";

export function LocalBusinessJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": ["SportsActivityLocation", "LocalBusiness"],
    name: SITE.name,
    description: SITE.description,
    url: SITE.url,
    logo: `${SITE.url}${SITE.logo}`,
    image: `${SITE.url}${SITE.logo}`,
    foundingDate: String(SITE.foundingYear),
    telephone: CONTACT.phone,
    email: CONTACT.email,
    address: {
      "@type": "PostalAddress",
      addressLocality: ADDRESS.locality,
      addressRegion: ADDRESS.region,
      addressCountry: ADDRESS.country,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: ADDRESS.geo.lat,
      longitude: ADDRESS.geo.lng,
    },
    areaServed: [
      { "@type": "City", name: "Gallatin, TN" },
      { "@type": "City", name: "Hendersonville, TN" },
      { "@type": "AdministrativeArea", name: "Sumner County, TN" },
    ],
    priceRange: "$10–$245",
    openingHoursSpecification: OPENING_HOURS.map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: h.day,
      opens: h.open,
      closes: h.close,
    })),
    sameAs: SOCIAL_URLS,
    review: TESTIMONIALS.map((t) => ({
      "@type": "Review",
      reviewRating: {
        "@type": "Rating",
        ratingValue: String(t.rating),
        bestRating: "5",
      },
      author: { "@type": "Person", name: t.author },
      reviewBody: t.quote,
    })),
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "5",
      reviewCount: String(TESTIMONIALS.length),
      bestRating: "5",
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Training Programs",
      itemListElement: PROGRAMS.map((p) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: p.name,
          description: p.description,
        },
        price: String(p.priceRaw),
        priceCurrency: "USD",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: String(p.priceRaw),
          priceCurrency: "USD",
          unitText: p.unit.replace("per ", ""),
        },
      })),
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function ServiceJsonLd({
  name,
  description,
  price,
  unit,
}: {
  name: string;
  description: string;
  price: number;
  unit: string;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    description,
    provider: { "@type": "Organization", name: SITE.name },
    offers: {
      "@type": "Offer",
      price: String(price),
      priceCurrency: "USD",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: String(price),
        priceCurrency: "USD",
        unitText: unit.replace("per ", ""),
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function BreadcrumbJsonLd({
  items,
}: {
  items: { name: string; href: string }[];
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE.url}${item.href}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
