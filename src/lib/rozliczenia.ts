import { OPLATA_PLATFORMY } from "@/lib/legal";

/** Granice miesiąca kalendarzowego w czasie lokalnym serwera. */
export function granceMiesiaca(rok: number, miesiac: number) {
  const od = new Date(rok, miesiac - 1, 1, 0, 0, 0, 0);
  const do_ = new Date(rok, miesiac, 0, 23, 59, 59, 999);
  return { od, do: do_ };
}

const MIESIACE = [
  "styczeń", "luty", "marzec", "kwiecień", "maj", "czerwiec",
  "lipiec", "sierpień", "wrzesień", "październik", "listopad", "grudzień",
];

export function nazwaMiesiaca(miesiac: number): string {
  return MIESIACE[miesiac - 1] ?? String(miesiac);
}

/** Zaokrąglenie do groszy — bez tego sumy prowizji rozjeżdżają się o ułamki. */
export function doGroszy(kwota: number): number {
  return Math.round(kwota * 100) / 100;
}

/**
 * Rozbicie kwoty faktury zbiorczej.
 *
 * Marka płaci pełną kwotę prowizji influencerów powiększoną o opłatę
 * platformy — z tych środków platforma realizuje potem wypłaty. Opłata jest
 * doliczana, a nie potrącana, więc wynagrodzenie influencera nie maleje.
 */
export function rozbicieFaktury(sumaProwizji: number) {
  const prowizje = doGroszy(sumaProwizji);
  const oplata = doGroszy(prowizje * OPLATA_PLATFORMY);
  return { prowizje, oplata, netto: doGroszy(prowizje + oplata) };
}

/**
 * Pierwszy element na każdy klucz, w kolejności wejściowej.
 *
 * Zamiennik `new Map(items.map(i => [klucz(i), i]))`, który przy powtórzonym
 * kluczu zostawia OSTATNI wpis. Przy liście posortowanej malejąco po dacie
 * dawało to najstarszy rekord zamiast najnowszego — a na nim działały
 * przyciski w panelu.
 */
export function pierwszyWgKlucza<T, K>(items: T[], klucz: (item: T) => K): Map<K, T> {
  const wynik = new Map<K, T>();
  for (const item of items) {
    const k = klucz(item);
    if (!wynik.has(k)) wynik.set(k, item);
  }
  return wynik;
}
