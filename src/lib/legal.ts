/**
 * Wersja dokumentów prawnych.
 *
 * Zapisywana na koncie przy akceptacji (User.tosVersion). Podniesienie tej
 * stałej po istotnej zmianie regulaminu sprawia, że bramka w middleware
 * poprosi o ponowną zgodę — bez kasowania historii poprzednich akceptacji.
 */
export const WERSJA_REGULAMINU = "1.0";

/** Data ostatniej aktualizacji, wyświetlana na stronach prawnych. */
export const DATA_AKTUALIZACJI = "3 września 2026";

/** Ile dni marka ma na opłacenie faktury zbiorczej. */
export const TERMIN_PLATNOSCI_DNI = 7;

/** Ile dni marka ma na zatwierdzenie lub odrzucenie konwersji. */
export const TERMIN_ZATWIERDZENIA_DNI = 14;

/** Udział platformy w prowizji, doliczany marce do faktury. */
export const OPLATA_PLATFORMY = 0.1;
