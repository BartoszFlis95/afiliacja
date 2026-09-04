import { describe, expect, it } from "vitest";
import {
  doGroszy,
  granceMiesiaca,
  nazwaMiesiaca,
  pierwszyWgKlucza,
  rozbicieFaktury,
} from "./rozliczenia";

describe("granceMiesiaca", () => {
  // Asercje na czasie UNIWERSALNYM (toISOString), nie na getDate()/getMonth() —
  // te ostatnie czytają strefę procesu, więc test przechodziłby lub nie
  // zależnie od maszyny, czyli sprawdzałby coś innego niż zamierzone.

  it("czas letni: sierpień zaczyna się o 22:00 UTC dnia poprzedniego (UTC+2)", () => {
    const { od, do: koniec } = granceMiesiaca(2026, 8);
    expect(od.toISOString()).toBe("2026-07-31T22:00:00.000Z");
    expect(koniec.toISOString()).toBe("2026-08-31T21:59:59.999Z");
  });

  it("czas zimowy: styczeń zaczyna się o 23:00 UTC dnia poprzedniego (UTC+1)", () => {
    const { od, do: koniec } = granceMiesiaca(2026, 1);
    expect(od.toISOString()).toBe("2025-12-31T23:00:00.000Z");
    expect(koniec.toISOString()).toBe("2026-01-31T22:59:59.999Z");
  });

  it("marzec: zaczyna się w czasie zimowym, kończy w letnim", () => {
    const { od, do: koniec } = granceMiesiaca(2026, 3);
    expect(od.toISOString()).toBe("2026-02-28T23:00:00.000Z");   // UTC+1
    expect(koniec.toISOString()).toBe("2026-03-31T21:59:59.999Z"); // UTC+2
  });

  it("październik: zaczyna się w czasie letnim, kończy w zimowym", () => {
    const { od, do: koniec } = granceMiesiaca(2026, 10);
    expect(od.toISOString()).toBe("2026-09-30T22:00:00.000Z");   // UTC+2
    expect(koniec.toISOString()).toBe("2026-10-31T22:59:59.999Z"); // UTC+1
  });

  it("grudzień nie przechodzi na kolejny rok", () => {
    const { od, do: koniec } = granceMiesiaca(2026, 12);
    expect(od.toISOString()).toBe("2026-11-30T23:00:00.000Z");
    expect(koniec.toISOString()).toBe("2026-12-31T22:59:59.999Z");
  });

  it("łapie rok przestępny — luty 2028 ma 29 dni", () => {
    expect(granceMiesiaca(2028, 2).do.toISOString()).toBe("2028-02-29T22:59:59.999Z");
  });

  it("kolejne miesiące stykają się bez luki i bez zakładki", () => {
    const lipiec = granceMiesiaca(2026, 7);
    const sierpien = granceMiesiaca(2026, 8);
    expect(sierpien.od.getTime() - lipiec.do.getTime()).toBe(1);
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
