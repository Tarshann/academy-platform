import type { Metadata } from "next";
import { SITE_CONFIG } from "./config";

type PageMeta = {
  title: string;
  description: string;
  path?: string;
  ogImage?: string;
};

/**
 * Generate complete Next.js Metadata for any page.
 * Includes OG tags, Twitter cards, and canonical URL.
 */
export function generatePageMetadata({
  title,
  description,
  path = "",
  ogImage = "/images/og-default.jpg",
}: PageMeta): Metadata {
  const url = `${SITE_CONFIG.url}${path}`;
  const fullTitle =
    path === "" || path === "/"
      ? `${SITE_CONFIG.name} — ${SITE_CONFIG.tagline}`
      : `${title} | ${SITE_CONFIG.name}`;

  return {
    title: fullTitle,
    description,
    metadataBase: new URL(SITE_CONFIG.url),
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "website",
      url,
      title: fullTitle,
      description,
      siteName: SITE_CONFIG.name,
      locale: "en_US",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [ogImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}
