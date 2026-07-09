import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/docs", "/terms", "/privacy", "/login", "/register"],
      disallow: ["/brand/", "/influencer/", "/admin/", "/api/"],
    },
    sitemap: "https://www.deneeu.pl/sitemap.xml",
  };
}
