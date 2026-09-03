/**
 * Walidacja IBAN — jedno miejsce dla formularza ustawień i wniosku o wypłatę.
 *
 * Wcześniej regex żył tylko w bank.schema.ts, więc requestPayoutAction
 * przyjmowała numer konta bez żadnego sprawdzenia poza "niepusty".
 */

export const IBAN_REGEX = /^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/;

/** Usuwa spacje i podnosi wielkość liter — postać do sprawdzania i zapisu. */
export function normalizujIban(iban: string): string {
  return iban.replace(/\s/g, "").toUpperCase();
}

export function poprawnyIban(iban: string): boolean {
  const czysty = normalizujIban(iban);
  // 15 to najkrótszy IBAN w obiegu (Norwegia), 34 to maksimum wg ISO 13616
  if (czysty.length < 15 || czysty.length > 34) return false;
  return IBAN_REGEX.test(czysty);
}

/**
 * Czy ciąg nadaje się na cel wypłaty.
 *
 * Pole "numer konta" niesie IBAN albo e-mail PayPal — zależnie od tego, co
 * influencer wybrał w ustawieniach (PayoutModal.getSavedAccountString).
 * Sprawdzanie samego IBAN-u odcięłoby wypłaty PayPal.
 */
export function poprawneKontoWyplaty(wartosc: string): boolean {
  const v = wartosc.trim();
  if (v.length > 64) return false;
  if (poprawnyIban(v)) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
}
