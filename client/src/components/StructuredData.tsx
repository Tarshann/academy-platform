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
  description = "Elite youth basketball program prioritizing player development in all areas, ages 8-18.",
  url,
  logo,
  phone = "(571) 292-0833",
  email = "omarphilmore@yahoo.com",
  socialMedia = [
    "https://www.facebook.com/theacademytn",
    "https://www.instagram.com/theacademytn",
    "https://www.tiktok.com/@theacademytn"
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
    const data: OrganizationStructuredData = {
      "@context": "https://schema.org",
      "@type": "SportsOrganization",
      name,
      description,
      url: url || siteUrl,
      logo: logo || `${siteUrl}/academy-logo.jpeg`,
      contactPoint: {
        "@type": "ContactPoint",
        telephone: phone,
        contactType: "Customer Service",
        email,
      },
      sameAs: socialMedia,
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
