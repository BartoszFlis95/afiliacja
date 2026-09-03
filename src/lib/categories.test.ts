import { describe, expect, it } from "vitest";
import { ProductCategory } from "@prisma/client";

import {
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  CATEGORY_OPTIONS,
  etykietaKategorii,
  ikonaKategorii,
} from "./categories";

const wartosciEnuma = Object.values(ProductCategory);

describe("spójność z enumem Prismy", () => {
  it("każda wartość enuma ma etykietę", () => {
    const brakujace = wartosciEnuma.filter((v) => !CATEGORY_LABELS[v]);
    expect(brakujace).toEqual([]);
  });

  it("każda wartość enuma ma ikonę", () => {
    const brakujace = wartosciEnuma.filter((v) => !CATEGORY_ICONS[v]);
    expect(brakujace).toEqual([]);
  });

  it("mapy nie zawierają kluczy spoza enuma", () => {
    const nadmiarowe = Object.keys(CATEGORY_LABELS).filter(
      (k) => !wartosciEnuma.includes(k as ProductCategory),
    );
    expect(nadmiarowe).toEqual([]);
  });

  it("nazwy wartości są ASCII — Prisma nie przyjmuje polskich znaków", () => {
    // to nie jest teoria: BIŻUTERIA i ŁAZIENKA wywalały walidację schematu
    const zle = wartosciEnuma.filter((v) => !/^[A-Z][A-Z0-9_]*$/.test(v));
    expect(zle).toEqual([]);
  });

  it("diakrytyki żyją w etykietach, nie w nazwach", () => {
    expect(CATEGORY_LABELS.BIZUTERIA).toBe("Biżuteria");
    expect(CATEGORY_LABELS.LAZIENKA).toBe("Łazienka");
  });
});

describe("CATEGORY_OPTIONS", () => {
  it("zawiera wszystkie kategorie", () => {
    expect(CATEGORY_OPTIONS).toHaveLength(wartosciEnuma.length);
  });

  it("jest posortowana regułami polskimi", () => {
    const etykiety = CATEGORY_OPTIONS.map((o) => o.label);
    const posortowane = [...etykiety].sort((a, b) => a.localeCompare(b, "pl"));
    expect(etykiety).toEqual(posortowane);
  });

  it("sortowanie polskie stawia Ł po L, nie na końcu alfabetu", () => {
    const pozycjaLazienka = CATEGORY_OPTIONS.findIndex((o) => o.value === "LAZIENKA");
    const pozycjaMeble = CATEGORY_OPTIONS.findIndex((o) => o.value === "MEBLE");
    expect(pozycjaLazienka).toBeLessThan(pozycjaMeble);
  });
});

describe("zapas dla wartości nieznanych", () => {
  it("brak kategorii nie wywala widoku", () => {
    expect(etykietaKategorii(null)).toBe("Bez kategorii");
    expect(ikonaKategorii(null)).toBe("📦");
  });

  it("wartość spoza listy wraca jako własny tekst", () => {
    expect(etykietaKategorii("COS_NOWEGO")).toBe("COS_NOWEGO");
    expect(ikonaKategorii("COS_NOWEGO")).toBe("📦");
  });
});
