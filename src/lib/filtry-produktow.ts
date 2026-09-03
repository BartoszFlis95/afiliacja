export type FiltryProduktow = {
  category?: string | null;
  brandId?: string | null;
};

const BAZA = "/influencer/products";

/**
 * Adres listy produktów po zmianie filtrów.
 *
 * Filtry są dwa i włącza się je niezależnie, więc ręczne sklejanie
 * "?category=X&brandId=Y" to osiem wariantów, z których każdy trzeba napisać
 * poprawnie osobno — i w każdym łatwo zgubić drugi filtr.
 *
 * W `zmiany` wartość undefined zachowuje bieżący filtr, a null go czyści.
 */
export function adresProduktow(
  biezace: FiltryProduktow,
  zmiany: FiltryProduktow = {},
): string {
  const category = zmiany.category === undefined ? biezace.category : zmiany.category;
  const brandId = zmiany.brandId === undefined ? biezace.brandId : zmiany.brandId;

  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (brandId) params.set("brandId", brandId);

  const qs = params.toString();
  return qs ? `${BAZA}?${qs}` : BAZA;
}
