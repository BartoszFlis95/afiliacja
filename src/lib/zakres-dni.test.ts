import { describe, expect, it } from "vitest";
import { DOZWOLONE_ZAKRESY, zawezZakres } from "./zakres-dni";

describe("zawezZakres", () => {
  it("przepuszcza dozwolone wartości bez zmian", () => {
    for (const d of DOZWOLONE_ZAKRESY) expect(zawezZakres(d)).toBe(d);
  });

  it("sprowadza wartości spoza zbioru do wartości domyślnej", () => {
    // regresja: typ 7|30|90 znika w runtime, a akcja to publiczny endpoint —
    // 1e9 dawało zapytanie po dacie sprzed tysięcy lat i pętlę na miliard obrotów
    expect(zawezZakres(1e9)).toBe(30);
    expect(zawezZakres(-5)).toBe(30);
    expect(zawezZakres(0)).toBe(30);
    expect(zawezZakres(31)).toBe(30);
    expect(zawezZakres(Number.NaN)).toBe(30);
    expect(zawezZakres(Number.POSITIVE_INFINITY)).toBe(30);
  });
});
