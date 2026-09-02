import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        // Panele — i tak za logowaniem, ale niech crawler nie traci na nie budżetu.
        "/brand/",
        "/influencer/",
        "/admin/",
        "/api/",
        // Przekierowania afiliacyjne. To nie jest treść, tylko licznik kliknięć
        // przekierowujący do sklepu marki — zaindeksowane byłyby duplikatem
        // cudzej strony i ujawniałyby kody linków w wynikach wyszukiwania.
        "/r/",
        // Strony transakcyjne z jednorazowymi tokenami w URL-u.
        "/verify-email",
        "/reset-password",
        "/forgot-password",
        // Podgląd szablonów maili (i tak zwraca 404 na produkcji).
        "/email-preview",
      ],
    },
    sitemap: "https://www.deneeu.pl/sitemap.xml",
    host: "https://www.deneeu.pl",
  };
}
