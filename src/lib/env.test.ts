import { describe, expect, it } from "vitest";

import { GRUPY, grupaSkonfigurowana, sprawdzKonfiguracje } from "@/lib/env";

const KOMPLET: NodeJS.ProcessEnv = Object.fromEntries(
  GRUPY.flatMap((g) => g.zmienne.map((v) => [v, "wartosc"])),
);

/**
 * Ten moduł powstał, bo brakująca zmienna środowiskowa nie powodowała w tym
 * projekcie błędu, tylko po cichu psuła zachowanie: nagłówek From
 * "undefined <undefined>", NIP "0000000000" na fakturze VAT, linki resetu
 * hasła na złej domenie. Testy pilnują, że raport faktycznie wykrywa braki
 * i że żadna grupa nie została po cichu wypłaszczona do pustej listy.
 */
describe("konfiguracja środowiska", () => {
  it("przy komplecie zmiennych wszystkie grupy są kompletne", () => {
    const r = sprawdzKonfiguracje(KOMPLET);
    expect(r.every((g) => g.kompletna)).toBe(true);
  });

  it("wykrywa brak każdej pojedynczej zmiennej", () => {
    for (const grupa of GRUPY) {
      for (const zmienna of grupa.zmienne) {
        const env = { ...KOMPLET };
        delete env[zmienna];
        const r = sprawdzKonfiguracje(env).find((g) => g.nazwa === grupa.nazwa)!;
        expect(r.kompletna, `${grupa.nazwa}/${zmienna}`).toBe(false);
        expect(r.brakujace).toContain(zmienna);
      }
    }
  });

  it("pusty string traktuje jak brak — inaczej ZMIENNA= przechodziłaby jako ustawiona", () => {
    const env = { ...KOMPLET, STRIPE_SECRET_KEY: "   " };
    expect(grupaSkonfigurowana("wypłaty (Stripe)", env)).toBe(false);
  });

  it("każda grupa mówi, co przestanie działać", () => {
    for (const g of GRUPY) {
      expect(g.konsekwencja.length, g.nazwa).toBeGreaterThan(20);
      expect(g.zmienne.length, g.nazwa).toBeGreaterThan(0);
    }
  });

  it("nazwy grup są unikalne — grupaSkonfigurowana szuka po nazwie", () => {
    const nazwy = GRUPY.map((g) => g.nazwa);
    expect(new Set(nazwy).size).toBe(nazwy.length);
  });

  it("odmawia dla nieznanej grupy zamiast po cichu zwracać false", () => {
    expect(() => grupaSkonfigurowana("nieistniejąca", KOMPLET)).toThrow();
  });
});
