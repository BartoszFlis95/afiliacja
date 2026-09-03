/**
 * Kanoniczny adres serwisu — jedno źródło prawdy.
 *
 * Był powielony w sitemap.ts, robots.ts, layout.tsx (metadataBase) i jako
 * fallback w resend.ts. W tym ostatnim miejscu ZDĄŻYŁ SIĘ ROZJECHAĆ: wszędzie
 * indziej "https://www.deneeu.pl", tam "https://deneeu.pl" bez www.
 *
 * To nie jest kosmetyka. getAppUrl() buduje linki weryfikacji e-maila i resetu
 * hasła, a te niosą jednorazowy token w query stringu. Jeśli przekierowanie
 * apex -> www nie zachowuje query stringa, taki link cicho traci token i
 * użytkownik dostaje komunikat o nieprawidłowym linku, nie wiedząc dlaczego.
 */
export const CANONICAL_URL = "https://www.deneeu.pl";


/**
 * Dane wystawcy faktur.
 *
 * Faktura ZAPISUJE MIGAWKĘ tych danych w momencie wystawienia (pola issuer*
 * w modelu Invoice) — dokument księgowy nie może się zmienić, gdy później
 * zmienimy dane firmy. Ale generowanie faktury nigdy tych pól nie ustawiało,
 * więc Prisma wstawiała wartości domyślne ze schematu: NIP "0000000000"
 * i adres "ul. Przykładowa 1". Każda wystawiona faktura miała fikcyjny NIP
 * sprzedawcy, a taka faktura jest w Polsce nieważna — nabywca nie odliczy
 * z niej VAT-u.
 *
 * Wartości pochodzą ze zmiennych środowiskowych, żeby dało się je ustawić bez
 * zmiany kodu. Fallbacki są celowo widoczne jako zaślepki, a nie prawdopodobne
 * dane — jeśli ktoś zapomni ustawić zmienne, ma to rzucać się w oczy na
 * pierwszej fakturze, a nie przejść niezauważone.
 */
export const ISSUER = {
  name: process.env.DENEEU_ISSUER_NAME || "BRAK KONFIGURACJI — DENEEU_ISSUER_NAME",
  nip: process.env.DENEEU_ISSUER_NIP || "BRAK-NIP",
  address: process.env.DENEEU_ISSUER_ADDRESS || "BRAK KONFIGURACJI — DENEEU_ISSUER_ADDRESS",
  city: process.env.DENEEU_ISSUER_CITY || "BRAK",
  postalCode: process.env.DENEEU_ISSUER_POSTAL_CODE || "00-000",
} as const;

/** Czy dane wystawcy są kompletne — sprawdzane przed wystawieniem faktury. */
export function issuerSkonfigurowany(): boolean {
  return Boolean(
    process.env.DENEEU_ISSUER_NAME &&
      process.env.DENEEU_ISSUER_NIP &&
      process.env.DENEEU_ISSUER_ADDRESS &&
      process.env.DENEEU_ISSUER_CITY &&
      process.env.DENEEU_ISSUER_POSTAL_CODE,
  );
}
