import type { Metadata } from "next";
import { SITE, CONTACT } from "@/lib/config";
import { LocalBusinessJsonLd } from "@/lib/structured-data";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import Analytics from "@/components/seo/Analytics";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — Youth Athletic Training in Gallatin, TN`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  keywords: [
    "youth athletic training",
    "Gallatin TN",
    "basketball training",
    "flag football training",
    "soccer training",
    "SAQ training",
    "speed agility quickness",
    "youth sports",
    "Sumner County",
    "performance lab",
    "skills lab",
  ],
  authors: [{ name: SITE.name }],
  openGraph: {
    title: `${SITE.name} — Youth Athletic Training in Gallatin, TN`,
    description: SITE.description,
    url: SITE.url,
    siteName: SITE.name,
    images: [{ url: SITE.ogImage, width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — Youth Athletic Training in Gallatin, TN`,
    description: SITE.description,
    images: [SITE.ogImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  verification: {
    // google: "YOUR_GOOGLE_VERIFICATION_CODE",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Source+Sans+3:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <LocalBusinessJsonLd />
      </head>
      <body className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1">{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
