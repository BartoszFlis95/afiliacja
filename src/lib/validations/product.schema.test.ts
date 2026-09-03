import { describe, expect, it } from "vitest";

import { ProductSchema } from "@/lib/validations/product.schema";
import { ProductCategory } from "@prisma/client";

const poprawny = {
  name: "Koszulka",
  category: ProductCategory.MODA_DAMSKA,
  price: 99.99,
  commissionRate: 15,
  influencerCommissionRate: 10,
  productUrl: "https://sklep.pl/koszulka",
  slug: "koszulka",
  status: "ACTIVE" as const,
};

describe("ProductSchema", () => {
  it("przyjmuje poprawny produkt", () => {
    expect(ProductSchema.safeParse(poprawny).success).toBe(true);
  });

  /**
   * NAJWAŻNIEJSZY test w tym pliku. calculateCommissionSplit zwraca ujemną
   * prowizję platformy, gdy stawka influencera przewyższa całkowitą — i nie
   * broni się przed tym sam. Ta reguła jest jedyną rzeczą, która nie dopuszcza
   * takiego produktu do bazy. Akcje serwerowe (create/updateProductAction)
   * walidują właśnie tym schematem, więc test pilnuje realnej ścieżki zapisu.
   */
  it("odrzuca stawkę influencera wyższą od całkowitej", () => {
    const wynik = ProductSchema.safeParse({
      ...poprawny,
      commissionRate: 5,
      influencerCommissionRate: 10,
    });
    expect(wynik.success).toBe(false);
    if (!wynik.success) {
      expect(wynik.error.issues[0].path).toContain("influencerCommissionRate");
    }
  });

  it("dopuszcza stawki równe (platforma nie zarabia, ale to legalne)", () => {
    expect(
      ProductSchema.safeParse({
        ...poprawny,
        commissionRate: 10,
        influencerCommissionRate: 10,
      }).success,
    ).toBe(true);
  });

  it("odrzuca prowizję powyżej 100%", () => {
    expect(
      ProductSchema.safeParse({ ...poprawny, commissionRate: 101 }).success,
    ).toBe(false);
  });

  it("odrzuca ujemną prowizję influencera", () => {
    expect(
      ProductSchema.safeParse({ ...poprawny, influencerCommissionRate: -1 }).success,
    ).toBe(false);
  });

  it("odrzuca prowizję całkowitą poniżej 0.1%", () => {
    expect(
      ProductSchema.safeParse({
        ...poprawny,
        commissionRate: 0,
        influencerCommissionRate: 0,
      }).success,
    ).toBe(false);
  });

  it("odrzuca ujemną cenę", () => {
    expect(ProductSchema.safeParse({ ...poprawny, price: -1 }).success).toBe(false);
  });

  it("wymusza format sluga (małe litery, cyfry, myślniki)", () => {
    for (const slug of ["Koszulka", "koszulka!", "koszulka spacja", "ko_szulka"]) {
      expect(ProductSchema.safeParse({ ...poprawny, slug }).success).toBe(false);
    }
    expect(ProductSchema.safeParse({ ...poprawny, slug: "koszulka-2" }).success).toBe(true);
  });

  it("odrzuca URL produktu, który nie jest adresem", () => {
    expect(
      ProductSchema.safeParse({ ...poprawny, productUrl: "sklep.pl/koszulka" }).success,
    ).toBe(false);
  });
});

describe("kategoria jako enum", () => {
  it("odrzuca kategorię wpisaną z ręki", () => {
    // regresja: kolumna była wolnym tekstem, więc w bazie wylądowały
    // wartości "Bizuteria3" i "L", przez co filtrowanie nie mogło działać
    const wynik = ProductSchema.safeParse({ ...poprawny, category: "Bizuteria3" });
    expect(wynik.success).toBe(false);
  });

  it("przyjmuje każdą wartość z enuma", () => {
    for (const kategoria of Object.values(ProductCategory)) {
      expect(ProductSchema.safeParse({ ...poprawny, category: kategoria }).success).toBe(true);
    }
  });
});
