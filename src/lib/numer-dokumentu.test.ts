import { describe, expect, it } from "vitest";
import { formatujNumerDokumentu } from "./numer-dokumentu";

type Wyplata = { id: string; requestedAt: Date };

/** Odwzorowanie listy dokumentów: sortowanie + licznik bieżący. */
function numeryZListy(wyplaty: Wyplata[]): Map<string, string> {
  const posortowane = [...wyplaty].sort(
    (a, b) =>
      a.requestedAt.getTime() - b.requestedAt.getTime() || a.id.localeCompare(b.id),
  );
  const licznikRoku = new Map<number, number>();
  const wynik = new Map<string, string>();
  for (const w of posortowane) {
    const rok = w.requestedAt.getFullYear();
    const poz = (licznikRoku.get(rok) ?? 0) + 1;
    licznikRoku.set(rok, poz);
    wynik.set(w.id, formatujNumerDokumentu(rok, poz));
  }
  return wynik;
}

/** Odwzorowanie trasy PDF: count() z rozstrzygnięciem remisu po id. */
function numerZTrasy(wyplaty: Wyplata[], id: string): string {
  const ta = wyplaty.find((w) => w.id === id)!;
  const rok = ta.requestedAt.getFullYear();
  const poczatek = new Date(rok, 0, 1).getTime();
  const seq = wyplaty.filter((w) => {
    const t = w.requestedAt.getTime();
    const wczesniej = t >= poczatek && t < ta.requestedAt.getTime();
    const remis = t === ta.requestedAt.getTime() && w.id <= ta.id;
    return wczesniej || remis;
  }).length;
  return formatujNumerDokumentu(rok, seq);
}

const d = (iso: string) => new Date(iso);

describe("numeracja dokumentów", () => {
  it("formatuje numer z zerami wiodącymi", () => {
    expect(formatujNumerDokumentu(2026, 5)).toBe("RC/2026/0005");
    expect(formatujNumerDokumentu(2026, 1234)).toBe("RC/2026/1234");
  });

  it("lista i PDF dają ten sam numer przy różnych znacznikach czasu", () => {
    const w: Wyplata[] = [
      { id: "a", requestedAt: d("2026-01-05T10:00:00Z") },
      { id: "b", requestedAt: d("2026-03-10T10:00:00Z") },
      { id: "c", requestedAt: d("2026-07-20T10:00:00Z") },
    ];
    const zListy = numeryZListy(w);
    for (const p of w) expect(numerZTrasy(w, p.id)).toBe(zListy.get(p.id));
  });

  it("lista i PDF zgadzają się także przy identycznym znaczniku czasu", () => {
    // regresja: bez rozstrzygnięcia po id lista dawała 0002 i 0003,
    // a oba PDF-y twierdziły 0003
    const t = d("2026-02-01T12:00:00.000Z");
    const w: Wyplata[] = [
      { id: "a", requestedAt: d("2026-01-01T00:00:00Z") },
      { id: "b", requestedAt: t },
      { id: "c", requestedAt: t },
    ];
    const zListy = numeryZListy(w);
    for (const p of w) expect(numerZTrasy(w, p.id)).toBe(zListy.get(p.id));
    // i numery są różne, nie zduplikowane
    expect(new Set(zListy.values()).size).toBe(3);
  });

  it("numeracja startuje od nowa w każdym roku", () => {
    const w: Wyplata[] = [
      { id: "a", requestedAt: d("2025-11-01T10:00:00Z") },
      { id: "b", requestedAt: d("2026-01-02T10:00:00Z") },
    ];
    const zListy = numeryZListy(w);
    expect(zListy.get("a")).toBe("RC/2025/0001");
    expect(zListy.get("b")).toBe("RC/2026/0001");
    expect(numerZTrasy(w, "b")).toBe("RC/2026/0001");
  });
});
