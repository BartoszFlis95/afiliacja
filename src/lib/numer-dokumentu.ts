/**
 * Numeracja rachunków dla influencerów.
 *
 * Numer był liczony niezależnie w dwóch miejscach: lista dokumentów szła po
 * `orderBy requestedAt asc` z licznikiem, a trasa PDF robiła `count()` po
 * `requestedAt <= tego wypłaty`. Przy dwóch wypłatach z tym samym znacznikiem
 * czasu te dwa sposoby dawały różne wyniki — lista pokazywała RC/2026/0003,
 * a pobrany PDF twierdził RC/2026/0004.
 *
 * Rozstrzygnięcie remisu po `id` sprawia, że oba miejsca dają tę samą
 * kolejność. UWAGA: numer nadal NIE jest zapisywany w bazie — patrz
 * ODNOSNIK_NIETRWALY_NUMER poniżej.
 */

export function formatujNumerDokumentu(rok: number, pozycja: number): string {
  return `RC/${rok}/${String(pozycja).padStart(4, "0")}`;
}

/**
 * ODNOSNIK_NIETRWALY_NUMER
 *
 * Numer wyliczany przy każdym renderze zależy od kolejności wypłat, a
 * `requestedAt` jest przestawiane przy ponowieniu po cofniętym transferze
 * (commission.actions.ts — reset przesuwa klucz idempotencji Stripe'a).
 * Wypłata przesunięta w czasie zmienia pozycję pozostałych, więc dokument
 * pobrany jako RC/2026/0005 może później wyrenderować się jako RC/2026/0004.
 *
 * Trwałe rozwiązanie wymaga kolumny Payout.documentNumber nadawanej w chwili
 * przejścia wypłaty w COMPLETED, plus backfillu istniejących wierszy.
 */

/** Kolejność musi być identyczna wszędzie, gdzie liczymy pozycję. */
export const KOLEJNOSC_DOKUMENTOW = [
  { requestedAt: "asc" as const },
  { id: "asc" as const },
];
