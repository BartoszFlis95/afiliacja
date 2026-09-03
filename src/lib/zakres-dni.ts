/**
 * Dozwolone zakresy statystyk.
 *
 * Typ `days: 7 | 30 | 90` znika w runtime, a akcja serwerowa jest publicznym
 * endpointem — bez tego `days: 1e9` dawało zapytanie po dacie sprzed tysięcy
 * lat, czyli skan całego zbioru wywołującego.
 */

export const DOZWOLONE_ZAKRESY = [7, 30, 90] as const;
export type ZakresDni = (typeof DOZWOLONE_ZAKRESY)[number];

export function zawezZakres(days: number): ZakresDni {
  return DOZWOLONE_ZAKRESY.includes(days as ZakresDni) ? (days as ZakresDni) : 30;
}
