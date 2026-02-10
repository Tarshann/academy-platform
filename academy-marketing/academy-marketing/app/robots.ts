import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/portal/",    // member portal (behind auth)
          "/dashboard/", // admin dashboard
        ],
      },
    ],
    sitemap: "https://academytn.com/sitemap.xml",
  };
}
