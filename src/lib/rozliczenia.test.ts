import { describe, expect, it } from "vitest";
import {
  doGroszy,
  granceMiesiaca,
  nazwaMiesiaca,
  pierwszyWgKlucza,
  rozbicieFaktury,
} from "./rozliczenia";

describe("granceMiesiaca", () => {
  it("obejmuje cały miesiąc, do ostatniej milisekundy", () => {
    const { od, do: koniec } = granceMiesiaca(2026, 2);
    expect(od.getDate()).toBe(1);
    expect(od.getMonth()).toBe(1);
    expect(koniec.getDate()).toBe(28); // 2026 nie jest przestępny
    expect(koniec.getMilliseconds()).toBe(999);
  });

  it("radzi sobie z grudniem, nie przechodząc na kolejny rok", () => {
    const { od, do: koniec } = granceMiesiaca(2026, 12);
    expect(od.getFullYear()).toBe(2026);
    expect(koniec.getFullYear()).toBe(2026);
    expect(koniec.getDate()).toBe(31);
  });

  it("łapie rok przestępny", () => {
    expect(granceMiesiaca(2028, 2).do.getDate()).toBe(29);
  });
});

describe("rozbicieFaktury", () => {
  it("dolicza opłatę platformy, zamiast ją potrącać", () => {
    const r = rozbicieFaktury(1000);
    expect(r.prowizje).toBe(1000);
    expect(r.oplata).toBe(100);
    expect(r.netto).toBe(1100);
  });

  it("zaokrągla do groszy", () => {
    // 333.33 * 0.1 = 33.333 -> 33.33
    const r = rozbicieFaktury(333.33);
    expect(r.oplata).toBe(33.33);
    expect(r.netto).toBe(366.66);
  });

  it("netto zawsze równe sumie składników", () => {
    for (const kwota of [0, 0.01, 19.99, 1234.56, 99999.99]) {
      const r = rozbicieFaktury(kwota);
      expect(r.netto).toBe(doGroszy(r.prowizje + r.oplata));
    }
  });
});

describe("nazwaMiesiaca", () => {
  it("zwraca polskie nazwy", () => {
    expect(nazwaMiesiaca(1)).toBe("styczeń");
    expect(nazwaMiesiaca(12)).toBe("grudzień");
  });
});

describe("pierwszyWgKlucza", () => {
  const faktury = [
    { id: "nowa", brandId: "a", wystawiona: "2026-08-20" },
    { id: "stara", brandId: "a", wystawiona: "2026-08-02" },
    { id: "inna", brandId: "b", wystawiona: "2026-08-10" },
  ];

  it("przy powtórzonym kluczu zostawia PIERWSZY, nie ostatni", () => {
    // regresja: new Map(...) zostawiał ostatni wpis, czyli przy sortowaniu
    // malejącym po dacie — najstarszą fakturę
    const mapa = pierwszyWgKlucza(faktury, (f) => f.brandId);
    expect(mapa.get("a")?.id).toBe("nowa");
    expect(mapa.get("b")?.id).toBe("inna");
  });

  it("dla porównania: new Map zostawiłby najstarszą", () => {
    const zla = new Map(faktury.map((f) => [f.brandId, f]));
    expect(zla.get("a")?.id).toBe("stara");
  });

  it("radzi sobie z pustą listą", () => {
    expect(pierwszyWgKlucza([], (x) => x).size).toBe(0);
  });
});
