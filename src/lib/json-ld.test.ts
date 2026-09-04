import { describe, expect, it } from "vitest";
import { bezpieczneJsonLd } from "./json-ld";

describe("bezpieczneJsonLd", () => {
  it("nie pozwala wyjść ze znacznika script", () => {
    const zlosliwa = '</script><script>alert(document.cookie)</script>';
    const wynik = bezpieczneJsonLd({ name: zlosliwa });

    expect(wynik).not.toContain("</script>");
    expect(wynik).not.toContain("<script>");
    expect(wynik).toContain("\\u003c");
  });

  it("po sparsowaniu daje dokładnie te same dane", () => {
    const dane = {
      "@type": "Product",
      name: 'Kabel <USB-C> "premium" & więcej',
      description: "Opis z </script> w środku",
      offers: { price: 99.99, url: "https://sklep.example/p?a=1&b=2" },
    };
    expect(JSON.parse(bezpieczneJsonLd(dane))).toEqual(dane);
  });

  it("escapuje KAŻDE wystąpienie, nie tylko pierwsze", () => {
    const wynik = bezpieczneJsonLd({ a: "<", b: "<", c: "<<<" });
    expect(wynik).not.toContain("<");
    expect((wynik.match(/\\u003c/g) ?? []).length).toBe(5);
  });

  it("zwykłe dane zostają czytelne", () => {
    expect(bezpieczneJsonLd({ name: "Laptop" })).toBe('{"name":"Laptop"}');
  });

  it("dla porównania: goły JSON.stringify przepuszcza wyjście ze znacznika", () => {
    // dowód, że ten escape jest konieczny, a nie ostrożnościowy
    expect(JSON.stringify({ n: "</script>" })).toContain("</script>");
  });
});
