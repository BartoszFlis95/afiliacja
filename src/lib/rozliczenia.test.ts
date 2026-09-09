import { describe, expect, it } from "vitest";
import {
  biezacyOkres,
  dataZDniem,
  okresZamkniety,
  pierwszyDzienPoOkresie,
  doGroszy,
  granceMiesiaca,
  nazwaMiesiaca,
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


/**
 * Panel rozliczeń odtwarza rozbicie z kwoty netto zapisanej na fakturze:
 * netto = prowizje * (1 + stawka), więc prowizje = netto / (1 + stawka).
 * Zaokrąglenia mogą to rozjechać, a admin zobaczyłby wtedy inne liczby niż
 * te, na podstawie których fakturę wystawiono.
 */
describe("odtworzenie rozbicia z kwoty netto", () => {
  const odtworz = (netto: number) => {
    const prowizje = doGroszy(netto / (1 + 0.1));
    return { prowizje, oplata: doGroszy(netto - prowizje) };
  };

  it("dla okrągłych kwot wraca dokładnie to samo", () => {
    const oryginal = rozbicieFaktury(1000);
    const wrocone = odtworz(oryginal.netto);
    expect(wrocone.prowizje).toBe(oryginal.prowizje);
    expect(wrocone.oplata).toBe(oryginal.oplata);
  });

  it("suma odtworzonych składników zawsze równa się netto", () => {
    for (const kwota of [0.01, 19.99, 333.33, 1234.56, 99999.99, 7.77]) {
      const oryginal = rozbicieFaktury(kwota);
      const wrocone = odtworz(oryginal.netto);
      expect(doGroszy(wrocone.prowizje + wrocone.oplata)).toBe(oryginal.netto);
    }
  });

  it("odchylenie od oryginału nigdy nie przekracza grosza", () => {
    for (const kwota of [0.01, 0.07, 19.99, 333.33, 1234.56, 99999.99]) {
      const oryginal = rozbicieFaktury(kwota);
      const wrocone = odtworz(oryginal.netto);
      expect(Math.abs(wrocone.prowizje - oryginal.prowizje)).toBeLessThanOrEqual(0.01);
      expect(Math.abs(wrocone.oplata - oryginal.oplata)).toBeLessThanOrEqual(0.01);
    }
  });
});

describe("okresZamkniety", () => {
  // 15 sierpnia 2026, 12:00 czasu warszawskiego
  const wSierpniu = new Date("2026-08-15T10:00:00Z");

  it("bieżący miesiąc jest otwarty", () => {
    expect(okresZamkniety(2026, 8, wSierpniu)).toBe(false);
  });

  it("poprzedni i starsze są zamknięte", () => {
    expect(okresZamkniety(2026, 7, wSierpniu)).toBe(true);
    expect(okresZamkniety(2025, 12, wSierpniu)).toBe(true);
  });

  it("przyszłe są otwarte", () => {
    expect(okresZamkniety(2026, 9, wSierpniu)).toBe(false);
    expect(okresZamkniety(2027, 1, wSierpniu)).toBe(false);
  });

  it("grudzień poprzedniego roku liczy się poprawnie na przełomie", () => {
    const wStyczniu = new Date("2026-01-10T10:00:00Z");
    expect(okresZamkniety(2025, 12, wStyczniu)).toBe(true);
    expect(okresZamkniety(2026, 1, wStyczniu)).toBe(false);
  });

  it("przełom miesiąca liczy się w strefie warszawskiej, nie w UTC", () => {
    // 31 sierpnia 23:30 UTC = 1 września 01:30 w Warszawie (UTC+2)
    const przelom = new Date("2026-08-31T23:30:00Z");
    expect(biezacyOkres(przelom)).toEqual({ rok: 2026, miesiac: 9 });
    // sierpień jest już zamknięty, mimo że w UTC wciąż trwa
    expect(okresZamkniety(2026, 8, przelom)).toBe(true);
  });

  it("odwrotny przełom: 1 września 00:30 UTC to nadal 02:30 w Warszawie", () => {
    const po = new Date("2026-09-01T00:30:00Z");
    expect(biezacyOkres(po)).toEqual({ rok: 2026, miesiac: 9 });
  });
});

describe("pierwszyDzienPoOkresie", () => {
  it("zwraca kolejny miesiąc", () => {
    expect(pierwszyDzienPoOkresie(2026, 8)).toEqual({ rok: 2026, miesiac: 9 });
  });

  it("grudzień przechodzi na styczeń kolejnego roku", () => {
    expect(pierwszyDzienPoOkresie(2026, 12)).toEqual({ rok: 2027, miesiac: 1 });
  });
});

describe("dataZDniem", () => {
  it("używa dopełniacza — po liczebniku dnia mianownik jest błędny", () => {
    expect(dataZDniem(1, 10, 2026)).toBe("1 października 2026");
    expect(dataZDniem(1, 9, 2026)).toBe("1 września 2026");
    expect(dataZDniem(1, 1, 2027)).toBe("1 stycznia 2027");
  });

  it("żaden miesiąc nie zostaje w mianowniku", () => {
    // porównanie dokładne, nie toContain: dopełniacz „maja” zawiera
    // mianownik „maj” jako podciąg, więc podciągowa asercja dawałaby
    // fałszywy alarm akurat dla maja
    for (let m = 1; m <= 12; m++) {
      const czlon = dataZDniem(1, m, 2026).split(" ")[1];
      expect(czlon).not.toBe(nazwaMiesiaca(m));
    }
  });
});
