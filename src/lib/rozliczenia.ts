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

const MIESIACE_DOPELNIACZ = [
  "stycznia", "lutego", "marca", "kwietnia", "maja", "czerwca",
  "lipca", "sierpnia", "września", "października", "listopada", "grudnia",
];

/**
 * Nazwa miesiąca w dopełniaczu — do dat z dniem („1 października 2026”).
 * Mianownik po liczebniku brzmi błędnie: „1 październik 2026”.
 */
export function dataZDniem(dzien: number, miesiac: number, rok: number): string {
  return `${dzien} ${MIESIACE_DOPELNIACZ[miesiac - 1] ?? miesiac} ${rok}`;
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
 * Bieżący okres rozliczeniowy w STREFIE, nie w strefie procesu.
 *
 * Rozróżnienie „miesiąc trwa” / „miesiąc zamknięty” musi używać tego samego
 * zegara co granceMiesiaca. Inaczej 1 września o 00:30 czasu warszawskiego
 * serwer w UTC (jest wtedy 31 sierpnia 22:30) uznałby sierpień za wciąż
 * otwarty i zablokował fakturę, którą wolno już wystawić.
 */
export function biezacyOkres(teraz: Date = new Date()): { rok: number; miesiac: number } {
  const czesci = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: STREFA,
      year: "numeric",
      month: "2-digit",
    })
      .formatToParts(teraz)
      .map((p) => [p.type, p.value]),
  ) as Record<string, string>;

  return { rok: Number(czesci.year), miesiac: Number(czesci.month) };
}

/**
 * Czy okres jest już zamknięty, czyli czy wolno za niego fakturować.
 *
 * Miesiąc bieżący i każdy przyszły są otwarte — w trwającym mogą jeszcze
 * dojść prowizje, a faktura obejmowałaby wtedy część okresu i musiałaby być
 * korygowana.
 */
export function okresZamkniety(rok: number, miesiac: number, teraz: Date = new Date()): boolean {
  const b = biezacyOkres(teraz);
  return rok * 12 + miesiac < b.rok * 12 + b.miesiac;
}

/** Pierwszy dzień miesiąca następującego po podanym — data dostępności faktury. */
export function pierwszyDzienPoOkresie(rok: number, miesiac: number): { rok: number; miesiac: number } {
  return miesiac === 12 ? { rok: rok + 1, miesiac: 1 } : { rok, miesiac: miesiac + 1 };
}
