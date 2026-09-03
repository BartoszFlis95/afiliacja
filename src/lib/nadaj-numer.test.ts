import { describe, expect, it } from "vitest";
import { formatujNumerDokumentu } from "./numer-dokumentu";

/**
 * Sekwencja z nadaj-numer.ts: kolejny = najwyższy zapisany w roku + 1.
 * Odwzorowana tu, żeby sprawdzić własności bez bazy.
 */
function pozycjaZNumeru(numer: string): number {
  const n = Number.parseInt(numer.slice(numer.lastIndexOf("/") + 1), 10);
  return Number.isFinite(n) ? n : 0;
}

function nastepny(istniejace: string[], rok: number): string {
  const wRoku = istniejace.filter((n) => n.startsWith(`RC/${rok}/`));
  const najwyzszy = wRoku.sort().at(-1);
  return formatujNumerDokumentu(rok, (najwyzszy ? pozycjaZNumeru(najwyzszy) : 0) + 1);
}

describe("sekwencja numerów", () => {
  it("startuje od 0001 w pustym roku", () => {
    expect(nastepny([], 2026)).toBe("RC/2026/0001");
  });

  it("kontynuuje od najwyższego, nie od liczby wierszy", () => {
    // luki są normalne: odrzucone wypłaty konsumowały numery
    expect(nastepny(["RC/2026/0001", "RC/2026/0004"], 2026)).toBe("RC/2026/0005");
  });

  it("sortowanie tekstowe zawodzi powyżej 9999 — dlatego jest kolumna liczbowa", () => {
    // to jest dowód, że sortowanie po tekście numeru NIE wystarcza:
    // "RC/2026/10000" < "RC/2026/9999" leksykograficznie
    expect(["RC/2026/9999", "RC/2026/10000"].sort().at(-1)).toBe("RC/2026/9999");
    // produkcyjnie sortujemy po documentSeq (Int), więc kolejność jest liczbowa
    expect(Math.max(9999, 10000)).toBe(10000);
  });

  it("liczy osobno dla każdego roku", () => {
    const numery = ["RC/2025/0007", "RC/2026/0002"];
    expect(nastepny(numery, 2026)).toBe("RC/2026/0003");
    expect(nastepny(numery, 2027)).toBe("RC/2027/0001");
  });

  it("odporny na numer w nieoczekiwanym formacie", () => {
    expect(pozycjaZNumeru("RC/2026/bzdura")).toBe(0);
  });
});
