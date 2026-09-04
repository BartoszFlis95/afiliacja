import { OPLATA_PLATFORMY } from "@/lib/legal";

/**
 * Strefa, w której liczymy okresy rozliczeniowe.
 *
 * Musi być jawna, a nie wzięta ze strefy procesu: lokalnie proces chodzi
 * w czasie warszawskim, a na Vercelu w UTC. Przy `new Date(rok, miesiac-1, 1)`
 * prowizja z 1 sierpnia o 01:00 czasu warszawskiego trafiała na produkcji do
 * lipca — kwoty się zgadzały, ale przypisanie do okresu było przesunięte
 * o dwie godziny i zależało od tego, gdzie stoi serwer.
 */
const STREFA = "Europe/Warsaw";

const FORMATER = new Intl.DateTimeFormat("en-US", {
  timeZone: STREFA,
  hour12: false,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

/** Przesunięcie strefy względem UTC w danej chwili, w milisekundach. */
function przesuniecieStrefy(chwila: Date): number {
  const czesci = Object.fromEntries(
    FORMATER.formatToParts(chwila).map((p) => [p.type, p.value]),
  ) as Record<string, string>;

  const jakoUtc = Date.UTC(
    Number(czesci.year),
    Number(czesci.month) - 1,
    Number(czesci.day),
    // o północy czasu lokalnego formater zwraca "24" zamiast "00"
    Number(czesci.hour) % 24,
    Number(czesci.minute),
    Number(czesci.second),
  );
  return jakoUtc - Math.floor(chwila.getTime() / 1000) * 1000;
}

/** Chwila odpowiadająca podanemu czasowi ściennemu w STREFIE. */
function chwilaLokalna(
  rok: number,
  miesiac: number,
  dzien: number,
  godz: number,
  min: number,
  sek: number,
  ms: number,
): Date {
  const naiwna = Date.UTC(rok, miesiac - 1, dzien, godz, min, sek, ms);
  // Dwie iteracje: pierwsze przesunięcie liczymy w złej chwili, druga
  // koryguje przypadki przy zmianie czasu, gdy przesunięcie się zmienia.
  const pierwsze = przesuniecieStrefy(new Date(naiwna));
  const drugie = przesuniecieStrefy(new Date(naiwna - pierwsze));
  return new Date(naiwna - drugie);
}

/** Liczba dni w miesiącu — liczona w UTC, bo zależy tylko od kalendarza. */
function dniWMiesiacu(rok: number, miesiac: number): number {
  return new Date(Date.UTC(rok, miesiac, 0)).getUTCDate();
}

/**
 * Granice miesiąca kalendarzowego w czasie warszawskim, zwrócone jako chwile.
 *
 * `od` to północ pierwszego dnia, `do` to ostatnia milisekunda ostatniego dnia
 * — oba czasu warszawskiego, niezależnie od strefy, w której działa proces.
 */
export function granceMiesiaca(rok: number, miesiac: number) {
  const od = chwilaLokalna(rok, miesiac, 1, 0, 0, 0, 0);
  const do_ = chwilaLokalna(rok, miesiac, dniWMiesiacu(rok, miesiac), 23, 59, 59, 999);
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
