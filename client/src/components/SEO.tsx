import { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

const SITE_NAME = "The Academy";
const DEFAULT_DESCRIPTION = "Elite youth multi-sport training for basketball, flag football, and soccer athletes. Focused on speed, agility, quickness, and strength development.";
const DEFAULT_IMAGE = "/academy-logo.jpeg";
const SITE_URL =
  import.meta.env.VITE_SITE_URL ||
  (typeof window !== "undefined" ? window.location.origin : "");

export function SEO({ 
  title, 
  description = DEFAULT_DESCRIPTION, 
  image = DEFAULT_IMAGE,
  url,
  type = "website"
}: SEOProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const fullUrl = url ? `${SITE_URL}${url}` : (typeof window !== "undefined" ? window.location.href : SITE_URL);
  const fullImage = image.startsWith("http") ? image : `${SITE_URL}${image}`;

  useEffect(() => {
    // Update document title
    document.title = fullTitle;

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, attribute: string = "name") => {
      let element = document.querySelector(`meta[${attribute}="${name}"]`);
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      element.setAttribute("content", content);
    };

    const updateLinkTag = (rel: string, href: string) => {
      let element = document.querySelector(`link[rel="${rel}"]`);
      if (!element) {
        element = document.createElement("link");
        element.setAttribute("rel", rel);
        document.head.appendChild(element);
      }
      element.setAttribute("href", href);
    };

    // Basic meta tags
    updateMetaTag("description", description);
    
    // Open Graph tags
    updateMetaTag("og:title", fullTitle, "property");
    updateMetaTag("og:description", description, "property");
    updateMetaTag("og:image", fullImage, "property");
    updateMetaTag("og:url", fullUrl, "property");
    updateMetaTag("og:type", type, "property");
    updateMetaTag("og:site_name", SITE_NAME, "property");
    
    // Twitter Card tags
    updateMetaTag("twitter:card", "summary_large_image");
    updateMetaTag("twitter:title", fullTitle);
    updateMetaTag("twitter:description", description);
    updateMetaTag("twitter:image", fullImage);
    
    // Canonical URL
    updateLinkTag("canonical", fullUrl);
  }, [fullTitle, description, fullImage, fullUrl, type]);

  return null;
}
