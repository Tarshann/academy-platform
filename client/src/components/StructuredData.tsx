import { useEffect } from "react";

interface OrganizationStructuredData {
  "@context": string;
  "@type": string;
  name: string;
  description?: string;
  url?: string;
  logo?: string;
  contactPoint?: {
    "@type": string;
    telephone: string;
    contactType: string;
    email?: string;
  };
  sameAs?: string[];
}

interface ProgramStructuredData {
  "@context": string;
  "@type": string;
  name: string;
  description?: string;
  provider: {
    "@type": string;
    name: string;
  };
  offers?: {
    "@type": string;
    price: string;
    priceCurrency: string;
  };
}

export function OrganizationStructuredData({
  name = "The Academy",
  description = "Youth athletic training in Gallatin, TN. Basketball, flag football, and soccer development with SAQ, strength, and skill training.",
  url,
  logo,
  phone = "(571) 292-0633",
  email = "omarphilmore@yahoo.com",
  socialMedia = [
    "https://www.facebook.com/share/1DY8v2AEuN/?mibextid=wwXIfr",
    "https://www.instagram.com/the_academytn",
    "https://www.tiktok.com/@academytn"
  ]
}: {
  name?: string;
  description?: string;
  url?: string;
  logo?: string;
  phone?: string;
  email?: string;
  socialMedia?: string[];
}) {
  useEffect(() => {
    const siteUrl = typeof window !== "undefined" ? window.location.origin : "";

    // SportsOrganization + LocalBusiness combined schema
    const data = {
      "@context": "https://schema.org",
      "@type": ["SportsActivityLocation", "LocalBusiness"],
      name,
      description,
      url: url || siteUrl,
      logo: logo || `${siteUrl}/academy-logo.jpeg`,
      image: logo || `${siteUrl}/academy-logo.jpeg`,
      telephone: phone,
      email,
      address: {
        "@type": "PostalAddress",
        addressLocality: "Gallatin",
        addressRegion: "TN",
        addressCountry: "US",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: 36.3884,
        longitude: -86.4467,
      },
      areaServed: [
        { "@type": "City", name: "Gallatin, TN" },
        { "@type": "City", name: "Hendersonville, TN" },
        { "@type": "AdministrativeArea", name: "Sumner County, TN" },
      ],
      priceRange: "$10–$245",
      openingHoursSpecification: [
        { "@type": "OpeningHoursSpecification", dayOfWeek: "Tuesday", opens: "18:00", closes: "20:00" },
        { "@type": "OpeningHoursSpecification", dayOfWeek: "Thursday", opens: "18:00", closes: "20:00" },
        { "@type": "OpeningHoursSpecification", dayOfWeek: "Sunday", opens: "11:00", closes: "12:00" },
      ],
      contactPoint: {
        "@type": "ContactPoint",
        telephone: phone,
        contactType: "Customer Service",
        email,
      },
      sameAs: socialMedia,
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Training Programs",
        itemListElement: [
          {
            "@type": "Offer",
            itemOffered: { "@type": "Service", name: "Performance Lab", description: "Year-round structured training for athletes ages 8–14. 3 sessions/week, capped at 6–8 per group." },
            price: "245",
            priceCurrency: "USD",
            priceSpecification: { "@type": "UnitPriceSpecification", price: "245", priceCurrency: "USD", unitText: "month" },
          },
          {
            "@type": "Offer",
            itemOffered: { "@type": "Service", name: "Skills Lab", description: "Drop-in training sessions for all ages. Movement fundamentals, skill stations, competitive games." },
            price: "10",
            priceCurrency: "USD",
            priceSpecification: { "@type": "UnitPriceSpecification", price: "10", priceCurrency: "USD", unitText: "session" },
          },
          {
            "@type": "Offer",
            itemOffered: { "@type": "Service", name: "Private Training", description: "1-on-1 sessions with Coach Mac or Coach O. Personalized athletic development plans." },
            price: "60",
            priceCurrency: "USD",
            priceSpecification: { "@type": "UnitPriceSpecification", price: "60", priceCurrency: "USD", unitText: "session" },
          },
        ],
      },
    };

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "organization-structured-data";
    script.text = JSON.stringify(data);

    // Remove existing script if present
    const existing = document.getElementById("organization-structured-data");
    if (existing) {
      existing.remove();
    }

    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById("organization-structured-data");
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [name, description, url, logo, phone, email, socialMedia]);

  return null;
}

export function ProgramStructuredData({
  name,
  description,
  price,
  priceCurrency = "USD"
}: {
  name: string;
  description?: string;
  price?: string;
  priceCurrency?: string;
}) {
  useEffect(() => {
    const data: ProgramStructuredData = {
      "@context": "https://schema.org",
      "@type": "Course",
      name,
      description,
      provider: {
        "@type": "Organization",
        name: "The Academy",
      },
      ...(price && {
        offers: {
          "@type": "Offer",
          price,
          priceCurrency,
        },
      }),
    };

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "program-structured-data";
    script.text = JSON.stringify(data);
    
    // Remove existing script if present
    const existing = document.getElementById("program-structured-data");
    if (existing) {
      existing.remove();
    }
    
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById("program-structured-data");
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [name, description, price, priceCurrency]);

  return null;
}
