import { describe, expect, it } from "vitest";

import type { Zmienne } from "@/lib/env";
import { GRUPY, grupaSkonfigurowana, sprawdzKonfiguracje } from "@/lib/env";

/** Wszystkie nazwy zmiennych, z rozwinięciem alternatyw zapisanych przez "|". */
const NAZWY = GRUPY.flatMap((g) => g.zmienne.flatMap((v) => v.split("|")));

/** Komplet ustawia pierwszą nazwę z każdej alternatywy — tyle wystarcza. */
const KOMPLET: Zmienne = Object.fromEntries(
  GRUPY.flatMap((g) => g.zmienne.map((v) => [v.split("|")[0], "wartosc"])),
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
        // przy alternatywie trzeba usunąć WSZYSTKIE warianty, bo każdy
        // z osobna wystarcza do uznania pozycji za spełnioną
        for (const wariant of zmienna.split("|")) delete env[wariant];
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

describe("alternatywne nazwy zmiennych", () => {
  it("dowolny wariant z pary wystarcza", () => {
    const alternatywy = GRUPY.flatMap((g) => g.zmienne).filter((v) => v.includes("|"));
    expect(alternatywy.length).toBeGreaterThan(0);

    for (const para of alternatywy) {
      const warianty = para.split("|");
      for (const wybrany of warianty) {
        const env = { ...KOMPLET };
        for (const w of warianty) delete env[w];
        env[wybrany] = "wartosc";
        const grupa = GRUPY.find((g) => g.zmienne.includes(para))!;
        const r = sprawdzKonfiguracje(env).find((g) => g.nazwa === grupa.nazwa)!;
        expect(r.kompletna, `${para} przez ${wybrany}`).toBe(true);
      }
    }
  });

  it("lista zmiennych faktur odpowiada bramce w site.ts", () => {
    // rozjazd tych dwóch list znaczy, że admin uzupełni wszystko, o co prosi
    // check:env, i dalej zobaczy „fakturowanie zablokowane”
    const faktury = GRUPY.find((g) => g.nazwa === "faktury")!;
    for (const wymagana of [
      "DENEEU_ISSUER_NAME",
      "DENEEU_ISSUER_ADDRESS",
      "DENEEU_ISSUER_CITY",
      "DENEEU_ISSUER_POSTAL_CODE",
      "DENEEU_ISSUER_COUNTRY",
    ]) {
      expect(NAZWY).toContain(wymagana);
      expect(faktury.zmienne.some((v) => v.split("|").includes(wymagana))).toBe(true);
    }
  });
});
