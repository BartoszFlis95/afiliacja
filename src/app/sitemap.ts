import type { MetadataRoute } from "next";

import { prisma } from "@/lib/prisma";

const BASE = "https://www.deneeu.pl";

/**
 * Sitemap był statyczną listą sześciu stron i nie zawierał ANI JEDNEGO
 * produktu — czyli jedynej treści, która realnie może rankować. Katalog rośnie
 * z każdym produktem dodanym przez markę, więc lista musi pochodzić z bazy.
 *
 * Wykluczone świadomie:
 * - /r/[code] — przekierowania afiliacyjne, nie treść (patrz robots.ts)
 * - strony transakcyjne (reset hasła, weryfikacja emaila) — bez wartości
 *   wyszukiwarkowej i z jednorazowymi tokenami w URL-u
 * - panele — i tak za logowaniem
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const teraz = new Date();
  const statyczne: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: teraz, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/products`, lastModified: teraz, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/docs`, lastModified: teraz, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/register`, lastModified: teraz, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/login`, lastModified: teraz, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/terms`, lastModified: teraz, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/privacy`, lastModified: teraz, changeFrequency: "yearly", priority: 0.3 },
  ];

  let produkty: MetadataRoute.Sitemap = [];
  try {
    const rows = await prisma.product.findMany({
      where: { status: "ACTIVE" },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 5000,
    });
    produkty = rows.map((p) => ({
      url: `${BASE}/products/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch (error) {
    // Baza niedostępna nie może wywalić sitemapy — lepiej oddać same strony
    // statyczne niż 500, które Google zinterpretuje jako awarię serwisu.
    console.error("[sitemap] nie udało się pobrać produktów:", error);
  }

  return [...statyczne, ...produkty];
}
