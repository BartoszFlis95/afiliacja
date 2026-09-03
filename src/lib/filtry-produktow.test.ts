import { describe, expect, it } from "vitest";
import { adresProduktow } from "./filtry-produktow";

const BAZA = "/influencer/products";

describe("adresProduktow", () => {
  it("bez filtrów zwraca goły adres", () => {
    expect(adresProduktow({})).toBe(BAZA);
    expect(adresProduktow({ category: null, brandId: null })).toBe(BAZA);
  });

  it("ustawienie kategorii zachowuje wybraną markę", () => {
    // to jest sedno: sklejanie tekstu gubiło tu drugi filtr
    expect(adresProduktow({ brandId: "b1" }, { category: "SPORT" })).toBe(
      `${BAZA}?category=SPORT&brandId=b1`,
    );
  });

  it("ustawienie marki zachowuje wybraną kategorię", () => {
    expect(adresProduktow({ category: "SPORT" }, { brandId: "b1" })).toBe(
      `${BAZA}?category=SPORT&brandId=b1`,
    );
  });

  it("czyszczenie jednego filtra zostawia drugi", () => {
    const oba = { category: "SPORT", brandId: "b1" };
    expect(adresProduktow(oba, { category: null })).toBe(`${BAZA}?brandId=b1`);
    expect(adresProduktow(oba, { brandId: null })).toBe(`${BAZA}?category=SPORT`);
  });

  it("czyszczenie obu wraca do gołego adresu", () => {
    expect(adresProduktow({ category: "SPORT", brandId: "b1" }, { category: null, brandId: null })).toBe(BAZA);
  });

  it("brak zmian zachowuje stan bieżący", () => {
    expect(adresProduktow({ category: "SPORT", brandId: "b1" })).toBe(
      `${BAZA}?category=SPORT&brandId=b1`,
    );
  });

  it("koduje znaki specjalne w identyfikatorze", () => {
    // identyfikatory to cuid, ale adres nie może zależeć od tego założenia
    expect(adresProduktow({}, { brandId: "a b&c=d" })).toBe(`${BAZA}?brandId=a+b%26c%3Dd`);
  });

  it("pusty ciąg traktuje jak brak filtra, nie jak wartość", () => {
    expect(adresProduktow({ category: "", brandId: "" })).toBe(BAZA);
  });
});
