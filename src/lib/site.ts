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
  /**
   * Identyfikator podatkowy wystawcy — polski NIP albo niemiecki Steuernummer,
   * zależnie od kraju. Jedno pole, dwie nazwy zmiennej: DENEEU_ISSUER_TAX_ID ma
   * pierwszeństwo, DENEEU_ISSUER_NIP zostaje dla wdrożeń sprzed tej zmiany.
   */
  taxId:
    process.env.DENEEU_ISSUER_TAX_ID ||
    process.env.DENEEU_ISSUER_NIP ||
    "BRAK-ID-PODATKOWEGO",
  address: process.env.DENEEU_ISSUER_ADDRESS || "BRAK KONFIGURACJI — DENEEU_ISSUER_ADDRESS",
  city: process.env.DENEEU_ISSUER_CITY || "BRAK",
  postalCode: process.env.DENEEU_ISSUER_POSTAL_CODE || "00-000",
  country: process.env.DENEEU_ISSUER_COUNTRY || "BRAK KONFIGURACJI — DENEEU_ISSUER_COUNTRY",

  /**
   * Rachunek do wpłat. DENEEU_ISSUER_BANK_IBAN ma pierwszeństwo, ale
   * DENEEU_BANK_ACCOUNT zostaje działający — obie nazwy opisują to samo, więc
   * druga jest zapasem, a nie osobnym ustawieniem, które mogłoby się rozjechać.
   */
  bankIban: process.env.DENEEU_ISSUER_BANK_IBAN || process.env.DENEEU_BANK_ACCOUNT || "",
  bankBic: process.env.DENEEU_ISSUER_BANK_BIC || "",

  /**
   * Zwolnienie z VAT — niemiecki Kleinunternehmer wg § 19 UStG.
   *
   * Świadomie wymaga dosłownego "true": literówka w zmiennej ma dać stawkę
   * podstawową, a nie po cichu wystawić fakturę bez podatku. Pomyłka w tę
   * stronę jest odwracalna korektą, w drugą — to zaniżony podatek.
   */
  vatFree: process.env.DENEEU_ISSUER_VAT_FREE === "true",
} as const;

/** Adres wystawcy w jednej linii: „ul. Prosta 51, 00-838 Warszawa, Germany”. */
export function adresWystawcy(): string {
  return `${ISSUER.address}, ${ISSUER.postalCode} ${ISSUER.city}, ${ISSUER.country}`;
}

/**
 * Nota wymagana na fakturze zwolnionej z VAT.
 *
 * § 19 UStG nakazuje wskazać podstawę zwolnienia — bez tego zdania faktura
 * małego przedsiębiorcy jest wadliwa, a nabywca może ją odrzucić.
 */
export const NOTA_KLEINUNTERNEHMER =
  "Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.";

/** Czy dane wystawcy są kompletne — sprawdzane przed wystawieniem faktury. */
/**
 * Czy wystawca ma komplet danych do wystawienia faktury.
 *
 * Kraj i rachunek doszły razem z obsługą wystawcy niemieckiego: bez kraju
 * adres na fakturze jest niepełny przy sprzedaży transgranicznej, a bez
 * rachunku nabywca nie ma dokąd zapłacić. Numer BIC nie jest wymagany —
 * przy przelewach w SEPA wystarcza sam IBAN.
 */
export function issuerSkonfigurowany(): boolean {
  return Boolean(
    process.env.DENEEU_ISSUER_NAME &&
      (process.env.DENEEU_ISSUER_TAX_ID || process.env.DENEEU_ISSUER_NIP) &&
      process.env.DENEEU_ISSUER_ADDRESS &&
      process.env.DENEEU_ISSUER_CITY &&
      process.env.DENEEU_ISSUER_POSTAL_CODE &&
      process.env.DENEEU_ISSUER_COUNTRY &&
      (process.env.DENEEU_ISSUER_BANK_IBAN || process.env.DENEEU_BANK_ACCOUNT),
  );
}
